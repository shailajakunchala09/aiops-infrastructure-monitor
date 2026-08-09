import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.server import ServerEnvironment, ServerStatus


class ServerCreate(BaseModel):
    hostname: str = Field(min_length=1, max_length=150)
    ip_address: str = Field(min_length=7, max_length=45)
    environment: ServerEnvironment = ServerEnvironment.PRODUCTION
    cloud_provider: str | None = None
    region: str | None = None
    instance_type: str | None = None
    tags: str | None = None
    cpu_threshold: float = 85.0
    memory_threshold: float = 85.0
    disk_threshold: float = 90.0


class ServerUpdate(BaseModel):
    hostname: str | None = None
    environment: ServerEnvironment | None = None
    cpu_threshold: float | None = None
    memory_threshold: float | None = None
    disk_threshold: float | None = None


class ServerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    hostname: str
    ip_address: str
    environment: ServerEnvironment
    cloud_provider: str | None
    region: str | None
    instance_type: str | None
    status: ServerStatus
    cpu_threshold: float
    memory_threshold: float
    disk_threshold: float
    registered_at: datetime
    last_heartbeat_at: datetime | None


class ServerRegisteredOut(ServerOut):
    """Returned only once at registration time - includes the agent API key."""

    api_key: str
