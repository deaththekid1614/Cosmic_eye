from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from app.schemas.observation import ObservationListResponse
from app.services.archive_service import fetch_normalized_observations
from app.services.preview_service import generate_preview
from app.utils.limits import validate_coordinates, validate_pagination

router = APIRouter()

@router.get("", response_model=ObservationListResponse)
def get_observations(
    ra: float = Query(..., description="Right Ascension in degrees (0-360)"),
    dec: float = Query(..., description="Declination in degrees (-90 to 90)"),
    radius: float = Query(0.01, description="Search radius in degrees (max 1.0)"),
    collection: str = Query("spherex_qr2", description="Archive collection to search"),
    page: int = Query(1, description="Page number"),
    page_size: int = Query(10, description="Results per page (max 50)"),
):
    validate_coordinates(ra, dec, radius)
    validate_pagination(page, page_size)
    
    return fetch_normalized_observations(
        ra=ra, dec=dec, radius_deg=radius, collection=collection,
        page=page, page_size=page_size,
    )

@router.get("/preview")
def get_preview(url: str = Query(..., description="The NASA access_url")):
    """Generates a JPEG preview from a FITS URL."""
    if not url.startswith("https://irsa.ipac.caltech.edu"):
        raise HTTPException(status_code=400, detail="Invalid NASA URL")
        
    try:
        # Note: In production, we would cache this. For now, we generate it live.
        image_bytes = generate_preview(url)
        return Response(content=image_bytes, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))