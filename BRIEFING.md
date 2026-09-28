# Klartext — Briefing

Tutor de alemão via chat, com correções e exercícios conversacionais, usando a API da Anthropic (Claude Sonnet 5).

## 1. Contexto

- **Usuária**: Naomi, nível A1, atualmente estuda com Duolingo (score/liga 8).
- Precisa se apoiar em **português ou inglês** durante a conversação — o tutor não pode assumir fluência.
- **Papel do Klartext**: complementar ao Duolingo, não substituto. Duo cobre vocabulário/gramática em doses pequenas; Klartext entra para treinar **conversação real**, que o Duo não oferece.

## 2. Stack

- **Backend em Python** (`backend/`), gerenciado com **uv** (`uv init`, `uv add`, `uv run`).
  - `main.py` — API FastAPI (porta 8010) consumida pelo frontend.
  - `cli.py` — chat de terminal do MVP original, mantido como alternativa.
  - `klartext/db.py` — persistência em SQLite (chats, exercícios).
  - `klartext/ai.py` — chamadas à Anthropic (chat, geração de título, geração/avaliação de exercícios).
- **Frontend em React** (`frontend/`, Vite) — consome a API do backend.
- Anthropic SDK oficial (`anthropic` no Python), nunca chamadas HTTP cruas.
- Modelo: `claude-sonnet-5`.

## 3. MVP (v1) — CLI

Escopo mínimo pra validar a experiência:

- Chat em texto no terminal.
- **Conversação livre**: a usuária escreve em alemão (ou mistura com PT/EN quando travar), o tutor responde em alemão.
- **Correções sob demanda ou quando necessário** — não corrigir cada frase automaticamente (isso cansa e quebra o fluxo); o tutor decide quando um erro atrapalha a comunicação e vale apontar, e também corrige quando a usuária pedir explicitamente.
- Explicações de gramática/vocabulário em **português**, mantendo a conversa em alemão.
- Streaming de resposta (evita espera longa no terminal).
- Histórico de conversa persistido em **SQLite** — a conversa pode ser retomada entre execuções.

### Fora de escopo no MVP

- Voz/áudio (fica para uma versão futura, se fizer sentido).
- Modo de exercícios estruturados (é a v2).
- Frontend.

## 4. v2 — Frontend (React) ✅ implementado

Frontend com **duas modalidades**, selecionadas na tela Início:

### Modo Chat (conversa livre)

Conversa livre em alemão, com streaming e correções sob demanda ou quando necessário.
Respostas renderizadas como **Markdown + LaTeX** (KaTeX). Histórico de conversas
anteriores acessível pela tela Início, aberto em **modo somente leitura**
(não dá pra continuar uma conversa antiga — só visualizar).

### Modo Exercícios (conversacional)

- Gera uma **leva de 10 perguntas variadas** (vocabulário, gramática, tradução,
  completar frase), um de cada vez, alternando entre **múltipla escolha** (cards
  selecionáveis) e **resposta livre** (campo de texto), com correção pela IA.
- Ao final: sumário com pontuação, breakdown por categoria e mensagem de
  encorajamento gerada pela IA.
- Exercícios anteriores (finalizados ou em andamento) ficam acessíveis pela tela
  Início, abertos numa tela de revisão que mostra **todas as perguntas de uma vez**
  (não dá pra continuar um exercício incompleto — só revisar).

### Títulos automáticos

Chats e exercícios recebem um título curto gerado pela IA (em português),
exibido na lista da tela Início — gerado sob demanda, na primeira vez que a
lista é carregada.

## 5. Diretrizes de persona do tutor

- Tom: paciente, encorajador, nunca condescendente.
- Nunca responder só em alemão se a usuária sinalizar que travou — oferecer a ponte em português/inglês.
- Priorizar comunicação sobre perfeição gramatical no modo Chat; no modo Exercícios, ser mais rigoroso (é o momento de treinar precisão).
- Corrigir apontando o erro, explicando o porquê brevemente, e seguindo a conversa — sem virar aula longa.

## 6. Notas técnicas (API)

- Modelo: `claude-sonnet-5` (Sonnet 5) — pricing: $2/MTok input, $10/MTok output.
- Usar `thinking: {type: "adaptive"}` (padrão do modelo, não precisa configurar manualmente).
- Streaming (`client.messages.stream(...)` no SDK Python) para respostas responsivas no CLI e depois no frontend.
- System prompt deve fixar: nível A1 da usuária, idiomas de apoio (PT/EN), e as regras de quando corrigir (seção 5).
- Persistência: **SQLite** (stdlib `sqlite3`, sem dependência extra), com tabelas `sessions` e `messages`. Ao iniciar, o CLI oferece retomar a última conversa.

## 7. Próximos passos

1. ~~Scaffold do projeto Python com `uv`.~~ ✅
2. ~~Prompt de sistema inicial.~~ ✅
3. ~~Loop de chat simples no terminal com streaming.~~ ✅
4. ~~Persistência em SQLite.~~ ✅
5. ~~API FastAPI + frontend React (v2), modo Exercícios, títulos por IA.~~ ✅
6. Usar por alguns dias reais e ajustar prompts/UX com base no uso (ex.: a IA
   às vezes erra a avaliação de gênero de substantivos alemães em exercícios —
   vale observar e considerar ajustar o `EXERCISE_SYSTEM_PROMPT` se for frequente).
