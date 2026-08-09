from fastapi import APIRouter

from app.api.routes import alerts, auth, dashboard, incidents, logs, metrics, servers

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(servers.router)
api_router.include_router(metrics.router)
api_router.include_router(logs.router)
api_router.include_router(incidents.router)
api_router.include_router(alerts.router)
api_router.include_router(dashboard.router)
