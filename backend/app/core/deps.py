"""
Reusable FastAPI dependencies: current-user resolution and RBAC guards.
"""
import uuid
from typing import Iterable

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.server import Server
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc

    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")

    user = db.get(User, uuid.UUID(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")
    return user


def require_roles(allowed_roles: Iterable[UserRole]):
    """Dependency factory enforcing role-based access control on a route."""

    def _guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Role '{current_user.role}' is not permitted to perform this action",
            )
        return current_user

    return _guard


def verify_agent_api_key(api_key: str, db: Session) -> Server:
    """Used by monitoring-agent ingest endpoints (metrics/logs) instead of user JWTs."""
    server = db.query(Server).filter(Server.api_key == api_key).first()
    if server is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid agent API key")
    return server
