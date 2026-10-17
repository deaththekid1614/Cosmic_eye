from fastapi import APIRouter
from app.api import health, observations, analysis

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(observations.router, prefix="/observations", tags=["observations"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])

__all__ = ["api_router"]
