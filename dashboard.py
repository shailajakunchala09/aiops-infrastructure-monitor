from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.alert import Alert, AlertStatus
from app.models.incident import Incident, IncidentStatus
from app.models.server import Server, ServerStatus
from app.models.user import User
from app.schemas.alert import OverviewStats

router = APIRouter(prefix="/dashboard", tags=["Operations Dashboard"])


@router.get("/overview", response_model=OverviewStats)
def get_overview(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total_servers = db.query(Server).count()
    healthy = db.query(Server).filter(Server.status == ServerStatus.HEALTHY).count()
    warning = db.query(Server).filter(Server.status == ServerStatus.WARNING).count()
    critical = db.query(Server).filter(Server.status == ServerStatus.CRITICAL).count()
    offline = db.query(Server).filter(Server.status == ServerStatus.OFFLINE).count()

    uptime_pct = round(((healthy + warning) / total_servers) * 100, 2) if total_servers else 100.0

    active_incidents = (
        db.query(Incident)
        .filter(Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS]))
        .count()
    )

    since_24h = datetime.utcnow() - timedelta(hours=24)
    critical_alerts_24h = (
        db.query(Alert)
        .filter(Alert.triggered_at >= since_24h, Alert.status == AlertStatus.TRIGGERED)
        .count()
    )
    open_alerts = db.query(Alert).filter(Alert.status == AlertStatus.TRIGGERED).count()

    return OverviewStats(
        total_servers=total_servers,
        healthy_servers=healthy,
        warning_servers=warning,
        critical_servers=critical,
        offline_servers=offline,
        uptime_percentage=uptime_pct,
        active_incidents=active_incidents,
        critical_alerts_last_24h=critical_alerts_24h,
        open_alerts=open_alerts,
    )
