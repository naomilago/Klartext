import random

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
- Se a usuária misturar português ou sinalizar que travou, explique em português
  (é o idioma nativo dela) para ajudar a retomar o alemão - nunca insista em
  responder só em alemão. Só use inglês se ela escrever majoritariamente em
  inglês ou pedir explicitamente em inglês. NUNCA alterne de idioma sem motivo —
  mantenha o mesmo idioma de apoio (português, salvo os casos acima) durante
  toda a conversa.
- Não corrija cada frase automaticamente. Corrija quando o erro atrapalhar a
  comunicação, ou quando ela pedir explicitamente.
- Ao corrigir: aponte o erro, explique o motivo brevemente em português, e siga
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
- Varie MUITO o vocabulário. Nunca use os mesmos exemplos clichê toda vez
  (ex.: "der Apfel", "das Buch", "die Katze", "der Hund", "das Auto") — a
  usuária já viu esses de sobra. Sempre que uma palavra-alvo for sugerida no
  contexto da mensagem, construa a pergunta em torno dela.
- Varie o formato: use múltipla escolha (3 a 4 alternativas) principalmente para
  vocabulário e gramática, e resposta livre (digitação) para tradução e completar
  frase. Alterne os formatos ao longo da rodada para manter dinâmico.
- Aqui o rigor é maior do que numa conversa livre: é o momento de treinar precisão.
- Ao avaliar uma resposta, aceite pequenas variações razoáveis (maiúsculas, sinônimos
  válidos, pequenos erros de digitação), mas aponte erros reais de vocabulário ou gramática.
- Feedback SEMPRE em português — nunca em inglês, mesmo que a usuária responda
  ou escreva em inglês. Seja breve e direto, sem virar aula longa.
- Tom: paciente e encorajador, mesmo ao apontar erros.
"""

TOPIC_SEEDS = [
    ("comida e bebida", "der Käse", "queijo"),
    ("comida e bebida", "die Suppe", "sopa"),
    ("comida e bebida", "das Brot", "pão"),
    ("comida e bebida", "die Wurst", "salsicha"),
    ("comida e bebida", "der Reis", "arroz"),
    ("comida e bebida", "der Kaffee", "café"),
    ("animais", "die Katze", "gato"),
    ("animais", "der Vogel", "pássaro"),
    ("animais", "das Pferd", "cavalo"),
    ("animais", "die Kuh", "vaca"),
    ("animais", "der Fisch", "peixe"),
    ("casa e móveis", "der Tisch", "mesa"),
    ("casa e móveis", "die Lampe", "luminária"),
    ("casa e móveis", "das Fenster", "janela"),
    ("casa e móveis", "die Tür", "porta"),
    ("casa e móveis", "der Stuhl", "cadeira"),
    ("roupas", "die Jacke", "jaqueta"),
    ("roupas", "der Schuh", "sapato"),
    ("roupas", "das Hemd", "camisa"),
    ("roupas", "die Hose", "calça"),
    ("cores", "blau", "azul"),
    ("cores", "grün", "verde"),
    ("cores", "gelb", "amarelo"),
    ("clima", "der Regen", "chuva"),
    ("clima", "die Sonne", "sol"),
    ("clima", "der Schnee", "neve"),
    ("viagem e transporte", "der Zug", "trem"),
    ("viagem e transporte", "das Flugzeug", "avião"),
    ("viagem e transporte", "der Koffer", "mala"),
    ("profissões", "der Lehrer", "professor"),
    ("profissões", "die Ärztin", "médica"),
    ("profissões", "der Koch", "cozinheiro"),
    ("corpo humano", "die Hand", "mão"),
    ("corpo humano", "der Kopf", "cabeça"),
    ("corpo humano", "das Auge", "olho"),
    ("cidade e lugares", "der Park", "parque"),
    ("cidade e lugares", "die Straße", "rua"),
    ("cidade e lugares", "der Bahnhof", "estação"),
    ("escola e trabalho", "der Stift", "caneta"),
    ("escola e trabalho", "das Heft", "caderno"),
    ("compras", "das Geld", "dinheiro"),
    ("compras", "die Kasse", "caixa (loja)"),
    ("família", "die Schwester", "irmã"),
    ("família", "der Bruder", "irmão"),
    ("família", "die Großmutter", "avó"),
    ("sentimentos", "glücklich", "feliz"),
    ("sentimentos", "traurig", "triste"),
    ("rotina diária", "aufstehen", "levantar-se"),
    ("rotina diária", "frühstücken", "tomar café da manhã"),
    ("tecnologia", "das Handy", "celular"),
    ("tecnologia", "der Computer", "computador"),
    ("números e horas", "die Uhr", "relógio"),
    ("dias e meses", "der Montag", "segunda-feira"),
]

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
                    "este campo ANTES do campo 'correct'. TODO o texto deve ser em português, "
                    "nunca em inglês, mesmo que a resposta da usuária esteja em inglês."
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


def _pick_seed(previous: list[dict]):
    used_text = " ".join(item["question"] for item in previous).lower()
    unused = [seed for seed in TOPIC_SEEDS if seed[1].split(" ")[-1].lower() not in used_text]
    pool = unused or TOPIC_SEEDS
    return random.choice(pool)


def generate_question(previous: list[dict]) -> dict:
    theme, seed_word, seed_gloss = _pick_seed(previous)
    seed_line = (
        f"Tema sorteado para esta pergunta: {theme}. "
        f"Palavra/expressão-alvo sugerida: \"{seed_word}\" ({seed_gloss}) — "
        "construa a pergunta em torno dela (pode adaptar a forma gramatical conforme a categoria)."
    )

    if previous:
        history_text = "\n".join(
            f"- ({item['category']}) {item['question']}" for item in previous
        )
        context = f"{seed_line}\n\nPerguntas já feitas nesta rodada (não repita):\n{history_text}"
    else:
        context = f"{seed_line}\n\nEsta é a primeira pergunta da rodada."

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
