"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-01-01

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(150), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("ADMIN", "SRE", "OPERATOR", "VIEWER", name="user_role"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "servers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("hostname", sa.String(150), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=False),
        sa.Column(
            "environment",
            sa.Enum("PRODUCTION", "STAGING", "DEVELOPMENT", name="server_environment"),
            nullable=False,
        ),
        sa.Column("cloud_provider", sa.String(50), nullable=True),
        sa.Column("region", sa.String(50), nullable=True),
        sa.Column("instance_type", sa.String(50), nullable=True),
        sa.Column("tags", sa.String(255), nullable=True),
        sa.Column("cpu_threshold", sa.Float, default=85.0),
        sa.Column("memory_threshold", sa.Float, default=85.0),
        sa.Column("disk_threshold", sa.Float, default=90.0),
        sa.Column(
            "status",
            sa.Enum("HEALTHY", "WARNING", "CRITICAL", "OFFLINE", "UNKNOWN", name="server_status"),
            nullable=False,
        ),
        sa.Column("api_key", sa.String(64), nullable=False, unique=True),
        sa.Column("registered_at", sa.DateTime(timezone=True)),
        sa.Column("last_heartbeat_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_servers_hostname", "servers", ["hostname"])

    op.create_table(
        "metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("server_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("servers.id", ondelete="CASCADE")),
        sa.Column("cpu_percent", sa.Float, nullable=False),
        sa.Column("memory_percent", sa.Float, nullable=False),
        sa.Column("disk_percent", sa.Float, nullable=False),
        sa.Column("network_in_kbps", sa.Float, default=0.0),
        sa.Column("network_out_kbps", sa.Float, default=0.0),
        sa.Column("load_average_1m", sa.Float, default=0.0),
        sa.Column("process_count", sa.Integer, default=0),
        sa.Column("recorded_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_metrics_server_time", "metrics", ["server_id", "recorded_at"])

    op.create_table(
        "log_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("server_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("servers.id", ondelete="CASCADE")),
        sa.Column("source_application", sa.String(120), nullable=False),
        sa.Column(
            "level", sa.Enum("INFO", "WARNING", "ERROR", "CRITICAL", name="log_level"), nullable=False
        ),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("trace_id", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_logs_server_level_time", "log_entries", ["server_id", "level", "created_at"])

    op.create_table(
        "incidents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("server_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("servers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column(
            "severity",
            sa.Enum("SEV1_CRITICAL", "SEV2_HIGH", "SEV3_MEDIUM", "SEV4_LOW", name="incident_severity"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED", name="incident_status"),
            nullable=False,
        ),
        sa.Column(
            "source",
            sa.Enum("AUTO_METRIC_THRESHOLD", "AUTO_LOG_ERROR", "MANUAL", name="incident_source"),
            nullable=False,
        ),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_notes", sa.Text, nullable=True),
    )

    op.create_table(
        "alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("server_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("servers.id", ondelete="CASCADE")),
        sa.Column(
            "metric_type", sa.Enum("CPU", "MEMORY", "DISK", "NETWORK", name="alert_metric_type"), nullable=False
        ),
        sa.Column("threshold_value", sa.Float, nullable=False),
        sa.Column("observed_value", sa.Float, nullable=False),
        sa.Column(
            "status",
            sa.Enum("TRIGGERED", "ACKNOWLEDGED", "RESOLVED", name="alert_status"),
            nullable=False,
        ),
        sa.Column("message", sa.String(255), nullable=False),
        sa.Column("notified", sa.Boolean, default=False),
        sa.Column("triggered_at", sa.DateTime(timezone=True)),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "alert_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("server_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("servers.id", ondelete="CASCADE")),
        sa.Column(
            "metric_type",
            sa.Enum("CPU", "MEMORY", "DISK", "NETWORK", name="alert_rule_metric_type"),
            nullable=False,
        ),
        sa.Column("threshold_value", sa.Float, nullable=False),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.String(64), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("alert_rules")
    op.drop_table("alerts")
    op.drop_table("incidents")
    op.drop_table("log_entries")
    op.drop_table("metrics")
    op.drop_table("servers")
    op.drop_table("users")
