# Root-level Dockerfile for platforms/tools that expect one at the repo root
# (e.g. a one-click PaaS deploy of the API service). This builds the backend
# API. For the full multi-service stack (backend + frontend + agent), use
# `docker-compose.yml`, which references the dedicated Dockerfiles in
# `docker/` (backend.Dockerfile, frontend.Dockerfile, agent.Dockerfile).

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

RUN useradd --create-home aiops && chown -R aiops:aiops /app
USER aiops

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
