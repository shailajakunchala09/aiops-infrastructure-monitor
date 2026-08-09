import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Metric(Base):
    """
    Time-series resource utilization sample reported by the monitoring agent.
    In a production deployment this table would typically be a hypertable
    (TimescaleDB) or offloaded to Prometheus/InfluxDB once volume grows;
    it is modeled here as a plain indexed table for portability.
    """

    __tablename__ = "metrics"
    __table_args__ = (
        Index("ix_metrics_server_time", "server_id", "recorded_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    server_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )

    cpu_percent: Mapped[float] = mapped_column(Float, nullable=False)
    memory_percent: Mapped[float] = mapped_column(Float, nullable=False)
    disk_percent: Mapped[float] = mapped_column(Float, nullable=False)
    network_in_kbps: Mapped[float] = mapped_column(Float, default=0.0)
    network_out_kbps: Mapped[float] = mapped_column(Float, default=0.0)
    load_average_1m: Mapped[float] = mapped_column(Float, default=0.0)
    process_count: Mapped[int] = mapped_column(default=0)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, index=True
    )

    server = relationship("Server", back_populates="metrics")
