import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, verify_agent_api_key
from app.db.session import get_db
from app.models.log_entry import LogEntry, LogLevel
from app.models.user import User
from app.schemas.log_entry import LogIngest, LogLevelCount, LogOut
from app.services.monitoring_service import evaluate_log_for_incident

router = APIRouter(prefix="/logs", tags=["Log Management"])


@router.post("/ingest", response_model=LogOut, status_code=201)
def ingest_log(
    payload: LogIngest,
    x_api_key: str = Header(...),
    db: Session = Depends(get_db),
):
    server = verify_agent_api_key(x_api_key, db)
    log_entry = LogEntry(server_id=server.id, **payload.model_dump())
    db.add(log_entry)
    db.flush()

    evaluate_log_for_incident(db, server, log_entry)

    db.commit()
    db.refresh(log_entry)
    return log_entry


@router.get("", response_model=list[LogOut])
def search_logs(
    server_id: uuid.UUID | None = None,
    level: LogLevel | None = None,
    keyword: str | None = Query(None, description="Free-text search within log message"),
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(hours=hours)
    query = db.query(LogEntry).filter(LogEntry.created_at >= since)

    if server_id:
        query = query.filter(LogEntry.server_id == server_id)
    if level:
        query = query.filter(LogEntry.level == level)
    if keyword:
        query = query.filter(LogEntry.message.ilike(f"%{keyword}%"))

    return query.order_by(LogEntry.created_at.desc()).limit(limit).all()


@router.get("/analytics/level-distribution", response_model=list[LogLevelCount])
def log_level_distribution(
    hours: int = Query(24, ge=1, le=720),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(hours=hours)
    rows = (
        db.query(LogEntry.level, func.count(LogEntry.id))
        .filter(LogEntry.created_at >= since)
        .group_by(LogEntry.level)
        .all()
    )
    return [LogLevelCount(level=level, count=count) for level, count in rows]


@router.get("/analytics/top-errors")
def top_error_sources(
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Identifies the applications generating the most ERROR/CRITICAL logs (failure analysis)."""
    since = datetime.utcnow() - timedelta(hours=hours)
    rows = (
        db.query(LogEntry.source_application, func.count(LogEntry.id).label("error_count"))
        .filter(
            LogEntry.created_at >= since,
            LogEntry.level.in_([LogLevel.ERROR, LogLevel.CRITICAL]),
        )
        .group_by(LogEntry.source_application)
        .order_by(func.count(LogEntry.id).desc())
        .limit(limit)
        .all()
    )
    return [{"source_application": app, "error_count": count} for app, count in rows]
