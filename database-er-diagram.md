# Database ER Diagram

Canonical schema source: [`database/schema.sql`](../database/schema.sql)
(kept in sync with the Alembic migration in
`backend/alembic/versions/0001_initial_schema.py`).

```mermaid
erDiagram
    USERS ||--o{ INCIDENTS : "assigned_to"
    USERS ||--o{ AUDIT_LOGS : "performed"
    SERVERS ||--o{ METRICS : "reports"
    SERVERS ||--o{ LOG_ENTRIES : "generates"
    SERVERS ||--o{ INCIDENTS : "affects"
    SERVERS ||--o{ ALERTS : "triggers"
    SERVERS ||--o{ ALERT_RULES : "configured for"

    USERS {
        uuid id PK
        varchar full_name
        varchar email UK
        varchar hashed_password
        enum role "ADMIN | SRE | OPERATOR | VIEWER"
        boolean is_active
        timestamptz created_at
        timestamptz last_login_at
    }

    SERVERS {
        uuid id PK
        varchar hostname
        varchar ip_address
        enum environment "PRODUCTION | STAGING | DEVELOPMENT"
        varchar cloud_provider
        varchar region
        varchar instance_type
        varchar tags
        float cpu_threshold
        float memory_threshold
        float disk_threshold
        enum status "HEALTHY | WARNING | CRITICAL | OFFLINE | UNKNOWN"
        varchar api_key UK
        timestamptz registered_at
        timestamptz last_heartbeat_at
    }

    METRICS {
        uuid id PK
        uuid server_id FK
        float cpu_percent
        float memory_percent
        float disk_percent
        float network_in_kbps
        float network_out_kbps
        float load_average_1m
        int process_count
        timestamptz recorded_at
    }

    LOG_ENTRIES {
        uuid id PK
        uuid server_id FK
        varchar source_application
        enum level "INFO | WARNING | ERROR | CRITICAL"
        text message
        varchar trace_id
        timestamptz created_at
    }

    INCIDENTS {
        uuid id PK
        uuid server_id FK
        varchar title
        text description
        enum severity "SEV1_CRITICAL..SEV4_LOW"
        enum status "OPEN | ACKNOWLEDGED | IN_PROGRESS | RESOLVED | CLOSED"
        enum source "AUTO_METRIC_THRESHOLD | AUTO_LOG_ERROR | MANUAL"
        uuid assigned_to FK
        timestamptz created_at
        timestamptz acknowledged_at
        timestamptz resolved_at
        text resolution_notes
    }

    ALERTS {
        uuid id PK
        uuid server_id FK
        enum metric_type "CPU | MEMORY | DISK | NETWORK"
        float threshold_value
        float observed_value
        enum status "TRIGGERED | ACKNOWLEDGED | RESOLVED"
        varchar message
        boolean notified
        timestamptz triggered_at
        timestamptz resolved_at
    }

    ALERT_RULES {
        uuid id PK
        uuid server_id FK
        enum metric_type
        float threshold_value
        boolean is_active
        timestamptz created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        varchar action
        varchar resource_type
        varchar resource_id
        varchar ip_address
        timestamptz created_at
    }
```

## Indexing Strategy

| Table | Index | Purpose |
|---|---|---|
| `metrics` | `(server_id, recorded_at)` | Fast range scans for per-server performance charts over a time window. |
| `log_entries` | `(server_id, level, created_at)` | Supports the Log Analytics filters (server + severity + recency) in a single index scan. |
| `servers` | `hostname` | Fast lookup/search when the fleet grows. |
| `servers` | `api_key` (unique) | O(1) agent authentication on every ingest call. |
| `users` | `email` (unique) | Login lookups and duplicate-registration checks. |

## Growth Considerations

`metrics` and `log_entries` are the highest-volume tables. In a production
deployment beyond portfolio scale, this schema is designed to evolve into:

- **Partitioning `metrics`/`log_entries` by month** (native PostgreSQL
  declarative partitioning) once retention windows grow.
- **Migrating `metrics` to TimescaleDB or a dedicated TSDB** (Prometheus,
  InfluxDB) once ingest volume exceeds what a single Postgres instance
  comfortably handles, while keeping `servers`/`incidents`/`users` as
  relational data in Postgres.
- A rolling deletion job (`METRIC_RETENTION_DAYS` setting) to bound table
  growth for the current implementation.
