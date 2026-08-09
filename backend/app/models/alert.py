import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class AlertMetricType(str, enum.Enum):
    CPU = "CPU"
    MEMORY = "MEMORY"
    DISK = "DISK"
    NETWORK = "NETWORK"


class AlertStatus(str, enum.Enum):
    TRIGGERED = "TRIGGERED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    server_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    metric_type: Mapped[AlertMetricType] = mapped_column(
        Enum(AlertMetricType, name="alert_metric_type"), nullable=False
    )
    threshold_value: Mapped[float] = mapped_column(Float, nullable=False)
    observed_value: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="alert_status"), default=AlertStatus.TRIGGERED
    )
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    notified: Mapped[bool] = mapped_column(Boolean, default=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    server = relationship("Server")


class AlertRule(Base):
    """User-configurable threshold rule (extends the per-server defaults)."""

    __tablename__ = "alert_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    server_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    metric_type: Mapped[AlertMetricType] = mapped_column(
        Enum(AlertMetricType, name="alert_rule_metric_type"), nullable=False
    )
    threshold_value: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
