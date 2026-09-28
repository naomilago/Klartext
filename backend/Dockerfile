FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY . .

ENV HOST=0.0.0.0
ENV KLARTEXT_DB_PATH=/data/klartext.db

EXPOSE 8010

CMD ["uv", "run", "main.py"]
