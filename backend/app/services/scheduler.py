"""
Free public demo monitoring scheduler.

Generates demo metrics and logs directly in the existing
Render PostgreSQL database.
"""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.logging_config import logger
from app.models.server import Server, ServerStatus
from app.models.metric import Metric
from app.models.log_entry import LogEntry, LogLevel


INTERVAL = 30


def generate_demo_data(db: Session) -> None:
    servers = db.query(Server).all()

    if not servers:
        logger.warning("No servers found for demo monitoring")
        return

    for server in servers:
        now = datetime.now(timezone.utc)

        server.status = ServerStatus.HEALTHY
        server.last_heartbeat_at = now

        db.add(
            Metric(
                server_id=server.id,
                cpu_percent=35.0,
                memory_percent=40.0,
                disk_percent=45.0,
                network_in_kbps=100.0,
                network_out_kbps=50.0,
                load_average_1m=1.0,
                process_count=120,
            )
        )

        db.add(
            LogEntry(
                server_id=server.id,
                source_application="public-monitoring-agent",
                level=LogLevel.INFO,
                message=(
                    f"Health check completed successfully for "
                    f"{server.hostname}. All monitored resources "
                    "are operating within normal limits."
                ),
                trace_id=str(uuid.uuid4()),
            )
        )

        db.add(
            LogEntry(
                server_id=server.id,
                source_application="public-monitoring-agent",
                level=LogLevel.WARNING,
                message=(
                    f"Routine monitoring warning on {server.hostname}: "
                    "connection latency briefly exceeded the normal baseline."
                ),
                trace_id=str(uuid.uuid4()),
            )
        )

        db.add(
            LogEntry(
                server_id=server.id,
                source_application="public-monitoring-agent",
                level=LogLevel.ERROR,
                message=(
                    f"Recoverable application error detected on "
                    f"{server.hostname}: temporary downstream service "
                    "timeout. Retry succeeded."
                ),
                trace_id=str(uuid.uuid4()),
            )
        )

    db.commit()

    logger.info(
        "Public demo monitoring: generated metrics and logs for %d servers",
        len(servers),
    )


async def start_background_scheduler() -> None:
    """Runs inside the existing Render Web Service."""

    logger.info("Background demo monitoring scheduler started")

    while True:
        db = SessionLocal()

        try:
            generate_demo_data(db)

        except Exception as exc:
            db.rollback()
            logger.error(
                "Demo monitoring scheduler failed: %s",
                exc,
            )

        finally:
            db.close()

        await asyncio.sleep(INTERVAL)