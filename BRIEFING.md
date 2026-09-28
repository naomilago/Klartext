# Klartext — Briefing

Tutor de alemão via chat, com correções e exercícios conversacionais, usando a API da Anthropic (Claude Sonnet 5).

## 1. Contexto

- **Usuária**: Naomi, nível A1, atualmente estuda com Duolingo (score/liga 8).
- Precisa se apoiar em **português ou inglês** durante a conversação — o tutor não pode assumir fluência.
- **Papel do Klartext**: complementar ao Duolingo, não substituto. Duo cobre vocabulário/gramática em doses pequenas; Klartext entra para treinar **conversação real**, que o Duo não oferece.

## 2. Stack

- **Backend/CLI em Python**, gerenciado com **uv** (`uv init`, `uv add`, `uv run`).
- **Frontend em React** (v2) — projeto separado, a ser construído pela IA (a usuária não domina frontend).
- Backend e frontend se comunicam via API (ex.: FastAPI expondo endpoints que o React consome) — a definir na v2.
- Anthropic SDK oficial (`anthropic` no Python), nunca chamadas HTTP cruas.
- Modelo: `claude-sonnet-5`.

## 3. MVP (v1) — CLI

Escopo mínimo pra validar a experiência:

- Chat em texto no terminal.
- **Conversação livre**: a usuária escreve em alemão (ou mistura com PT/EN quando travar), o tutor responde em alemão.
- **Correções sob demanda ou quando necessário** — não corrigir cada frase automaticamente (isso cansa e quebra o fluxo); o tutor decide quando um erro atrapalha a comunicação e vale apontar, e também corrige quando a usuária pedir explicitamente.
- Explicações de gramática/vocabulário em **português**, mantendo a conversa em alemão.
- Streaming de resposta (evita espera longa no terminal).
- Histórico de conversa mantido durante a sessão (sem persistência entre sessões no MVP).

### Fora de escopo no MVP

- Voz/áudio (fica para uma versão futura, se fizer sentido).
- Persistência de progresso/histórico entre sessões.
- Modo de exercícios estruturados (é a v2).
- Frontend.

## 4. v2 — Frontend (React)

Depois que o MVP em CLI validar a experiência, construir um frontend completo com **duas modalidades**, selecionadas pela usuária:

### Modo Chat (conversa livre)

Mesma lógica do MVP: conversa livre em alemão, com feedback e correções sob demanda ou quando necessário.

### Modo Exercícios (conversacional)

- **A IA inicia a conversa** (primeira mensagem é do tutor, não da usuária).
- Gera uma **leva de 10 perguntas/exercícios variados** (vocabulário, gramática, tradução, completar frase, etc.), um de cada vez, em formato de pergunta e resposta — mas mantendo o tom conversacional, não um formulário.
- Ao final da leva: **sumário com feedback e pontuação**.

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

## 7. Próximos passos

1. Scaffold do projeto Python com `uv` (`uv init`, `uv add anthropic`).
2. Prompt de sistema inicial (persona + regras da seção 5).
3. Loop de chat simples no terminal com streaming.
4. Testar por alguns dias reais de uso, ajustar o prompt antes de partir pro frontend.
