# Installation Guide

## Option A - Docker Compose (recommended, fastest path)

**Prerequisites:** Docker Desktop / Docker Engine + Docker Compose v2.

```bash
git clone https://github.com/<your-username>/AIOps-Infrastructure-Monitoring-Platform.git
cd AIOps-Infrastructure-Monitoring-Platform

cp backend/.env.example backend/.env
# Edit backend/.env and set a real SECRET_KEY

docker compose up --build
```

This starts four containers:

| Service | URL | Notes |
|---|---|---|
| `frontend` | http://localhost:3000 | React dashboard (Nginx) |
| `backend` | http://localhost:8000 | FastAPI + Swagger docs at `/api/docs` |
| `db` | localhost:5432 | PostgreSQL, auto-seeded from `database/schema.sql` + `seed_data.sql` |
| `monitoring-agent` | (background) | Demo agent monitoring the backend container itself |

Apply migrations (first run only, or after pulling schema changes):

```bash
docker compose exec backend alembic upgrade head
```

Open http://localhost:3000, log in with the seeded admin account
(`admin@aiops.local` — see `database/seed_data.sql` for the demo password),
and register your first server from the **Servers** page.

## Option B - Local Development (no Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Point DATABASE_URL at a local PostgreSQL instance you've created:
#   createdb aiops_db

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8000` (see
`frontend/vite.config.js`), so no CORS configuration is needed locally.

### Monitoring Agent (on a host you want to monitor)

```bash
cd monitoring-agent
pip install -r requirements.txt

# Register the host and capture its API key (requires an ADMIN/SRE JWT)
python register_server.py --admin-token "$TOKEN" --ip 10.0.1.50

export AIOPS_API_URL="http://localhost:8000/api/v1"
export AIOPS_API_KEY="<key from previous step>"
python agent.py
```

## Verifying the Installation

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"AIOps Infrastructure Monitoring & Incident Management Platform",...}
```

Run the automated test suite:

```bash
cd backend
pytest ../tests -v
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `psycopg2` fails to build locally | Install PostgreSQL client headers (`libpq-dev` on Debian/Ubuntu, `postgresql` via Homebrew on macOS), or just use Docker Compose. |
| Frontend shows "Unable to load dashboard data" | Confirm the backend is running and reachable at the URL the frontend is proxying to; check browser devtools network tab. |
| Alembic can't connect | Confirm `DATABASE_URL` in `.env` matches your running Postgres instance/container. |
