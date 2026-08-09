import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.alert import Alert, AlertRule, AlertStatus
from app.models.user import User, UserRole
from app.schemas.alert import AlertOut, AlertRuleCreate, AlertRuleOut

router = APIRouter(prefix="/alerts", tags=["Alert Management"])


@router.post(
    "/rules",
    response_model=AlertRuleOut,
    status_code=201,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.SRE]))],
)
def create_alert_rule(payload: AlertRuleCreate, db: Session = Depends(get_db)):
    rule = AlertRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/rules", response_model=list[AlertRuleOut])
def list_alert_rules(
    server_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(AlertRule)
    if server_id:
        query = query.filter(AlertRule.server_id == server_id)
    return query.all()


@router.get("", response_model=list[AlertOut])
def list_alerts(
    server_id: uuid.UUID | None = None,
    status_filter: AlertStatus | None = Query(None, alias="status"),
    hours: int = Query(24, ge=1, le=720),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(hours=hours)
    query = db.query(Alert).filter(Alert.triggered_at >= since)
    if server_id:
        query = query.filter(Alert.server_id == server_id)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    return query.order_by(Alert.triggered_at.desc()).all()


@router.patch("/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.ADMIN, UserRole.SRE, UserRole.OPERATOR])),
):
    alert = db.get(Alert, alert_id)
    alert.status = AlertStatus.ACKNOWLEDGED
    db.commit()
    db.refresh(alert)
    return alert


@router.patch("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.ADMIN, UserRole.SRE, UserRole.OPERATOR])),
):
    alert = db.get(Alert, alert_id)
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert
