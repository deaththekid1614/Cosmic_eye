from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import settings
from app.utils.errors import CosmicEyeError
from app.utils.handlers import cosmic_eye_exception_handler

app = FastAPI(
    title="Cosmic Eye API",
    version=settings.service_version,
    description="Public exploration API for NASA SPHEREx observations.",
)

# Register the exception handler
app.add_exception_handler(CosmicEyeError, cosmic_eye_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/", include_in_schema=False)
def root() -> dict:
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "docs": "/docs",
        "health": "/api/v1/health",
    }
