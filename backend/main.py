import json
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from klartext import ai, db

db.init_db()

app = FastAPI(title="Klartext API")

# Pool reused across requests: lets us run independent Anthropic calls (e.g.
# evaluating an answer while generating the next question) concurrently instead
# of back-to-back, and lets title generation run after a response without
# making the triggering request wait for it.
_executor = ThreadPoolExecutor(max_workers=4)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageIn(BaseModel):
    content: str


class AnswerIn(BaseModel):
    answer: str


def _chat_preview(messages):
    for message in reversed(messages):
        if message["role"] == "user":
            return message["content"][:80]
    return ""


def _breakdown(items):
    breakdown = {}
    for item in items:
        if item["is_correct"] is None:
            continue
        stats = breakdown.setdefault(item["category"], {"correct": 0, "total": 0})
        stats["total"] += 1
        if item["is_correct"]:
            stats["correct"] += 1
    return breakdown


def _maybe_generate_chat_title(session_id):
    """Runs on a background thread — must never block the request that triggered it."""
    with db.get_conn() as conn:
        session = db.get_chat_session(conn, session_id)
        if session is None or session["title"] is not None:
            return
        messages = db.get_chat_messages(conn, session_id)
        if len(messages) < 2:
            return
        content = "\n".join(f"{m['role']}: {m['content']}" for m in messages[:6])
        title = ai.generate_title(content, "Conversa em alemão")
        db.set_chat_title(conn, session_id, title)


def _maybe_generate_exercise_title(session_id):
    """Runs on a background thread — must never block the request that triggered it."""
    with db.get_conn() as conn:
        session = db.get_exercise_session(conn, session_id)
        if session is None or session["title"] is not None:
            return
        items = db.get_exercise_items(conn, session_id)
        if len(items) < 2:
            return
        content = "\n".join(f"({i['category']}) {i['question']}" for i in items)
        title = ai.generate_title(content, "Exercícios de alemão")
        db.set_exercise_title(conn, session_id, title)


# --- Chat -----------------------------------------------------------------

@app.get("/api/sessions/chats")
def list_chats():
    # Pure DB reads only — title generation happens in the background right
    # after each exchange (see send_message), never blocking this list.
    with db.get_conn() as conn:
        sessions = db.list_chat_sessions(conn)
        result = []
        for session in sessions:
            messages = db.get_chat_messages(conn, session["id"])
            result.append(
                {
                    "id": session["id"],
                    "title": session["title"],
                    "preview": _chat_preview(messages),
                    "message_count": len(messages),
                    "updated_at": session["updated_at"],
                }
            )
        return result


@app.post("/api/chats")
def create_chat():
    with db.get_conn() as conn:
        session_id = db.create_chat_session(conn)
        return {"id": session_id}


@app.delete("/api/sessions/chats")
def delete_all_chats():
    with db.get_conn() as conn:
        db.delete_all_chat_sessions(conn)
    return {"ok": True}


@app.delete("/api/chats/{session_id}")
def delete_chat(session_id: int):
    with db.get_conn() as conn:
        if db.get_chat_session(conn, session_id) is None:
            raise HTTPException(404, "Conversa não encontrada")
        db.delete_chat_session(conn, session_id)
    return {"ok": True}


@app.get("/api/chats/{session_id}")
def get_chat(session_id: int):
    with db.get_conn() as conn:
        session = db.get_chat_session(conn, session_id)
        if session is None:
            raise HTTPException(404, "Conversa não encontrada")
        messages = db.get_chat_messages(conn, session_id)
        return {
            "id": session["id"],
            "title": session["title"],
            "messages": [{"role": m["role"], "content": m["content"]} for m in messages],
        }


@app.post("/api/chats/{session_id}/messages")
def send_message(session_id: int, body: MessageIn):
    with db.get_conn() as conn:
        session = db.get_chat_session(conn, session_id)
        if session is None:
            raise HTTPException(404, "Conversa não encontrada")
        db.add_chat_message(conn, session_id, "user", body.content)
        history = [
            {"role": m["role"], "content": m["content"]}
            for m in db.get_chat_messages(conn, session_id)
        ]

    def generate():
        full_reply = ""
        for chunk in ai.stream_chat_reply(history):
            full_reply += chunk
            yield chunk
        with db.get_conn() as conn:
            db.add_chat_message(conn, session_id, "assistant", full_reply)
            db.touch_chat_session(conn, session_id)
        # Fire-and-forget: never block the reply on the title call.
        _executor.submit(_maybe_generate_chat_title, session_id)

    return StreamingResponse(generate(), media_type="text/plain")


# --- Exercícios -------------------------------------------------------------

@app.get("/api/sessions/exercises")
def list_exercises():
    # Pure DB reads only — title generation happens in the background right
    # after each answered question (see answer_exercise), never blocking this list.
    with db.get_conn() as conn:
        sessions = db.list_exercise_sessions(conn)
        return [
            {
                "id": session["id"],
                "title": session["title"],
                "started_at": session["started_at"],
                "is_finished": session["completed_at"] is not None,
                "correct_count": session["correct_count"],
                "total_questions": session["total_questions"],
            }
            for session in sessions
        ]


def _options_json(question):
    options = question.get("options")
    return json.dumps(options) if options else None


def _question_payload(question):
    return {
        "category": question["category"],
        "type": question.get("type", "resposta_livre"),
        "question": question["question"],
        "options": question.get("options"),
    }


@app.post("/api/exercises")
def create_exercise():
    with db.get_conn() as conn:
        session_id = db.create_exercise_session(conn, total_questions=10)
        progress = db.get_vocab_progress(conn)
        question = ai.generate_question([], progress)
        db.add_exercise_item(
            conn,
            session_id,
            1,
            question["category"],
            question["question"],
            question.get("type", "resposta_livre"),
            _options_json(question),
            question.get("seed_word"),
        )
        return {"id": session_id, "position": 1, "total_questions": 10, **_question_payload(question)}


@app.delete("/api/sessions/exercises")
def delete_all_exercises():
    with db.get_conn() as conn:
        db.delete_all_exercise_sessions(conn)
    return {"ok": True}


@app.delete("/api/exercises/{session_id}")
def delete_exercise(session_id: int):
    with db.get_conn() as conn:
        if db.get_exercise_session(conn, session_id) is None:
            raise HTTPException(404, "Exercício não encontrado")
        db.delete_exercise_session(conn, session_id)
    return {"ok": True}


@app.get("/api/exercises/{session_id}")
def get_exercise(session_id: int):
    with db.get_conn() as conn:
        session = db.get_exercise_session(conn, session_id)
        if session is None:
            raise HTTPException(404, "Exercício não encontrado")
        items = db.get_exercise_items(conn, session_id)
        return {
            "id": session["id"],
            "title": session["title"],
            "total_questions": session["total_questions"],
            "correct_count": session["correct_count"],
            "is_finished": session["completed_at"] is not None,
            "closing_message": session["closing_message"],
            "breakdown": _breakdown(items),
            "items": [
                {
                    "position": i["position"],
                    "category": i["category"],
                    "type": i["type"],
                    "question": i["question"],
                    "options": json.loads(i["options"]) if i["options"] else None,
                    "user_answer": i["user_answer"],
                    "is_correct": bool(i["is_correct"]) if i["is_correct"] is not None else None,
                    "feedback": i["feedback"],
                    "corrected_answer": i["corrected_answer"],
                }
                for i in items
            ],
        }


@app.post("/api/exercises/{session_id}/answer")
def answer_exercise(session_id: int, body: AnswerIn):
    with db.get_conn() as conn:
        session = db.get_exercise_session(conn, session_id)
        if session is None:
            raise HTTPException(404, "Exercício não encontrado")
        item = db.get_current_item(conn, session_id)
        if item is None:
            raise HTTPException(400, "Não há pergunta pendente para responder")

        position = item["position"]
        total = session["total_questions"]
        # The "don't repeat" context for the next question only needs prior
        # categories/questions, not this answer's evaluation — so it can be
        # fetched up front and generated concurrently with the evaluation
        # instead of waiting for it first.
        prior_items = db.get_exercise_items(conn, session_id)
        previous_for_next = [{"category": i["category"], "question": i["question"]} for i in prior_items]
        progress = db.get_vocab_progress(conn)

        eval_future = _executor.submit(ai.evaluate_answer, item["category"], item["question"], body.answer)
        next_future = (
            _executor.submit(ai.generate_question, previous_for_next, progress) if position < total else None
        )

        evaluation = eval_future.result()
        is_correct = bool(evaluation.get("correct", False))
        feedback = evaluation.get("feedback", "")
        corrected_answer = evaluation.get("corrected_answer", "")

        db.answer_exercise_item(
            conn, item["id"], body.answer, is_correct, feedback, corrected_answer
        )
        if is_correct:
            db.increment_correct_count(conn, session_id)

        seed_meta = ai.get_seed_meta(item["seed_word"]) if item["seed_word"] else None
        if seed_meta:
            theme, gloss = seed_meta
            db.record_vocab_result(conn, item["seed_word"], theme, gloss, is_correct)

        response = {
            "position": position,
            "total_questions": total,
            "is_correct": is_correct,
            "feedback": feedback,
            "corrected_answer": corrected_answer,
            "is_finished": False,
            "next_question": None,
        }

        if next_future is not None:
            next_question = next_future.result()
            db.add_exercise_item(
                conn,
                session_id,
                position + 1,
                next_question["category"],
                next_question["question"],
                next_question.get("type", "resposta_livre"),
                _options_json(next_question),
                next_question.get("seed_word"),
            )
            response["next_question"] = _question_payload(next_question)
        else:
            items = db.get_exercise_items(conn, session_id)
            correct_count = session["correct_count"] + (1 if is_correct else 0)
            breakdown = _breakdown(items)
            closing_message = ai.generate_closing(correct_count, total, breakdown)
            db.complete_exercise_session(conn, session_id, closing_message)
            response["is_finished"] = True
            response["correct_count"] = correct_count
            response["closing_message"] = closing_message
            response["breakdown"] = breakdown

        _executor.submit(_maybe_generate_exercise_title, session_id)
        return response


# --- Relatório ---------------------------------------------------------------

@app.get("/api/report")
def get_report():
    with db.get_conn() as conn:
        stats = db.get_report_stats(conn)

    lines = [
        f"Exercícios finalizados: {stats['exercise_count']}",
        (
            f"Média de acerto nos exercícios: {stats['average_score_pct']}%"
            if stats["average_score_pct"] is not None
            else "Média de acerto nos exercícios: sem dados ainda"
        ),
        f"Palavras praticadas: {stats['words_total_seen']} (dominadas: {stats['words_mastered']})",
        f"Conversas livres: {stats['chat_count']} ({stats['message_count']} mensagens no total)",
    ]
    if stats["category_breakdown"]:
        lines.append("Desempenho por categoria nos exercícios:")
        for category, values in stats["category_breakdown"].items():
            lines.append(f"- {category}: {values['correct']}/{values['total']}")
    stats_text = "\n".join(lines)

    report = ai.generate_report(stats_text)

    return {**stats, **report}


if __name__ == "__main__":
    import os

    import uvicorn

    uvicorn.run(app, host=os.environ.get("HOST", "127.0.0.1"), port=8010)
