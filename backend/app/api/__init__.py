from fastapi import APIRouter
from app.api import health, observations

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(observations.router, prefix="/observations", tags=["observations"])

__all__ = ["api_router"]
