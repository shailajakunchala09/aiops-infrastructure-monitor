"""
Core AIOps logic: evaluates incoming metrics/logs against thresholds,
raises Alerts, and auto-creates Incidents when conditions warrant it.

This is intentionally decoupled from the API layer so it can be reused
by both the synchronous ingest endpoints and the background alert
evaluator (app/services/scheduler.py).
"""
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.logging_config import logger
from app.models.alert import Alert, AlertMetricType, AlertStatus
from app.models.incident import Incident, IncidentSeverity, IncidentSource, IncidentStatus
from app.models.log_entry import LogEntry, LogLevel
from app.models.metric import Metric
from app.models.server import Server, ServerStatus

# Consecutive breaches required before opening an incident (reduces noise/flapping)
INCIDENT_ESCALATION_WINDOW = 3


def evaluate_metric_thresholds(db: Session, server: Server, metric: Metric) -> list[Alert]:
    """Compare a freshly ingested metric sample against the server's thresholds."""
    triggered: list[Alert] = []
    checks = [
        (AlertMetricType.CPU, metric.cpu_percent, server.cpu_threshold),
        (AlertMetricType.MEMORY, metric.memory_percent, server.memory_threshold),
        (AlertMetricType.DISK, metric.disk_percent, server.disk_threshold),
    ]

    for metric_type, observed, threshold in checks:
        if observed >= threshold:
            alert = Alert(
                server_id=server.id,
                metric_type=metric_type,
                threshold_value=threshold,
                observed_value=observed,
                status=AlertStatus.TRIGGERED,
                message=(
                    f"{metric_type.value} usage on {server.hostname} reached "
                    f"{observed:.1f}% (threshold {threshold:.1f}%)"
                ),
            )
            db.add(alert)
            triggered.append(alert)
            logger.warning(f"ALERT triggered: {alert.message}")

    _update_server_status(server, metric)

    if triggered:
        db.flush()
        _maybe_open_incident_for_alerts(db, server, triggered)

    return triggered


def _update_server_status(server: Server, metric: Metric) -> None:
    if (
        metric.cpu_percent >= server.cpu_threshold
        or metric.memory_percent >= server.memory_threshold
        or metric.disk_percent >= server.disk_threshold
    ):
        server.status = ServerStatus.CRITICAL
    elif (
        metric.cpu_percent >= server.cpu_threshold * 0.85
        or metric.memory_percent >= server.memory_threshold * 0.85
    ):
        server.status = ServerStatus.WARNING
    else:
        server.status = ServerStatus.HEALTHY
    server.last_heartbeat_at = datetime.utcnow()


def _maybe_open_incident_for_alerts(db: Session, server: Server, alerts: list[Alert]) -> None:
    """
    Auto-creates an incident if there is not already an open one for this
    server/metric combination, avoiding duplicate incidents for the same
    ongoing problem (idempotent by design).
    """
    for alert in alerts:
        existing_open = (
            db.query(Incident)
            .filter(
                Incident.server_id == server.id,
                Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS]),
                Incident.source == IncidentSource.AUTO_METRIC_THRESHOLD,
                Incident.title.like(f"%{alert.metric_type.value}%"),
            )
            .first()
        )
        if existing_open:
            continue

        severity = _severity_for_metric(alert.observed_value, alert.threshold_value)
        incident = Incident(
            server_id=server.id,
            title=f"High {alert.metric_type.value} utilization on {server.hostname}",
            description=alert.message,
            severity=severity,
            status=IncidentStatus.OPEN,
            source=IncidentSource.AUTO_METRIC_THRESHOLD,
        )
        db.add(incident)
        logger.error(f"INCIDENT auto-created: {incident.title} [{severity.value}]")


def _severity_for_metric(observed: float, threshold: float) -> IncidentSeverity:
    overage_ratio = observed / threshold if threshold else 1.0
    if overage_ratio >= 1.15:
        return IncidentSeverity.SEV1_CRITICAL
    if overage_ratio >= 1.05:
        return IncidentSeverity.SEV2_HIGH
    return IncidentSeverity.SEV3_MEDIUM


def evaluate_log_for_incident(db: Session, server: Server, log_entry: LogEntry) -> Incident | None:
    """Auto-creates an incident when repeated CRITICAL errors are logged in a short window."""
    if log_entry.level != LogLevel.CRITICAL:
        return None

    window_start = datetime.utcnow() - timedelta(minutes=5)
    recent_critical_count = (
        db.query(LogEntry)
        .filter(
            LogEntry.server_id == server.id,
            LogEntry.level == LogLevel.CRITICAL,
            LogEntry.created_at >= window_start,
        )
        .count()
    )

    if recent_critical_count < INCIDENT_ESCALATION_WINDOW:
        return None

    existing_open = (
        db.query(Incident)
        .filter(
            Incident.server_id == server.id,
            Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED]),
            Incident.source == IncidentSource.AUTO_LOG_ERROR,
        )
        .first()
    )
    if existing_open:
        return None

    incident = Incident(
        server_id=server.id,
        title=f"Repeated critical errors from {log_entry.source_application} on {server.hostname}",
        description=(
            f"{recent_critical_count} CRITICAL log entries recorded in the last 5 minutes. "
            f"Latest: {log_entry.message[:200]}"
        ),
        severity=IncidentSeverity.SEV2_HIGH,
        status=IncidentStatus.OPEN,
        source=IncidentSource.AUTO_LOG_ERROR,
    )
    db.add(incident)
    logger.error(f"INCIDENT auto-created from logs: {incident.title}")
    return incident
