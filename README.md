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
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── main.py       # API FastAPI (porta 8010)
│   ├── cli.py         # chat de terminal (MVP original)
│   └── klartext/
│       ├── db.py      # persistência SQLite
│       └── ai.py       # chamadas à Anthropic
└── frontend/           # app React (Vite)
    └── Dockerfile
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

### Com Docker (recomendado — fica sempre ligado)

```bash
docker compose up -d
```

- Frontend: http://localhost:5174
- API: http://127.0.0.1:8010

Os containers usam `restart: always` e o serviço do Docker já inicia com o
sistema, então o Klartext volta a rodar sozinho depois de reiniciar o
computador. Os dados (SQLite) ficam num volume Docker (`klartext_data`),
não se perdem ao recriar os containers.

Comandos úteis:

```bash
docker compose logs -f          # ver logs
docker compose stop             # pausar (mantém os containers p/ religar no boot)
docker compose down             # remove os containers (perde o "sempre ligado" até rodar `up -d` de novo)
docker compose up -d --build    # reconstruir depois de mudar o código
```

### Sem Docker (dev manual)

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
