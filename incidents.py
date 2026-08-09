import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.incident import Incident, IncidentSeverity, IncidentSource, IncidentStatus
from app.models.user import User, UserRole
from app.schemas.incident import IncidentCreate, IncidentOut, IncidentStats, IncidentUpdate

router = APIRouter(prefix="/incidents", tags=["Incident Management"])


@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = Incident(**payload.model_dump(), source=IncidentSource.MANUAL)
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("", response_model=list[IncidentOut])
def list_incidents(
    status_filter: IncidentStatus | None = Query(None, alias="status"),
    severity: IncidentSeverity | None = None,
    server_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity:
        query = query.filter(Incident.severity == severity)
    if server_id:
        query = query.filter(Incident.server_id == server_id)
    return query.order_by(Incident.created_at.desc()).all()


@router.get("/stats", response_model=IncidentStats)
def incident_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total_open = (
        db.query(Incident)
        .filter(Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS]))
        .count()
    )
    total_resolved = db.query(Incident).filter(Incident.status == IncidentStatus.RESOLVED).count()
    total_critical = db.query(Incident).filter(Incident.severity == IncidentSeverity.SEV1_CRITICAL).count()

    resolved = (
        db.query(Incident)
        .filter(Incident.status == IncidentStatus.RESOLVED, Incident.resolved_at.isnot(None))
        .all()
    )
    if resolved:
        avg_minutes = sum(
            (i.resolved_at - i.created_at).total_seconds() / 60 for i in resolved
        ) / len(resolved)
    else:
        avg_minutes = None

    severity_rows = db.query(Incident.severity, func.count(Incident.id)).group_by(Incident.severity).all()
    by_severity = {sev.value: count for sev, count in severity_rows}

    return IncidentStats(
        total_open=total_open,
        total_resolved=total_resolved,
        total_critical=total_critical,
        avg_resolution_minutes=round(avg_minutes, 1) if avg_minutes is not None else None,
        by_severity=by_severity,
    )


@router.get("/trends/monthly")
def monthly_incident_trends(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(days=30 * months)
    rows = (
        db.query(
            func.date_trunc("month", Incident.created_at).label("month"),
            func.count(Incident.id),
        )
        .filter(Incident.created_at >= since)
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": month.strftime("%Y-%m"), "incident_count": count} for month, count in rows]


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    incident = db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: uuid.UUID,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SRE, UserRole.OPERATOR])),
):
    incident = db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Incident not found")

    updates = payload.model_dump(exclude_unset=True)
    if "status" in updates:
        new_status = updates["status"]
        if new_status == IncidentStatus.ACKNOWLEDGED and not incident.acknowledged_at:
            incident.acknowledged_at = datetime.utcnow()
        if new_status == IncidentStatus.RESOLVED and not incident.resolved_at:
            incident.resolved_at = datetime.utcnow()

    for field, value in updates.items():
        setattr(incident, field, value)

    db.add(
        AuditLog(
            user_id=current_user.id,
            action="INCIDENT_UPDATED",
            resource_type="INCIDENT",
            resource_id=str(incident.id),
        )
    )
    db.commit()
    db.refresh(incident)
    return incident
