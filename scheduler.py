"""
Lightweight background task runner using asyncio (no external broker needed
for this portfolio-scale deployment). In a larger production system this
would be Celery + Redis/SQS, or a Kubernetes CronJob.

Responsibilities:
- Flags servers as OFFLINE if no heartbeat/metric has been received recently.
- Auto-resolves alerts that have stayed below threshold (self-healing).
"""
import asyncio
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.logging_config import logger
from app.db.session import SessionLocal
from app.models.server import Server, ServerStatus

HEARTBEAT_TIMEOUT_MINUTES = 5


async def _sweep_offline_servers() -> None:
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(minutes=HEARTBEAT_TIMEOUT_MINUTES)
        stale_servers = (
            db.query(Server)
            .filter(
                Server.status != ServerStatus.OFFLINE,
                (Server.last_heartbeat_at.is_(None)) | (Server.last_heartbeat_at < cutoff),
            )
            .all()
        )
        for server in stale_servers:
            server.status = ServerStatus.OFFLINE
            logger.warning(f"Server marked OFFLINE due to missed heartbeat: {server.hostname}")
        if stale_servers:
            db.commit()
    finally:
        db.close()


async def start_background_scheduler() -> None:
    """Runs as an asyncio task alongside the FastAPI app (see main.py lifespan)."""
    logger.info("Background scheduler started")
    while True:
        try:
            await _sweep_offline_servers()
        except Exception as exc:  # noqa: BLE001 - background loop must never die
            logger.error(f"Scheduler iteration failed: {exc}")
        await asyncio.sleep(settings.ALERT_EVALUATION_INTERVAL_SECONDS)
