"""
Application configuration.

Settings are loaded from environment variables (12-factor style) with
sensible local-dev defaults. In production these are injected via
Docker/K8s secrets or a cloud secrets manager (AWS Secrets Manager /
Azure Key Vault) - never hardcoded.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    APP_NAME: str = "AIOps Infrastructure Monitoring & Incident Management Platform"
    ENVIRONMENT: str = "development"  # development | staging | production
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # --- Security / Auth ---
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_SECRETS_MANAGER"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Database ---
    DATABASE_URL: str = (
        "postgresql+psycopg2://aiops_user:aiops_password@localhost:5432/aiops_db"
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # --- CORS ---
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # --- Monitoring / Alerting thresholds (defaults, overridable per-server in DB) ---
    DEFAULT_CPU_THRESHOLD: float = 85.0
    DEFAULT_MEMORY_THRESHOLD: float = 85.0
    DEFAULT_DISK_THRESHOLD: float = 90.0
    METRIC_RETENTION_DAYS: int = 90

    # --- Background workers ---
    ALERT_EVALUATION_INTERVAL_SECONDS: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> "Settings":
    return Settings()


settings = get_settings()
