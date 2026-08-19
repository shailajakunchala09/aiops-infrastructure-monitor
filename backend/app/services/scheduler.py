"""
Background monitoring scheduler for the public AIOps demo.

Generates healthy demo metrics for registered demo servers so that
the public Render deployment continuously has:
- HEALTHY server status
- Performance metrics
- Updated heartbeats
"""

import asyncio
from datetime import datetime

from app.core.config import settings
from app.core.logging_config import logger
from app.db.session import SessionLocal
from app.models.server import Server, ServerStatus
from app.models.metric import Metric
from app.services.monitoring_service import evaluate_metric_thresholds


HEALTHY_METRICS = {
    "cpu_percent": 35.0,
    "memory_percent": 40.0,
    "disk_percent": 45.0,
    "network_in_kbps": 100.0,
    "network_out_kbps": 50.0,
    "load_average_1m": 1.0,
    "process_count": 120,
}


async def generate_demo_metrics() -> None:
    """Generate healthy metrics for all registered servers."""

    db = SessionLocal()

    try:
        servers = db.query(Server).all()

        for server in servers:
            metric = Metric(
                server_id=server.id,
                **HEALTHY_METRICS,
            )

            db.add(metric)
            db.flush()

            evaluate_metric_thresholds(
                db,
                server,
                metric,
            )

        db.commit()

        logger.info(
            "Generated HEALTHY metrics for %s servers",
            len(servers),
        )

    except Exception as exc:
        db.rollback()

        logger.error(
            "Demo metric generation failed: %s",
            exc,
        )

    finally:
        db.close()


async def start_background_scheduler() -> None:
    """
    Continuously generate healthy demo metrics.

    This keeps the public Render demo populated with live-looking
    performance data and current server heartbeats.
    """

    logger.info(
        "Public AIOps monitoring scheduler started"
    )

    while True:
        try:
            await generate_demo_metrics()

        except Exception as exc:
            logger.error(
                "Scheduler iteration failed: %s",
                exc,
            )

        await asyncio.sleep(
            settings.ALERT_EVALUATION_INTERVAL_SECONDS
        )