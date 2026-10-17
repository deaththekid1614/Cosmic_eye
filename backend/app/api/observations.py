from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from app.schemas.observation import ObservationListResponse
from app.services.archive_service import fetch_normalized_observations
from app.services.preview_service import generate_preview
from app.utils.limits import validate_coordinates, validate_pagination
from app.config import settings

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
def get_preview(url: str = Query(..., description="The NASA access_url or cached:// URL")):
    """Generates a JPEG preview from a FITS URL or serves a cached difference image."""
    
    # Check if this is a cached file from our difference service
    if url.startswith("cached://"):
        filename = url.replace("cached://", "")
        file_path = settings.preview_cache_dir / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Cached image not found.")
            
        with open(file_path, "rb") as f:
            return Response(content=f.read(), media_type="image/jpeg")

    # Otherwise, process a raw NASA FITS file
    if not url.startswith("https://irsa.ipac.caltech.edu"):
        raise HTTPException(status_code=400, detail="Invalid NASA URL")
        
    try:
        image_bytes = generate_preview(url)
        return Response(content=image_bytes, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))