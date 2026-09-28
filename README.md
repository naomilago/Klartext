# Klartext

Tutor de alemão via chat, com correções e exercícios conversacionais, usando a API da Anthropic (Claude Sonnet 5).

## Contexto

Complementar ao Duolingo: enquanto o Duo cobre vocabulário/gramática em doses pequenas, o Klartext treina **conversação real** em alemão, com correções sob demanda e explicações em português.

## Stack

- **Backend**: Python + [FastAPI](https://fastapi.tiangolo.com/), gerenciado com [uv](https://docs.astral.sh/uv/)
- **Frontend**: React + Vite
- **SDK**: [anthropic](https://github.com/anthropics/anthropic-sdk-python) (chamadas oficiais, sem HTTP cru)
- **Modelo**: `claude-sonnet-5`
- **Persistência**: SQLite (`sqlite3`, stdlib)

## Estrutura

```
klartext/
├── BRIEFING.md
├── README.md
├── backend/
│   ├── main.py       # API FastAPI (porta 8010)
│   ├── cli.py         # chat de terminal (MVP original)
│   └── klartext/
│       ├── db.py      # persistência SQLite
│       └── ai.py       # chamadas à Anthropic
└── frontend/           # app React (Vite)
```

## Setup

**Backend:**

```bash
cd backend
uv sync
```

Crie um `.env` em `backend/` com sua chave da Anthropic:

```
ANTHROPIC_API_KEY=sua_chave_aqui
```

**Frontend:**

```bash
cd frontend
npm install
```

## Rodando

Em dois terminais separados:

```bash
# terminal 1 — API (http://127.0.0.1:8010)
cd backend
uv run main.py

# terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Ou, pra usar só o chat no terminal (sem o frontend):

```bash
cd backend
uv run cli.py
```

## Roadmap

Ver [BRIEFING.md](./BRIEFING.md) para o histórico completo do escopo (MVP e v2).
