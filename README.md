# Klartext

Tutor de alemão via chat, com correções e exercícios conversacionais, usando a API da Anthropic (Claude Sonnet 5).

## Contexto

Complementar ao Duolingo: enquanto o Duo cobre vocabulário/gramática em doses pequenas, o Klartext treina **conversação real** em alemão, com correções sob demanda e explicações em português.

## Stack

- **Backend/CLI**: Python, gerenciado com [uv](https://docs.astral.sh/uv/)
- **SDK**: [anthropic](https://github.com/anthropics/anthropic-sdk-python) (chamadas oficiais, sem HTTP cru)
- **Modelo**: `claude-sonnet-5`
- **Persistência**: SQLite (`sqlite3`, stdlib)
- **Frontend** (v2): React — a ser adicionado em `frontend/`, ainda não iniciado

## Estrutura

```
klartext/
├── BRIEFING.md
├── README.md
└── backend/       # CLI Python
```

## Setup

```bash
cd backend
uv sync
```

Crie um `.env` em `backend/` com sua chave da Anthropic:

```
ANTHROPIC_API_KEY=sua_chave_aqui
```

## Rodando

```bash
cd backend
uv run main.py
```

## Roadmap

Ver [BRIEFING.md](./BRIEFING.md) para o escopo completo do MVP (v1) e dos planos de frontend (v2).
