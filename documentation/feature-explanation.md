# Feature Explanation

## 1. Infrastructure Monitoring Module

- Register any server/VM/container host with hostname, IP, cloud provider,
  region, instance type, and environment tag (Production/Staging/Dev).
- Each server gets a unique, secret API key used by its monitoring agent -
  no shared credentials across hosts.
- The agent reports CPU%, memory%, disk%, network in/out, 1-minute load
  average, and process count on a configurable interval (default 15s).
- Per-server configurable alert thresholds (CPU/memory/disk), with sane
  platform-wide defaults.
- Derived health status (`HEALTHY` / `WARNING` / `CRITICAL` / `OFFLINE`) is
  computed on every metric ingest and surfaced across the dashboard.
- A background sweep automatically marks a server `OFFLINE` if no heartbeat
  arrives within 5 minutes - catching agent crashes or network partitions,
  not just resource exhaustion.

## 2. Log Management Module

- Agents forward `INFO` / `WARNING` / `ERROR` / `CRITICAL` log lines tagged
  by source application.
- Full-text keyword search across recent log history, filterable by server
  and severity level.
- **Failure analysis**: a "top failing applications" endpoint surfaces which
  services are generating the most errors, so operators know where to look
  first.
- **Auto-escalation**: three or more `CRITICAL` log lines from the same
  server within a 5-minute window automatically opens an incident, even if
  no metric threshold was breached - catching application-level failures
  that don't show up as resource exhaustion (e.g. an unhandled exception
  loop).

## 3. Incident Management Module

- Incidents can be created **automatically** (from metric threshold breaches
  or repeated critical log errors) or **manually** by an operator.
- Four-level severity model (`SEV1_CRITICAL` -> `SEV4_LOW`), auto-assigned
  based on how far a metric exceeded its threshold when triggered
  automatically.
- Full status lifecycle: `OPEN -> ACKNOWLEDGED -> IN_PROGRESS -> RESOLVED ->
  CLOSED`, with acknowledgement/resolution timestamps captured automatically
  the first time a status transition happens.
- Assignment to a specific user/engineer.
- **Idempotent auto-creation**: the platform will not open a second incident
  for the same ongoing problem on the same server - it recognizes an already-
  open incident of the same source/metric and leaves it alone until resolved.
- Incident statistics endpoint powers KPI cards: open count, resolved count,
  critical count, and **mean time to resolution (MTTR)** computed from real
  timestamp deltas.
- Monthly incident trend endpoint for historical reporting.

## 4. Alert Management Module

- Threshold-based alerting evaluated synchronously on every metric ingest -
  no polling delay.
- Custom alert rules can be configured per server/metric beyond the default
  thresholds.
- Alert lifecycle: `TRIGGERED -> ACKNOWLEDGED -> RESOLVED`.
- Alert history queryable by server, status, and time window for
  post-incident review.

## 5. Operations Dashboard

- **Overview page**: total servers, uptime %, active incidents, critical
  alerts in the last 24h, fleet health distribution (donut chart).
- **Performance page**: per-server CPU/memory/disk trend charts over
  selectable windows (6h / 24h / 7d).
- **Incident page**: KPI cards (open/resolved/critical/MTTR), monthly trend
  bar chart, filterable incident table with inline status updates.
- **Log Analytics page**: log level distribution (pie chart), top failing
  applications (bar chart), and a live search table.
- **Servers page**: registered fleet with live status pills and threshold
  configuration, plus in-UI server registration that surfaces the one-time
  agent API key.

## 6. Security

- **Authentication**: JWT access + refresh tokens, bcrypt password hashing
  (`passlib`), never returning password hashes in API responses.
- **RBAC**: four roles (`ADMIN`, `SRE`, `OPERATOR`, `VIEWER`) enforced via
  FastAPI dependency guards on every mutating endpoint.
- **Machine auth**: monitoring agents use a separate, per-server API key
  (never a user JWT), so a compromised agent credential can't access user
  management or other servers' data.
- **Audit log**: security-relevant actions (login, incident updates) are
  recorded with actor, action, resource, and timestamp for traceability.
- **Input validation**: every request body is validated by Pydantic schemas
  with explicit types, ranges (e.g. percentages bounded 0-100), and required
  fields - malformed input is rejected with a structured 422 response before
  it reaches business logic.

## 7. Enterprise Engineering Practices Demonstrated

- Clean, modular architecture: `api/` (routes) -> `services/` (business
  logic) -> `models/` (ORM) -> `schemas/` (validation/serialization),
  cleanly separated by layer.
- Centralized configuration via environment variables (12-factor app style).
- Structured JSON logging with request tracing IDs.
- Global exception handlers so unhandled errors never leak stack traces to
  clients.
- Versioned database migrations (Alembic) instead of ad-hoc schema changes.
- Automated test suite (`pytest`) covering auth, servers, metrics/alerting,
  logs, and incidents, run in CI against a real PostgreSQL service
  container.
- CI pipeline: lint -> test -> build, for both backend and frontend, plus a
  Docker image build validation stage.
- Fully documented REST API via OpenAPI/Swagger, generated directly from the
  code (not hand-maintained and prone to drift).
