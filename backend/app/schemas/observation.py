from typing import List, Optional
from pydantic import BaseModel, Field

class ProvenanceInfo(BaseModel):
    archive: str = Field(default="NASA/IPAC IRSA")
    retrieved_at: str

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
    classification: Optional[str] = None

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

class BandDetail(BaseModel):
    band_name: str
    wavelength_um: float
    source_url: str
    classification: str

class WavelengthSet(BaseModel):
    obs_id: str
    ra: float
    dec: float
    bands: List[BandDetail]

class WavelengthResponse(BaseModel):
    sets: List[WavelengthSet]
    provenance: ProvenanceInfo
