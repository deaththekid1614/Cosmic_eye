"""
FastAPI exception handlers.
Converts our custom CosmicEyeErrors into clean HTTP JSON responses.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.utils.errors import (
    CosmicEyeError,
    InvalidInputError,
    ArchiveTimeoutError,
    ArchiveUnavailableError,
    ArchiveResponseError,
)


async def cosmic_eye_exception_handler(request: Request, exc: CosmicEyeError):
    """Maps custom errors to appropriate HTTP status codes and JSON responses."""
    
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR  # default
    
    if isinstance(exc, InvalidInputError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(exc, ArchiveTimeoutError):
        status_code = status.HTTP_504_GATEWAY_TIMEOUT
    elif isinstance(exc, ArchiveUnavailableError):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    elif isinstance(exc, ArchiveResponseError):
        status_code = status.HTTP_502_BAD_GATEWAY

    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
            }
        },
    )
