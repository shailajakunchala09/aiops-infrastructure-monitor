#!/usr/bin/env python3
"""
AIOps Monitoring Agent
-----------------------
Collects system metrics and sends them to the AIOps platform.

Supports optional simulated server states:

    AIOPS_SIMULATED_STATUS=HEALTHY
    AIOPS_SIMULATED_STATUS=WARNING
    AIOPS_SIMULATED_STATUS=ERROR

This allows the demo environment to show different server health states.
"""

import logging
import os
import time
import threading
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, HTTPServer

import psutil
import requests


# -------------------------------------------------------------------
# Logging
# -------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [agent] %(levelname)s %(message)s",
)

logger = logging.getLogger("aiops-agent")


# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------

@dataclass
class AgentConfig:
    api_url: str
    api_key: str
    collection_interval_seconds: int = 15
    log_file_path: str | None = None
    source_application: str = "monitoring-agent"

    @classmethod
    def from_env(cls) -> "AgentConfig":
        api_url = os.environ.get(
            "AIOPS_API_URL",
            "http://localhost:8000/api/v1",
        )

        api_key = os.environ.get("AIOPS_API_KEY")

        if not api_key:
            raise RuntimeError(
                "AIOPS_API_KEY environment variable is required"
            )

        return cls(
            api_url=api_url.rstrip("/"),
            api_key=api_key,
            collection_interval_seconds=int(
                os.environ.get(
                    "AIOPS_COLLECTION_INTERVAL",
                    "15",
                )
            ),
            log_file_path=os.environ.get(
                "AIOPS_LOG_FILE_PATH"
            ),
            source_application=os.environ.get(
                "AIOPS_SOURCE_APP",
                "monitoring-agent",
            ),
        )


# -------------------------------------------------------------------
# Simulated server states
# -------------------------------------------------------------------

def get_simulated_metrics() -> dict | None:
    """
    Returns predefined metrics when AIOPS_SIMULATED_STATUS is set.

    HEALTHY:
        CPU    35%
        MEMORY 40%
        DISK   45%

    WARNING:
        CPU    75%
        MEMORY 78%
        DISK   80%

    ERROR:
        CPU    95%
        MEMORY 95%
        DISK   95%

    If the environment variable is not set, real system metrics
    are collected instead.
    """

    status = os.environ.get(
        "AIOPS_SIMULATED_STATUS",
        "",
    ).upper()

    profiles = {
        "HEALTHY": {
            "cpu_percent": 35.0,
            "memory_percent": 40.0,
            "disk_percent": 45.0,
        },

        "WARNING": {
            "cpu_percent": 75.0,
            "memory_percent": 78.0,
            "disk_percent": 80.0,
        },

        "ERROR": {
            "cpu_percent": 95.0,
            "memory_percent": 95.0,
            "disk_percent": 95.0,
        },
    }

    metrics = profiles.get(status)

    if metrics is None:
        return None

    logger.info(
        "Using simulated server state: %s",
        status,
    )

    return metrics


# -------------------------------------------------------------------
# Collect metrics
# -------------------------------------------------------------------

def collect_metrics() -> dict:
    """
    Collects either simulated or real system metrics.
    """

    simulated = get_simulated_metrics()

    if simulated:

        return {
            **simulated,

            "network_in_kbps": 100.0,
            "network_out_kbps": 50.0,

            "load_average_1m": 1.0,

            "process_count": len(
                psutil.pids()
            ),
        }

    # ---------------------------------------------------------------
    # Real system metrics
    # ---------------------------------------------------------------

    cpu_percent = psutil.cpu_percent(
        interval=1
    )

    memory = psutil.virtual_memory()

    disk = psutil.disk_usage("/")

    net = psutil.net_io_counters()

    try:
        load_avg = os.getloadavg()[0]

    except (
        AttributeError,
        OSError,
    ):
        load_avg = 0.0

    return {
        "cpu_percent": round(
            cpu_percent,
            2,
        ),

        "memory_percent": round(
            memory.percent,
            2,
        ),

        "disk_percent": round(
            disk.percent,
            2,
        ),

        "network_in_kbps": round(
            net.bytes_recv / 1024,
            2,
        ),

        "network_out_kbps": round(
            net.bytes_sent / 1024,
            2,
        ),

        "load_average_1m": round(
            load_avg,
            2,
        ),

        "process_count": len(
            psutil.pids()
        ),
    }


# -------------------------------------------------------------------
# Send metrics
# -------------------------------------------------------------------

def send_metrics(
    config: AgentConfig,
    metrics: dict,
) -> None:

    try:

        response = requests.post(

            f"{config.api_url}/metrics/ingest",

            json=metrics,

            headers={
                "X-API-Key": config.api_key
            },

            timeout=10,
        )

        response.raise_for_status()

        logger.info(
            "Metrics sent | "
            "CPU=%s%% "
            "MEM=%s%% "
            "DISK=%s%%",

            metrics["cpu_percent"],
            metrics["memory_percent"],
            metrics["disk_percent"],
        )

    except requests.RequestException as exc:

        logger.error(
            "Failed to send metrics: %s",
            exc,
        )


# -------------------------------------------------------------------
# Send logs
# -------------------------------------------------------------------

def send_log(
    config: AgentConfig,
    level: str,
    message: str,
) -> None:

    try:

        response = requests.post(

            f"{config.api_url}/logs/ingest",

            json={
                "source_application":
                    config.source_application,

                "level":
                    level,

                "message":
                    message,
            },

            headers={
                "X-API-Key": config.api_key
            },

            timeout=10,
        )

        response.raise_for_status()

    except requests.RequestException as exc:

        logger.error(
            "Failed to send log entry: %s",
            exc,
        )


# -------------------------------------------------------------------
# Tail log file
# -------------------------------------------------------------------

def tail_log_file(
    config: AgentConfig
):

    """
    Reads new lines from the configured log file.
    """

    if (
        not config.log_file_path
        or not os.path.exists(
            config.log_file_path
        )
    ):
        return

    with open(
        config.log_file_path,
        "r",
    ) as f:

        f.seek(
            0,
            os.SEEK_END,
        )

        while True:

            line = f.readline()

            if not line:
                break

            yield line.strip()


# -------------------------------------------------------------------
# Classify logs
# -------------------------------------------------------------------

def classify_and_forward_log_lines(
    config: AgentConfig,
) -> None:

    for line in tail_log_file(config):

        upper = line.upper()

        if "CRITICAL" in upper:

            send_log(
                config,
                "CRITICAL",
                line,
            )

        elif "ERROR" in upper:

            send_log(
                config,
                "ERROR",
                line,
            )

        elif "WARN" in upper:

            send_log(
                config,
                "WARNING",
                line,
            )


# -------------------------------------------------------------------
# Health endpoint
# -------------------------------------------------------------------

class HealthHandler(
    BaseHTTPRequestHandler
):

    def do_GET(self):

        if self.path == "/healthz":

            self.send_response(200)

            self.send_header(
                "Content-Type",
                "text/plain",
            )

            self.end_headers()

            self.wfile.write(
                b"OK"
            )

        else:

            self.send_response(404)

            self.end_headers()

    def log_message(
        self,
        format,
        *args,
    ):
        return


# -------------------------------------------------------------------
# Health server
# -------------------------------------------------------------------

def start_health_server():

    port = int(
        os.environ.get(
            "PORT",
            "10000",
        )
    )

    server = HTTPServer(
        (
            "0.0.0.0",
            port,
        ),
        HealthHandler,
    )

    logger.info(
        "Health server listening on port %s",
        port,
    )

    server.serve_forever()


# -------------------------------------------------------------------
# Main agent
# -------------------------------------------------------------------

def run() -> None:

    config = AgentConfig.from_env()

    # Start health server
    health_thread = threading.Thread(
        target=start_health_server,
        daemon=True,
    )

    health_thread.start()

    logger.info(
        "Starting AIOps agent -> %s "
        "(interval=%ss)",
        config.api_url,
        config.collection_interval_seconds,
    )

    while True:

        try:

            # Collect metrics
            metrics = collect_metrics()

            # Send metrics
            send_metrics(
                config,
                metrics,
            )

            # Process logs
            classify_and_forward_log_lines(
                config
            )

        except Exception as exc:

            logger.error(
                "Agent iteration failed: %s",
                exc,
            )

        time.sleep(
            config.collection_interval_seconds
        )


# -------------------------------------------------------------------
# Entry point
# -------------------------------------------------------------------

if __name__ == "__main__":

    run()