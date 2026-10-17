from typing import List
from pydantic import BaseModel
from app.schemas.observation import Observation

class CompareRequest(BaseModel):
    observation_a: Observation
    observation_b: Observation

class CompareResponse(BaseModel):
    is_comparable: bool
    warnings: List[str]
    method: str = "metadata_validation"
