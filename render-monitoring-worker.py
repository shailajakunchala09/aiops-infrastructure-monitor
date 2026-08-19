import os
import time
import requests
import logging
import uuid

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [public-monitor] %(levelname)s %(message)s",
)

API_URL = os.environ["AIOPS_API_URL"].rstrip("/")

SERVERS = [
    {
        "name": "app-server-01",
        "api_key": os.environ["APP_SERVER_API_KEY"],
    },
    {
        "name": "database-01",
        "api_key": os.environ["DATABASE_SERVER_API_KEY"],
    },
    {
        "name": "web-server-01",
        "api_key": os.environ["WEB_SERVER_API_KEY"],
    },
    {
        "name": "test-server-01",
        "api_key": os.environ["TEST_SERVER_API_KEY"],
    },
]

INTERVAL = 30


def send_metrics(server):
    metrics = {
        "cpu_percent": 35.0,
        "memory_percent": 40.0,
        "disk_percent": 45.0,
        "network_in_kbps": 100.0,
        "network_out_kbps": 50.0,
        "load_average_1m": 1.0,
        "process_count": 120,
    }

    response = requests.post(
        f"{API_URL}/metrics/ingest",
        json=metrics,
        headers={
            "X-API-Key": server["api_key"],
        },
        timeout=15,
    )

    response.raise_for_status()

    logging.info(
        "%s -> HEALTHY | metrics sent",
        server["name"],
    )


def send_log(server, level, message):
    payload = {
        "source_application": "public-monitoring-agent",
        "level": level,
        "message": message,
        "trace_id": str(uuid.uuid4()),
    }

    response = requests.post(
        f"{API_URL}/logs/ingest",
        json=payload,
        headers={
            "X-API-Key": server["api_key"],
        },
        timeout=15,
    )

    response.raise_for_status()

    logging.info(
        "%s -> %s log sent",
        server["name"],
        level,
    )


def send_demo_logs(server, cycle):
    # Normal operational log
    send_log(
        server,
        "INFO",
        f"Health check completed successfully for {server['name']}. "
        "All monitored resources are operating within normal limits.",
    )

    # Occasional warning for Log Analytics
    if cycle % 2 == 0:
        send_log(
            server,
            "WARNING",
            f"Routine monitoring warning on {server['name']}: "
            "connection latency briefly exceeded the normal baseline.",
        )

    # Occasional recoverable error for Top Errors
    if cycle % 4 == 0:
        send_log(
            server,
            "ERROR",
            f"Recoverable application error detected on {server['name']}: "
            "temporary downstream service timeout. Retry succeeded.",
        )


def main():
    logging.info("Public AIOps monitoring worker started")
    logging.info("Backend: %s", API_URL)

    cycle = 0

    while True:
        cycle += 1

        for server in SERVERS:

            # Keep infrastructure HEALTHY
            try:
                send_metrics(server)
            except Exception as exc:
                logging.error(
                    "%s -> metric failure: %s",
                    server["name"],
                    exc,
                )

            # Populate Log Analytics
            try:
                send_demo_logs(server, cycle)
            except Exception as exc:
                logging.error(
                    "%s -> log failure: %s",
                    server["name"],
                    exc,
                )

        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()