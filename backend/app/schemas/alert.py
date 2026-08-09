import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.alert import AlertMetricType, AlertStatus


class AlertRuleCreate(BaseModel):
    server_id: uuid.UUID
    metric_type: AlertMetricType
    threshold_value: float = Field(gt=0, le=100)


class AlertRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    server_id: uuid.UUID
    metric_type: AlertMetricType
    threshold_value: float
    is_active: bool
    created_at: datetime


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    server_id: uuid.UUID
    metric_type: AlertMetricType
    threshold_value: float
    observed_value: float
    status: AlertStatus
    message: str
    triggered_at: datetime
    resolved_at: datetime | None


class OverviewStats(BaseModel):
    """Powers the top-level Operations Dashboard overview page."""

    total_servers: int
    healthy_servers: int
    warning_servers: int
    critical_servers: int
    offline_servers: int
    uptime_percentage: float
    active_incidents: int
    critical_alerts_last_24h: int
    open_alerts: int
