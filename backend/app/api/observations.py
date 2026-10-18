from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from app.schemas.observation import ObservationListResponse, WavelengthResponse
from app.services.archive_service import fetch_normalized_observations, fetch_wavelength_sets
from app.services.preview_service import generate_preview
from app.services.featured_service import get_featured_targets
from app.services.ai_service import parse_natural_language, get_random_coordinate
from app.utils.limits import validate_coordinates, validate_pagination
from app.config import settings

router = APIRouter()

@router.get("", response_model=ObservationListResponse)
def get_observations(ra: float = Query(...), dec: float = Query(...), radius: float = Query(0.01), collection: str = Query("spherex_qr2"), page: int = Query(1), page_size: int = Query(10)):
    validate_coordinates(ra, dec, radius)
    validate_pagination(page, page_size)
    try:
        return fetch_normalized_observations(ra, dec, radius, collection, page, page_size)
    except Exception as e:
        print(f"BACKEND ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"NASA Archive Error: {str(e)}")

@router.get("/wavelengths", response_model=WavelengthResponse)
def get_wavelengths(ra: float = Query(...), dec: float = Query(...), radius: float = Query(0.01), collection: str = Query("spherex_qr2")):
    validate_coordinates(ra, dec, radius)
    try:
        return fetch_wavelength_sets(ra, dec, radius, collection)
    except Exception as e:
        print(f"BACKEND ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"NASA Archive Error: {str(e)}")

@router.get("/featured")
def get_featured():
    return get_featured_targets()

@router.get("/ai-search")
def ai_search(q: str = Query(...)):
    coords = parse_natural_language(q)
    if not coords:
        raise HTTPException(status_code=404, detail="Database could not find object.")
    return {"ra": coords[0], "dec": coords[1], "matched_query": q}

@router.get("/random")
def random_coord():
    coords = get_random_coordinate()
    return {"ra": coords[0], "dec": coords[1]}

@router.get("/preview")
def get_preview(url: str = Query(...)):
    if url.startswith("cached://"):
        filename = url.replace("cached://", "")
        file_path = settings.preview_cache_dir / filename
        if not file_path.exists(): raise HTTPException(status_code=404, detail="Cached image not found.")
        with open(file_path, "rb") as f: return Response(content=f.read(), media_type="image/jpeg")
    if not url.startswith("https://irsa.ipac.caltech.edu"):
        raise HTTPException(status_code=400, detail="Invalid NASA URL")
    
    image_bytes = generate_preview(url)
    return Response(content=image_bytes, media_type="image/jpeg")
