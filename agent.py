#!/usr/bin/env python3
"""
AIOps Monitoring Agent
-----------------------
A lightweight daemon installed on each monitored host. It collects real
system metrics (CPU, memory, disk, network, load average, process count)
using `psutil` and ships them to the platform's ingest API on a fixed
interval. It also tails a log file and forwards ERROR/CRITICAL lines.

Usage:
    export AIOPS_API_URL="http://localhost:8000/api/v1"
    export AIOPS_API_KEY="<server api key from registration>"
    python agent.py

Designed to run as a systemd service or inside a lightweight container
sidecar on the monitored host.
"""
import logging
import os
import time
from dataclasses import dataclass

import psutil
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [agent] %(levelname)s %(message)s",
)
logger = logging.getLogger("aiops-agent")


@dataclass
class AgentConfig:
    api_url: str
    api_key: str
    collection_interval_seconds: int = 15
    log_file_path: str | None = None
    source_application: str = "monitoring-agent"

    @classmethod
    def from_env(cls) -> "AgentConfig":
        api_url = os.environ.get("AIOPS_API_URL", "http://localhost:8000/api/v1")
        api_key = os.environ.get("AIOPS_API_KEY")
        if not api_key:
            raise RuntimeError("AIOPS_API_KEY environment variable is required")
        return cls(
            api_url=api_url.rstrip("/"),
            api_key=api_key,
            collection_interval_seconds=int(os.environ.get("AIOPS_COLLECTION_INTERVAL", "15")),
            log_file_path=os.environ.get("AIOPS_LOG_FILE_PATH"),
            source_application=os.environ.get("AIOPS_SOURCE_APP", "monitoring-agent"),
        )


def collect_metrics() -> dict:
    """Gathers a single snapshot of host resource utilization."""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()

    try:
        load_avg = os.getloadavg()[0]
    except (AttributeError, OSError):
        load_avg = 0.0  # not available on Windows

    return {
        "cpu_percent": round(cpu_percent, 2),
        "memory_percent": round(memory.percent, 2),
        "disk_percent": round(disk.percent, 2),
        "network_in_kbps": round(net.bytes_recv / 1024, 2),
        "network_out_kbps": round(net.bytes_sent / 1024, 2),
        "load_average_1m": round(load_avg, 2),
        "process_count": len(psutil.pids()),
    }


def send_metrics(config: AgentConfig, metrics: dict) -> None:
    try:
        response = requests.post(
            f"{config.api_url}/metrics/ingest",
            json=metrics,
            headers={"X-API-Key": config.api_key},
            timeout=10,
        )
        response.raise_for_status()
        logger.info(
            f"Metrics sent | CPU={metrics['cpu_percent']}% "
            f"MEM={metrics['memory_percent']}% DISK={metrics['disk_percent']}%"
        )
    except requests.RequestException as exc:
        logger.error(f"Failed to send metrics: {exc}")


def send_log(config: AgentConfig, level: str, message: str) -> None:
    try:
        response = requests.post(
            f"{config.api_url}/logs/ingest",
            json={
                "source_application": config.source_application,
                "level": level,
                "message": message,
            },
            headers={"X-API-Key": config.api_key},
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.error(f"Failed to send log entry: {exc}")


def tail_log_file(config: AgentConfig):
    """Generator that yields new lines appended to the configured log file."""
    if not config.log_file_path or not os.path.exists(config.log_file_path):
        return
    with open(config.log_file_path, "r") as f:
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if not line:
                break
            yield line.strip()


def classify_and_forward_log_lines(config: AgentConfig) -> None:
    for line in tail_log_file(config):
        upper = line.upper()
        if "CRITICAL" in upper:
            send_log(config, "CRITICAL", line)
        elif "ERROR" in upper:
            send_log(config, "ERROR", line)
        elif "WARN" in upper:
            send_log(config, "WARNING", line)


def run() -> None:
    config = AgentConfig.from_env()
    logger.info(f"Starting AIOps agent -> {config.api_url} (interval={config.collection_interval_seconds}s)")

    while True:
        try:
            metrics = collect_metrics()
            send_metrics(config, metrics)
            classify_and_forward_log_lines(config)
        except Exception as exc:  # noqa: BLE001 - agent loop must be resilient
            logger.error(f"Agent iteration failed: {exc}")

        time.sleep(config.collection_interval_seconds)


if __name__ == "__main__":
    run()
