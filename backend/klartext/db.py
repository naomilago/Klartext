import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

DB_PATH = Path(os.environ.get("KLARTEXT_DB_PATH", str(Path(__file__).parent.parent / "klartext.db")))
GMT_MINUS_3 = timezone(timedelta(hours=-3))


def now_iso():
    return datetime.now(GMT_MINUS_3).isoformat()


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                started_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS exercise_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                total_questions INTEGER NOT NULL,
                correct_count INTEGER NOT NULL DEFAULT 0,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                closing_message TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS exercise_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                position INTEGER NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'resposta_livre',
                question TEXT NOT NULL,
                options TEXT,
                user_answer TEXT,
                is_correct INTEGER,
                feedback TEXT,
                corrected_answer TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES exercise_sessions (id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS vocab_progress (
                word TEXT PRIMARY KEY,
                theme TEXT NOT NULL,
                gloss TEXT NOT NULL,
                times_shown INTEGER NOT NULL DEFAULT 0,
                times_correct INTEGER NOT NULL DEFAULT 0,
                times_incorrect INTEGER NOT NULL DEFAULT 0,
                last_correct INTEGER,
                last_shown_at TEXT
            )
        """)
        _add_column_if_missing(conn, "exercise_items", "seed_word", "TEXT")
        conn.commit()


def _add_column_if_missing(conn, table, column, coltype):
    existing = {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
    if column not in existing:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {coltype}")


# --- Chat sessions -----------------------------------------------------

def create_chat_session(conn):
    now = now_iso()
    cursor = conn.execute(
        "INSERT INTO chat_sessions (title, started_at, updated_at) VALUES (?, ?, ?)",
        (None, now, now),
    )
    conn.commit()
    return cursor.lastrowid


def touch_chat_session(conn, session_id):
    conn.execute(
        "UPDATE chat_sessions SET updated_at = ? WHERE id = ?", (now_iso(), session_id)
    )
    conn.commit()


def set_chat_title(conn, session_id, title):
    conn.execute("UPDATE chat_sessions SET title = ? WHERE id = ?", (title, session_id))
    conn.commit()


def get_chat_session(conn, session_id):
    return conn.execute(
        "SELECT * FROM chat_sessions WHERE id = ?", (session_id,)
    ).fetchone()


def list_chat_sessions(conn):
    return conn.execute("SELECT * FROM chat_sessions ORDER BY updated_at DESC").fetchall()


def add_chat_message(conn, session_id, role, content):
    conn.execute(
        "INSERT INTO chat_messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
        (session_id, role, content, now_iso()),
    )
    conn.commit()


def get_chat_messages(conn, session_id):
    return conn.execute(
        "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id",
        (session_id,),
    ).fetchall()


# --- Exercise sessions ---------------------------------------------------

def create_exercise_session(conn, total_questions=10):
    now = now_iso()
    cursor = conn.execute(
        """INSERT INTO exercise_sessions
           (title, total_questions, correct_count, started_at, completed_at, closing_message)
           VALUES (?, ?, 0, ?, NULL, NULL)""",
        (None, total_questions, now),
    )
    conn.commit()
    return cursor.lastrowid


def get_exercise_session(conn, session_id):
    return conn.execute(
        "SELECT * FROM exercise_sessions WHERE id = ?", (session_id,)
    ).fetchone()


def list_exercise_sessions(conn):
    return conn.execute(
        "SELECT * FROM exercise_sessions ORDER BY started_at DESC"
    ).fetchall()


def set_exercise_title(conn, session_id, title):
    conn.execute(
        "UPDATE exercise_sessions SET title = ? WHERE id = ?", (title, session_id)
    )
    conn.commit()


def add_exercise_item(
    conn, session_id, position, category, question, item_type="resposta_livre", options_json=None, seed_word=None
):
    conn.execute(
        """INSERT INTO exercise_items
           (session_id, position, category, type, question, options, seed_word, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (session_id, position, category, item_type, question, options_json, seed_word, now_iso()),
    )
    conn.commit()


def get_exercise_items(conn, session_id):
    return conn.execute(
        "SELECT * FROM exercise_items WHERE session_id = ? ORDER BY position",
        (session_id,),
    ).fetchall()


def get_current_item(conn, session_id):
    return conn.execute(
        """SELECT * FROM exercise_items
           WHERE session_id = ? AND user_answer IS NULL
           ORDER BY position LIMIT 1""",
        (session_id,),
    ).fetchone()


def answer_exercise_item(conn, item_id, user_answer, is_correct, feedback, corrected_answer):
    conn.execute(
        """UPDATE exercise_items
           SET user_answer = ?, is_correct = ?, feedback = ?, corrected_answer = ?
           WHERE id = ?""",
        (user_answer, int(is_correct), feedback, corrected_answer, item_id),
    )
    conn.commit()


def increment_correct_count(conn, session_id):
    conn.execute(
        "UPDATE exercise_sessions SET correct_count = correct_count + 1 WHERE id = ?",
        (session_id,),
    )
    conn.commit()


def complete_exercise_session(conn, session_id, closing_message):
    conn.execute(
        "UPDATE exercise_sessions SET completed_at = ?, closing_message = ? WHERE id = ?",
        (now_iso(), closing_message, session_id),
    )
    conn.commit()


# --- Deleting --------------------------------------------------------------

def delete_chat_session(conn, session_id):
    conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    conn.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
    conn.commit()


def delete_all_chat_sessions(conn):
    conn.execute("DELETE FROM chat_messages")
    conn.execute("DELETE FROM chat_sessions")
    conn.commit()


def delete_exercise_session(conn, session_id):
    conn.execute("DELETE FROM exercise_items WHERE session_id = ?", (session_id,))
    conn.execute("DELETE FROM exercise_sessions WHERE id = ?", (session_id,))
    conn.commit()


def delete_all_exercise_sessions(conn):
    conn.execute("DELETE FROM exercise_items")
    conn.execute("DELETE FROM exercise_sessions")
    conn.commit()


# --- Vocabulary progress (spaced repetition) --------------------------------

def get_vocab_progress(conn):
    rows = conn.execute("SELECT * FROM vocab_progress").fetchall()
    return {row["word"]: dict(row) for row in rows}


def record_vocab_result(conn, word, theme, gloss, is_correct):
    if not word:
        return
    now = now_iso()
    existing = conn.execute("SELECT * FROM vocab_progress WHERE word = ?", (word,)).fetchone()
    if existing:
        conn.execute(
            """UPDATE vocab_progress
               SET times_shown = times_shown + 1,
                   times_correct = times_correct + ?,
                   times_incorrect = times_incorrect + ?,
                   last_correct = ?,
                   last_shown_at = ?
               WHERE word = ?""",
            (1 if is_correct else 0, 0 if is_correct else 1, int(is_correct), now, word),
        )
    else:
        conn.execute(
            """INSERT INTO vocab_progress
               (word, theme, gloss, times_shown, times_correct, times_incorrect, last_correct, last_shown_at)
               VALUES (?, ?, ?, 1, ?, ?, ?, ?)""",
            (word, theme, gloss, 1 if is_correct else 0, 0 if is_correct else 1, int(is_correct), now),
        )
    conn.commit()


# --- Report ------------------------------------------------------------------

def get_report_stats(conn):
    finished = conn.execute(
        "SELECT correct_count, total_questions FROM exercise_sessions WHERE completed_at IS NOT NULL"
    ).fetchall()
    exercise_count = len(finished)
    average_score_pct = (
        round(sum(r["correct_count"] / r["total_questions"] for r in finished) / exercise_count * 100)
        if exercise_count
        else None
    )

    category_rows = conn.execute(
        """SELECT category,
                  SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
                  COUNT(*) AS total
           FROM exercise_items
           WHERE is_correct IS NOT NULL
           GROUP BY category"""
    ).fetchall()
    category_breakdown = {row["category"]: {"correct": row["correct"], "total": row["total"]} for row in category_rows}

    vocab_rows = conn.execute("SELECT * FROM vocab_progress").fetchall()
    words_mastered = sum(1 for row in vocab_rows if row["times_correct"] >= 2)
    needs_review = [
        {"word": row["word"], "gloss": row["gloss"]}
        for row in vocab_rows
        if row["last_correct"] == 0
    ][:12]

    chat_count = conn.execute("SELECT COUNT(*) AS n FROM chat_sessions").fetchone()["n"]
    message_count = conn.execute("SELECT COUNT(*) AS n FROM chat_messages").fetchone()["n"]

    return {
        "exercise_count": exercise_count,
        "average_score_pct": average_score_pct,
        "category_breakdown": category_breakdown,
        "words_mastered": words_mastered,
        "words_total_seen": len(vocab_rows),
        "needs_review": needs_review,
        "chat_count": chat_count,
        "message_count": message_count,
    }
