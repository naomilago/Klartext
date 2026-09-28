from anthropic import Anthropic
from dotenv import load_dotenv
from pathlib import Path
import sqlite3

from datetime import (
    timedelta,
    datetime,
    timezone
)

load_dotenv()

client = Anthropic()

MODEL = 'claude-sonnet-5'
DB_PATH = Path(__file__).parent / 'klartext.db'

SYSTEM_PROMPT = '''Você é o Klartext, um tutor de alemão focado em conversação.

Perfil da usuária: nível A1, estuda alemão com apoio do Duolingo. Ela pode
escrever em alemão, português (sua língua nativa) ou inglês quando travar - nunca assuma fluência.

Regras:
- Converse livremente em alemão, adaptando ao nível A1 (frases curtas, vocabulário básico).
- Se a usuária misturar português/inglês ou sinalizar que travou, ofereça a ponte
nesses idiomas para ajudar a retomar o alemão - nunca insista em responder só em alemão.
- Não corrija cada frase automaticamente. Corrija quando o erro atrapalhar a
comunicação, ou quando ela pedir explicitamente.
- Ao corrigir: aponte o erro, explique o motivo brevemente em português ou inglês, e siga
a conversa - sem virar aula longa.
- Tom: paciente, encorajador, nunca condescendente.
- Priorize comunicação sobre perfeição gramatical.
'''

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
    ''')
    conn.commit()
    return conn

def get_last_session(conn):
    row = conn.execute('SELECT id FROM sessions ORDER BY id DESC LIMIT 1').fetchone()
    return row[0] if row else None

def load_messages(conn, session_id):
    rows = conn.execute(
        'SELECT role, content FROM messages WHERE session_id = ? ORDER BY id',
        (session_id,),
    ).fetchall()

    return [{'role': role, 'content': content} for role, content in rows]

def create_session(conn):
    GMT_MINUS_3 = timezone(timedelta(hours=-3))
    now = datetime.now(GMT_MINUS_3).isoformat()

    cursor = conn.execute('INSERT INTO sessions (started_at) VALUES (?)', (now,))
    conn.commit()

    return cursor.lastrowid

def save_message(conn, session_id, role, content):
    GMT_MINUS_3 = timezone(timedelta(hours=-3))
    now = datetime.now(GMT_MINUS_3).isoformat()

    conn.execute(
        'INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)',
        (session_id, role, content, now)
    )
    conn.commit()

def chat():
    conn = init_db()
    messages = []
    session_id = get_last_session(conn)

    if session_id is not None:
        resume = input('Continuar a última conversa? (S/n): ').strip().lower()
        if resume in ('', 's', 'sim'):
            messages = load_messages(conn, session_id)
        else:
            session_id = None

    if session_id is None:
        session_id = create_session(conn)

    print('Klartext - Tutor de Alemão')
    print('Digite \'sair\' para encerrar.\n')

    if messages:
        print(f'({len(messages)} mensagens carregadas da última conversa)\n')

    while True:
        try:
            user_input = input('Você: ').strip()
        except (EOFError, KeyboardInterrupt):
            print('\nTchüs! Bis bald.')
            break

        if user_input.lower() in ('sair', 'exit', 'quit'):
            print('\nTchüs! Bis bald.')
            break
        if not user_input:
            continue

        messages.append({'role': 'user', 'content': user_input})
        save_message(conn, session_id, 'user', user_input)

        print('Klartext: ', end='', flush=True)
        response_text = ''
        with client.messages.stream(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                print(text, end='', flush=True)
                response_text += text
        print('\n')

        messages.append({'role': 'assistant', 'content': response_text})
        save_message(conn, session_id, 'assistant', response_text)

    conn.close()

if __name__ == '__main__':
    import os
    os.system('clear')
    chat()
