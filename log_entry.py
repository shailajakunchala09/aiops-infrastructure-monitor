import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.log_entry import LogLevel


class LogIngest(BaseModel):
    source_application: str = Field(min_length=1, max_length=120)
    level: LogLevel
    message: str = Field(min_length=1)
    trace_id: str | None = None


class LogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    server_id: uuid.UUID
    source_application: str
    level: LogLevel
    message: str
    trace_id: str | None
    created_at: datetime


class LogLevelCount(BaseModel):
    level: LogLevel
    count: int
