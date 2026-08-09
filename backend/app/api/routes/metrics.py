import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, verify_agent_api_key
from app.db.session import get_db
from app.models.metric import Metric
from app.models.user import User
from app.schemas.metric import MetricIngest, MetricOut, MetricSummary
from app.services.monitoring_service import evaluate_metric_thresholds

router = APIRouter(prefix="/metrics", tags=["Infrastructure Monitoring"])


@router.post("/ingest", response_model=MetricOut, status_code=status.HTTP_201_CREATED)
def ingest_metric(
    payload: MetricIngest,
    x_api_key: str = Header(..., description="API key issued at server registration"),
    db: Session = Depends(get_db),
):
    """Endpoint called by the monitoring-agent every collection cycle."""
    server = verify_agent_api_key(x_api_key, db)

    metric = Metric(server_id=server.id, **payload.model_dump())
    db.add(metric)
    db.flush()

    evaluate_metric_thresholds(db, server, metric)

    db.commit()
    db.refresh(metric)
    return metric


@router.get("/servers/{server_id}", response_model=list[MetricOut])
def get_server_metrics(
    server_id: uuid.UUID,
    hours: int = Query(24, ge=1, le=720),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(hours=hours)
    return (
        db.query(Metric)
        .filter(Metric.server_id == server_id, Metric.recorded_at >= since)
        .order_by(Metric.recorded_at.asc())
        .all()
    )


@router.get("/servers/{server_id}/summary", response_model=MetricSummary)
def get_server_metric_summary(
    server_id: uuid.UUID,
    hours: int = Query(24, ge=1, le=720),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(hours=hours)
    row = (
        db.query(
            func.avg(Metric.cpu_percent),
            func.avg(Metric.memory_percent),
            func.avg(Metric.disk_percent),
            func.max(Metric.cpu_percent),
            func.max(Metric.memory_percent),
            func.max(Metric.disk_percent),
            func.count(Metric.id),
        )
        .filter(Metric.server_id == server_id, Metric.recorded_at >= since)
        .first()
    )
    if not row or row[6] == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No metric samples found in this window")

    return MetricSummary(
        server_id=server_id,
        avg_cpu=round(row[0] or 0, 2),
        avg_memory=round(row[1] or 0, 2),
        avg_disk=round(row[2] or 0, 2),
        max_cpu=round(row[3] or 0, 2),
        max_memory=round(row[4] or 0, 2),
        max_disk=round(row[5] or 0, 2),
        sample_count=row[6],
    )
