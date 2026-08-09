import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MetricIngest(BaseModel):
    """Payload sent by the monitoring agent on every collection cycle."""

    cpu_percent: float = Field(ge=0, le=100)
    memory_percent: float = Field(ge=0, le=100)
    disk_percent: float = Field(ge=0, le=100)
    network_in_kbps: float = Field(ge=0, default=0.0)
    network_out_kbps: float = Field(ge=0, default=0.0)
    load_average_1m: float = Field(ge=0, default=0.0)
    process_count: int = Field(ge=0, default=0)


class MetricOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    server_id: uuid.UUID
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    network_in_kbps: float
    network_out_kbps: float
    load_average_1m: float
    process_count: int
    recorded_at: datetime


class MetricSummary(BaseModel):
    """Aggregated stats used by dashboard charts."""

    server_id: uuid.UUID
    avg_cpu: float
    avg_memory: float
    avg_disk: float
    max_cpu: float
    max_memory: float
    max_disk: float
    sample_count: int
