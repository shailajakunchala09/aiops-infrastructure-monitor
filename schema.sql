-- =====================================================================
-- AIOps Infrastructure Monitoring & Incident Management Platform
-- PostgreSQL Schema (canonical reference - kept in sync with Alembic
-- migrations under backend/alembic/versions/)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- USERS & ACCESS CONTROL
-- ---------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('ADMIN', 'SRE', 'OPERATOR', 'VIEWER');

CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name        VARCHAR(150) NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    hashed_password  VARCHAR(255) NOT NULL,
    role             user_role NOT NULL DEFAULT 'VIEWER',
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at    TIMESTAMPTZ
);
CREATE INDEX ix_users_email ON users(email);

-- ---------------------------------------------------------------------
-- INFRASTRUCTURE: SERVERS / MONITORED ASSETS
-- ---------------------------------------------------------------------
CREATE TYPE server_environment AS ENUM ('PRODUCTION', 'STAGING', 'DEVELOPMENT');
CREATE TYPE server_status AS ENUM ('HEALTHY', 'WARNING', 'CRITICAL', 'OFFLINE', 'UNKNOWN');

CREATE TABLE servers (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostname           VARCHAR(150) NOT NULL,
    ip_address         VARCHAR(45) NOT NULL,
    environment        server_environment NOT NULL DEFAULT 'PRODUCTION',
    cloud_provider     VARCHAR(50),          -- AWS | Azure | GCP | On-Prem
    region             VARCHAR(50),
    instance_type      VARCHAR(50),
    tags               VARCHAR(255),
    cpu_threshold      FLOAT NOT NULL DEFAULT 85.0,
    memory_threshold   FLOAT NOT NULL DEFAULT 85.0,
    disk_threshold     FLOAT NOT NULL DEFAULT 90.0,
    status             server_status NOT NULL DEFAULT 'UNKNOWN',
    api_key            VARCHAR(64) NOT NULL UNIQUE,
    registered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_heartbeat_at  TIMESTAMPTZ
);
CREATE INDEX ix_servers_hostname ON servers(hostname);

-- ---------------------------------------------------------------------
-- METRICS: TIME-SERIES PERFORMANCE DATA
-- ---------------------------------------------------------------------
CREATE TABLE metrics (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id         UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    cpu_percent       FLOAT NOT NULL,
    memory_percent    FLOAT NOT NULL,
    disk_percent      FLOAT NOT NULL,
    network_in_kbps   FLOAT NOT NULL DEFAULT 0,
    network_out_kbps  FLOAT NOT NULL DEFAULT 0,
    load_average_1m   FLOAT NOT NULL DEFAULT 0,
    process_count     INTEGER NOT NULL DEFAULT 0,
    recorded_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_metrics_server_time ON metrics(server_id, recorded_at);

-- ---------------------------------------------------------------------
-- LOG MANAGEMENT
-- ---------------------------------------------------------------------
CREATE TYPE log_level AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

CREATE TABLE log_entries (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id          UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    source_application VARCHAR(120) NOT NULL,
    level              log_level NOT NULL,
    message            TEXT NOT NULL,
    trace_id           VARCHAR(64),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_logs_server_level_time ON log_entries(server_id, level, created_at);

-- ---------------------------------------------------------------------
-- INCIDENT MANAGEMENT
-- ---------------------------------------------------------------------
CREATE TYPE incident_severity AS ENUM ('SEV1_CRITICAL', 'SEV2_HIGH', 'SEV3_MEDIUM', 'SEV4_LOW');
CREATE TYPE incident_status   AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE incident_source   AS ENUM ('AUTO_METRIC_THRESHOLD', 'AUTO_LOG_ERROR', 'MANUAL');

CREATE TABLE incidents (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id          UUID REFERENCES servers(id) ON DELETE SET NULL,
    title              VARCHAR(200) NOT NULL,
    description        TEXT NOT NULL,
    severity           incident_severity NOT NULL,
    status             incident_status NOT NULL DEFAULT 'OPEN',
    source             incident_source NOT NULL DEFAULT 'MANUAL',
    assigned_to        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    acknowledged_at    TIMESTAMPTZ,
    resolved_at        TIMESTAMPTZ,
    resolution_notes   TEXT
);
CREATE INDEX ix_incidents_status ON incidents(status);
CREATE INDEX ix_incidents_server ON incidents(server_id);

-- ---------------------------------------------------------------------
-- ALERT MANAGEMENT
-- ---------------------------------------------------------------------
CREATE TYPE alert_metric_type AS ENUM ('CPU', 'MEMORY', 'DISK', 'NETWORK');
CREATE TYPE alert_status      AS ENUM ('TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE alerts (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id        UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    metric_type      alert_metric_type NOT NULL,
    threshold_value  FLOAT NOT NULL,
    observed_value   FLOAT NOT NULL,
    status           alert_status NOT NULL DEFAULT 'TRIGGERED',
    message          VARCHAR(255) NOT NULL,
    notified         BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at      TIMESTAMPTZ
);

CREATE TABLE alert_rules (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id        UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    metric_type      alert_metric_type NOT NULL,
    threshold_value  FLOAT NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- AUDIT LOGS (SECURITY / COMPLIANCE)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    action         VARCHAR(100) NOT NULL,
    resource_type  VARCHAR(50) NOT NULL,
    resource_id    VARCHAR(64),
    ip_address     VARCHAR(45),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- USEFUL REPORTING VIEWS
-- ---------------------------------------------------------------------

-- Current health snapshot per server
CREATE OR REPLACE VIEW v_server_health_snapshot AS
SELECT
    s.id,
    s.hostname,
    s.environment,
    s.status,
    s.last_heartbeat_at,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status IN ('OPEN','ACKNOWLEDGED','IN_PROGRESS')) AS open_incidents,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'TRIGGERED') AS active_alerts
FROM servers s
LEFT JOIN incidents i ON i.server_id = s.id
LEFT JOIN alerts a ON a.server_id = s.id
GROUP BY s.id;

-- Mean time to resolution (MTTR) per severity
CREATE OR REPLACE VIEW v_incident_mttr_by_severity AS
SELECT
    severity,
    COUNT(*) AS resolved_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)::numeric, 1) AS avg_resolution_minutes
FROM incidents
WHERE status = 'RESOLVED' AND resolved_at IS NOT NULL
GROUP BY severity;
