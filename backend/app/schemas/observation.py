from typing import List, Optional
from pydantic import BaseModel, Field

# --- Existing Models (Keep these) ---
class ProvenanceInfo(BaseModel):
    archive: str = Field(default="NASA/IPAC IRSA", description="Data source")
    retrieved_at: str = Field(description="ISO-8601 timestamp of when the app fetched this")

class Observation(BaseModel):
    id: str
    title: str
    observed_at: str
    band: str
    wavelength_min_um: float
    wavelength_max_um: float
    ra: float
    dec: float
    source_url: str
    collection: str
    calib_level: int

class QueryInfo(BaseModel):
    ra: float
    dec: float
    radius: float
    collection: str

class ObservationListResponse(BaseModel):
    items: List[Observation] = Field(default_factory=list)
    page: int = 1
    page_size: int = 10
    has_more: bool = False
    query: QueryInfo
    provenance: ProvenanceInfo


# --- Stage 6: New Wavelength Models ---

class BandDetail(BaseModel):
    """Represents a single wavelength band of a specific observation."""
    band_name: str = Field(description="Human readable, e.g., '3.81-4.43 µm'")
    wavelength_um: float = Field(description="Central wavelength in micrometers (for sorting)")
    source_url: str = Field(description="Direct URL to the FITS file for this band")

class WavelengthSet(BaseModel):
    """A collection of bands for a single obs_id."""
    obs_id: str = Field(description="The unique observation ID")
    ra: float
    dec: float
    bands: List[BandDetail] = Field(description="List of available bands, sorted by wavelength")

class WavelengthResponse(BaseModel):
    """The response for GET /api/v1/observations/wavelengths"""
    sets: List[WavelengthSet] = Field(description="List of valid multi-band observations found")
    provenance: ProvenanceInfo