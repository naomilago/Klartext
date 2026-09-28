from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()

client = Anthropic()

MODEL = "claude-sonnet-5"

CHAT_SYSTEM_PROMPT = """Você é o Klartext, um tutor de alemão focado em conversação.

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
- Sua resposta é renderizada como Markdown (negrito, itálico, listas) e LaTeX.
  Se precisar mostrar uma fórmula ou notação matemática, use LaTeX de verdade
  com $...$ (inline) ou $$...$$ (bloco) — nunca mostre o código LaTeX cru como texto.
"""

EXERCISE_SYSTEM_PROMPT = """Você é o Klartext, um tutor de alemão conduzindo uma rodada de exercícios.

Perfil da usuária: nível A1, estuda alemão com apoio do Duolingo.

Regras:
- Gere perguntas variadas — vocabulário, gramática, tradução ou completar frase —
  sempre adequadas ao nível A1.
- Varie o formato: use múltipla escolha (3 a 4 alternativas) principalmente para
  vocabulário e gramática, e resposta livre (digitação) para tradução e completar
  frase. Alterne os formatos ao longo da rodada para manter dinâmico.
- Aqui o rigor é maior do que numa conversa livre: é o momento de treinar precisão.
- Ao avaliar uma resposta, aceite pequenas variações razoáveis (maiúsculas, sinônimos
  válidos, pequenos erros de digitação), mas aponte erros reais de vocabulário ou gramática.
- Feedback sempre em português, breve e direto, sem virar aula longa.
- Tom: paciente e encorajador, mesmo ao apontar erros.
"""

TITLE_TOOL = {
    "name": "set_title",
    "description": "Define um título curto para exibir em uma lista de sessões.",
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Título de 3 a 6 palavras, em português, resumindo o conteúdo.",
            }
        },
        "required": ["title"],
    },
}

QUESTION_TOOL = {
    "name": "ask_question",
    "description": "Propõe a próxima pergunta do exercício.",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "enum": ["vocabulario", "gramatica", "traducao", "completar_frase"],
            },
            "type": {
                "type": "string",
                "enum": ["multipla_escolha", "resposta_livre"],
                "description": (
                    "multipla_escolha quando fizer sentido oferecer 3 a 4 alternativas "
                    "(bom para vocabulário e gramática); resposta_livre quando a usuária "
                    "deve digitar (bom para tradução e completar frase)."
                ),
            },
            "question": {
                "type": "string",
                "description": "O enunciado da pergunta, em tom conversacional, nível A1.",
            },
            "options": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "3 a 4 alternativas em alemão, em ordem aleatória. "
                    "Obrigatório quando type for multipla_escolha; omitir caso contrário."
                ),
            },
        },
        "required": ["category", "type", "question"],
    },
}

EVALUATE_TOOL = {
    "name": "evaluate_answer",
    "description": "Avalia a resposta da usuária para a pergunta do exercício.",
    "input_schema": {
        "type": "object",
        "properties": {
            "feedback": {
                "type": "string",
                "description": (
                    "Primeiro raciocine em voz alta, em português: confira o gênero/artigo "
                    "ou gramática correta em ALEMÃO (nunca compare com o gênero em português "
                    "— são independentes), decida se a resposta da usuária está certa, e só "
                    "então escreva o feedback breve e direto explicando o motivo. Preencha "
                    "este campo ANTES do campo 'correct'."
                ),
            },
            "correct": {
                "type": "boolean",
                "description": "O veredito final, consistente com o raciocínio já escrito em 'feedback'.",
            },
            "corrected_answer": {
                "type": "string",
                "description": "A resposta correta ou ideal, em alemão.",
            },
        },
        "required": ["feedback", "correct", "corrected_answer"],
    },
}

CLOSING_TOOL = {
    "name": "closing_message",
    "description": "Mensagem final encorajadora ao término da rodada de exercícios.",
    "input_schema": {
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": (
                    "1-2 frases em português, encorajadoras, mencionando um ponto forte "
                    "e um ponto a melhorar."
                ),
            }
        },
        "required": ["message"],
    },
}


def _tool_input(response, tool_name, fallback):
    for block in response.content:
        if block.type == "tool_use" and block.name == tool_name:
            return block.input
    return fallback


def stream_chat_reply(messages):
    with client.messages.stream(
        model=MODEL,
        max_tokens=1024,
        system=CHAT_SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        yield from stream.text_stream


def generate_title(content: str, fallback: str) -> str:
    response = client.messages.create(
        model=MODEL,
        max_tokens=100,
        tools=[TITLE_TOOL],
        tool_choice={"type": "tool", "name": "set_title"},
        messages=[
            {
                "role": "user",
                "content": (
                    "Resuma o assunto abaixo em um título curto (3 a 6 palavras), "
                    "em português, para exibir em uma lista de conversas:\n\n" + content
                ),
            }
        ],
    )
    result = _tool_input(response, "set_title", {"title": fallback})
    return result.get("title", fallback)[:80]


def generate_question(previous: list[dict]) -> dict:
    if previous:
        history_text = "\n".join(
            f"- ({item['category']}) {item['question']}" for item in previous
        )
        context = f"Perguntas já feitas nesta rodada (não repita):\n{history_text}"
    else:
        context = "Esta é a primeira pergunta da rodada."

    response = client.messages.create(
        model=MODEL,
        max_tokens=300,
        system=EXERCISE_SYSTEM_PROMPT,
        tools=[QUESTION_TOOL],
        tool_choice={"type": "tool", "name": "ask_question"},
        messages=[{"role": "user", "content": context}],
    )
    return _tool_input(
        response,
        "ask_question",
        {
            "category": "vocabulario",
            "type": "resposta_livre",
            "question": "Como se diz 'obrigada' em alemão?",
        },
    )


def evaluate_answer(category: str, question: str, answer: str) -> dict:
    response = client.messages.create(
        model=MODEL,
        max_tokens=400,
        system=EXERCISE_SYSTEM_PROMPT,
        tools=[EVALUATE_TOOL],
        tool_choice={"type": "tool", "name": "evaluate_answer"},
        messages=[
            {
                "role": "user",
                "content": (
                    f"Categoria: {category}\nPergunta: {question}\n"
                    f"Resposta da usuária: {answer}\n\nAvalie a resposta."
                ),
            }
        ],
    )
    return _tool_input(
        response,
        "evaluate_answer",
        {
            "correct": False,
            "feedback": "Não consegui avaliar essa resposta agora.",
            "corrected_answer": "",
        },
    )


def generate_closing(correct_count: int, total: int, breakdown: dict) -> str:
    breakdown_text = "\n".join(
        f"- {category}: {stats['correct']}/{stats['total']}"
        for category, stats in breakdown.items()
    ) or "(sem dados por categoria)"

    response = client.messages.create(
        model=MODEL,
        max_tokens=200,
        system=EXERCISE_SYSTEM_PROMPT,
        tools=[CLOSING_TOOL],
        tool_choice={"type": "tool", "name": "closing_message"},
        messages=[
            {
                "role": "user",
                "content": (
                    f"A usuária acertou {correct_count} de {total} perguntas.\n"
                    f"Desempenho por categoria:\n{breakdown_text}\n\n"
                    "Escreva a mensagem final."
                ),
            }
        ],
    )
    result = _tool_input(
        response, "closing_message", {"message": "Mandou bem! Continue praticando."}
    )
    return result.get("message", "Mandou bem! Continue praticando.")
