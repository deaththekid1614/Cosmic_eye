from fastapi import APIRouter
from app.schemas.analysis import CompareRequest, CompareResponse
from app.services.comparison_service import check_compatibility

router = APIRouter()

@router.post("/compare", response_model=CompareResponse)
def compare_observations(request: CompareRequest):
    """
    Validates whether two observations are safe to compare.
    """
    return check_compatibility(request.observation_a, request.observation_b)
