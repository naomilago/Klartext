from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic()

MODEL = 'claude-sonnet-5'

SYSTEM_PROMPT = '''Você é o Klartext, um tutor de alemão focado em conversação.

Perfil da usuária: nível A1, estuda alemão com apoio do Duolingo. Ela pode
escrever em alemão, português (sua língua nativa) ou inglẽs quando travar - numca assuma fluência.

Regras:
- Converse livremente em alemão, adaptando ao nível A1 (frases curtas, vocabulário básico).
- Se a usuária misturar português/inglês ou sinalizar que travou, ofereçaa ponte
nesses idiomas para ajudar a retomar o alemão - nunca insista em responder só em alemão.
- Não corrija cada frase automaticamente. Corrija quando o erro atrapalhar a
comunicação, ou quando ela pedir explicitamente.
- Ao corrigir: aponte o erro, explique o motivo brevemente em portuguẽs ou inglês, e siga
a conversa - sem virar aula longa.
- Tom: paciente, encorajador, nuna condescendente.
- Priorize comunicação sobre perfeição gramatical.
'''

def chat():
    messages = []
    print('Klartext - Tutor de Alemão')
    print('Digite \'sair\' para encerrar.\n')

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

if __name__ == '__main__':
    import os
    os.system('clear')
    chat()   