"""
Centralized structured logging configuration.

Uses JSON-style log lines so logs can be ingested by ELK / CloudWatch /
Azure Monitor in a real deployment.
"""
import logging
import sys
from logging.config import dictConfig


class RequestContextFilter(logging.Filter):
    """Placeholder filter to attach request-scoped context (trace id, user)."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True


LOG_FORMAT = (
    '{"timestamp":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s",'
    '"request_id":"%(request_id)s","message":"%(message)s"}'
)


def configure_logging(debug: bool = True) -> None:
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "filters": {"request_context": {"()": RequestContextFilter}},
            "formatters": {"default": {"format": LOG_FORMAT}},
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "stream": sys.stdout,
                    "formatter": "default",
                    "filters": ["request_context"],
                }
            },
            "root": {"handlers": ["console"], "level": "DEBUG" if debug else "INFO"},
            "loggers": {
                "uvicorn": {"handlers": ["console"], "level": "INFO", "propagate": False},
                "sqlalchemy.engine": {
                    "handlers": ["console"],
                    "level": "WARNING",
                    "propagate": False,
                },
            },
        }
    )


logger = logging.getLogger("aiops")
