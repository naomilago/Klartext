import os

from klartext import ai, db


def chat():
    db.init_db()

    session_id = None
    messages = []

    with db.get_conn() as conn:
        sessions = db.list_chat_sessions(conn)
        if sessions:
            resume = input("Continuar a última conversa? (S/n): ").strip().lower()
            if resume in ("", "s", "sim"):
                session_id = sessions[0]["id"]
                messages = [
                    {"role": m["role"], "content": m["content"]}
                    for m in db.get_chat_messages(conn, session_id)
                ]
        if session_id is None:
            session_id = db.create_chat_session(conn)

    print("Klartext - Tutor de Alemão")
    print("Digite 'sair' para encerrar.\n")

    if messages:
        print(f"({len(messages)} mensagens carregadas da última conversa)\n")

    while True:
        try:
            user_input = input("Você: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nTchüs! Bis bald.")
            break

        if user_input.lower() in ("sair", "exit", "quit"):
            print("\nTchüs! Bis bald.")
            break
        if not user_input:
            continue

        messages.append({"role": "user", "content": user_input})
        with db.get_conn() as conn:
            db.add_chat_message(conn, session_id, "user", user_input)

        print("Klartext: ", end="", flush=True)
        response_text = ""
        for chunk in ai.stream_chat_reply(messages):
            print(chunk, end="", flush=True)
            response_text += chunk
        print("\n")

        messages.append({"role": "assistant", "content": response_text})
        with db.get_conn() as conn:
            db.add_chat_message(conn, session_id, "assistant", response_text)
            db.touch_chat_session(conn, session_id)


if __name__ == "__main__":
    os.system("clear")
    chat()
