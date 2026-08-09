import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, String
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ServerStatus(str, enum.Enum):
    HEALTHY = "HEALTHY"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    OFFLINE = "OFFLINE"
    UNKNOWN = "UNKNOWN"


class ServerEnvironment(str, enum.Enum):
    PRODUCTION = "PRODUCTION"
    STAGING = "STAGING"
    DEVELOPMENT = "DEVELOPMENT"


class Server(Base):
    """A registered monitored asset (physical/VM/cloud instance/container host)."""

    __tablename__ = "servers"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hostname: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    environment: Mapped[ServerEnvironment] = mapped_column(
        Enum(ServerEnvironment, name="server_environment"), default=ServerEnvironment.PRODUCTION
    )
    cloud_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)  # AWS/Azure/GCP/On-Prem
    region: Mapped[str | None] = mapped_column(String(50), nullable=True)
    instance_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tags: Mapped[str | None] = mapped_column(String(255), nullable=True)  # comma-separated

    # Per-server alert thresholds (override global defaults)
    cpu_threshold: Mapped[float] = mapped_column(Float, default=85.0)
    memory_threshold: Mapped[float] = mapped_column(Float, default=85.0)
    disk_threshold: Mapped[float] = mapped_column(Float, default=90.0)

    status: Mapped[ServerStatus] = mapped_column(
        Enum(ServerStatus, name="server_status"), default=ServerStatus.UNKNOWN
    )
    api_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    last_heartbeat_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    metrics = relationship("Metric", back_populates="server", cascade="all, delete-orphan")
    logs = relationship("LogEntry", back_populates="server", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="server")
