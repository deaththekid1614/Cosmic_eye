"""
Pydantic schemas for observation search and results.
These define the exact JSON contract that the frontend receives.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class ProvenanceInfo(BaseModel):
    """Tracks where the data came from."""
    archive: str = Field(default="NASA/IPAC IRSA", description="Data source")
    retrieved_at: str = Field(description="ISO-8601 timestamp of when the app fetched this")


class Observation(BaseModel):
    """A single normalized observation from the archive."""
    id: str = Field(description="Unique observation ID (from obs_id)")
    title: str = Field(description="Friendly label for the UI")
    observed_at: str = Field(description="ISO-8601 date of observation")
    band: str = Field(description="Human-readable wavelength range, e.g., '3.81-4.43 µm'")
    wavelength_min_um: float = Field(description="Minimum wavelength in micrometers")
    wavelength_max_um: float = Field(description="Maximum wavelength in micrometers")
    ra: float = Field(description="Right Ascension in degrees")
    dec: float = Field(description="Declination in degrees")
    source_url: str = Field(description="Direct link to the FITS file on NASA IRSA")
    collection: str = Field(description="Archive collection, e.g., 'spherex_qr2'")
    calib_level: int = Field(description="Calibration level (2 = science-ready)")
    

class QueryInfo(BaseModel):
    """Echoes the user's search parameters back to them."""
    ra: float
    dec: float
    radius: float
    collection: str


class ObservationListResponse(BaseModel):
    """The full API response for GET /api/v1/observations"""
    items: List[Observation] = Field(default_factory=list)
    page: int = 1
    page_size: int = 10
    has_more: bool = False
    query: QueryInfo
    provenance: ProvenanceInfo
