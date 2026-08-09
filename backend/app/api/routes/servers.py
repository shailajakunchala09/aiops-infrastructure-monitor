import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.server import Server
from app.models.user import User, UserRole
from app.schemas.server import ServerCreate, ServerOut, ServerRegisteredOut, ServerUpdate

router = APIRouter(prefix="/servers", tags=["Infrastructure Monitoring"])


@router.post(
    "",
    response_model=ServerRegisteredOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.SRE]))],
)
def register_server(payload: ServerCreate, db: Session = Depends(get_db)):
    """Register a new server/instance/container host to be monitored."""
    server = Server(**payload.model_dump(), api_key=secrets.token_hex(32))
    db.add(server)
    db.commit()
    db.refresh(server)
    return server


@router.get("", response_model=list[ServerOut])
def list_servers(
    environment: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Server)
    if environment:
        query = query.filter(Server.environment == environment)
    return query.order_by(Server.hostname).all()


@router.get("/{server_id}", response_model=ServerOut)
def get_server(server_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    server = db.get(Server, server_id)
    if not server:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Server not found")
    return server


@router.patch(
    "/{server_id}",
    response_model=ServerOut,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.SRE]))],
)
def update_server(server_id: uuid.UUID, payload: ServerUpdate, db: Session = Depends(get_db)):
    server = db.get(Server, server_id)
    if not server:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Server not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(server, field, value)
    db.commit()
    db.refresh(server)
    return server


@router.delete(
    "/{server_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles([UserRole.ADMIN]))],
)
def delete_server(server_id: uuid.UUID, db: Session = Depends(get_db)):
    server = db.get(Server, server_id)
    if not server:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Server not found")
    db.delete(server)
    db.commit()
