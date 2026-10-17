from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    """Liveness check — returns service identity and version."""
    return {
        "status": "ok",
        "service": settings.service_name,
        "version": settings.service_version,
    }