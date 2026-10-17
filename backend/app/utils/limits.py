"""
Safety limits and input validation for archive queries.
Prevents unbounded queries that could exhaust memory or hammer the IRSA servers.
"""
from app.utils.errors import InvalidInputError

# --- Safety Limits ---
MAX_RADIUS_DEG = 1.0       # Max search cone radius (1 degree is huge for SPHEREx)
MAX_PAGE_SIZE = 50         # Max results per page
DEFAULT_PAGE_SIZE = 10

def validate_coordinates(ra: float, dec: float, radius_deg: float) -> None:
    """Validate RA, Dec, and radius bounds. Raises InvalidInputError if out of bounds."""
    if not (0.0 <= ra <= 360.0):
        raise InvalidInputError(f"Right Ascension (RA) must be between 0 and 360. Got {ra}.")
    
    if not (-90.0 <= dec <= 90.0):
        raise InvalidInputError(f"Declination (Dec) must be between -90 and 90. Got {dec}.")
    
    if not (0.0 < radius_deg <= MAX_RADIUS_DEG):
        raise InvalidInputError(
            f"Search radius must be greater than 0 and at most {MAX_RADIUS_DEG} degrees. Got {radius_deg}."
        )

def validate_pagination(page: int, page_size: int) -> None:
    """Validate paging parameters."""
    if page < 1:
        raise InvalidInputError(f"Page must be 1 or greater. Got {page}.")
    
    if not (1 <= page_size <= MAX_PAGE_SIZE):
        raise InvalidInputError(
            f"Page size must be between 1 and {MAX_PAGE_SIZE}. Got {page_size}."
        )