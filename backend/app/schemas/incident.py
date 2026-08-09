import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.incident import IncidentSeverity, IncidentSource, IncidentStatus


class IncidentCreate(BaseModel):
    server_id: uuid.UUID | None = None
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=3)
    severity: IncidentSeverity


class IncidentUpdate(BaseModel):
    status: IncidentStatus | None = None
    assigned_to: uuid.UUID | None = None
    resolution_notes: str | None = None


class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    server_id: uuid.UUID | None
    title: str
    description: str
    severity: IncidentSeverity
    status: IncidentStatus
    source: IncidentSource
    assigned_to: uuid.UUID | None
    created_at: datetime
    acknowledged_at: datetime | None
    resolved_at: datetime | None
    resolution_notes: str | None


class IncidentStats(BaseModel):
    total_open: int
    total_resolved: int
    total_critical: int
    avg_resolution_minutes: float | None
    by_severity: dict[str, int]
