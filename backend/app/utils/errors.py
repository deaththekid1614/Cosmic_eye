"""
Custom exception classes for Cosmic Eye.
These map cleanly to HTTP status codes later in the API layer.
"""


class CosmicEyeError(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class InvalidInputError(CosmicEyeError):
    """User provided bad input (e.g., RA > 360)."""

    def __init__(self, message: str):
        super().__init__(message, error_code="invalid_input")


class ArchiveTimeoutError(CosmicEyeError):
    """NASA IRSA took too long to respond."""

    def __init__(self, message: str = "The NASA archive did not respond in time."):
        super().__init__(message, error_code="archive_timeout")


class ArchiveResponseError(CosmicEyeError):
    """NASA IRSA returned data we couldn't understand."""

    def __init__(self, message: str = "The archive returned an unexpected format."):
        super().__init__(message, error_code="archive_bad_response")


class ArchiveUnavailableError(CosmicEyeError):
    """NASA IRSA is down or refusing connections."""

    def __init__(self, message: str = "The NASA archive is currently unavailable."):
        super().__init__(message, error_code="archive_unavailable")
