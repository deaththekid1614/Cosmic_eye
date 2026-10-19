from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from app.schemas.observation import ObservationListResponse, WavelengthResponse
from app.services.archive_service import fetch_normalized_observations, fetch_wavelength_sets
from app.services.preview_service import generate_preview, generate_rgb_preview
from app.services.featured_service import get_featured_targets
from app.services.ai_service import resolve_target, get_random_coordinate
from app.services.solar_system_model_service import get_solar_system_model
from app.utils.limits import validate_coordinates, validate_pagination
from app.config import settings
from typing import List

router = APIRouter()

@router.get("", response_model=ObservationListResponse)
def get_observations(ra: float = Query(...), dec: float = Query(...), radius: float = Query(0.01), collection: str = Query("spherex_qr2"), page: int = Query(1), page_size: int = Query(10)):
    validate_coordinates(ra, dec, radius)
    validate_pagination(page, page_size)
    try:
        return fetch_normalized_observations(ra, dec, radius, collection, page, page_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/wavelengths", response_model=WavelengthResponse)
def get_wavelengths(ra: float = Query(...), dec: float = Query(...), radius: float = Query(0.01), collection: str = Query("spherex_qr2")):
    validate_coordinates(ra, dec, radius)
    try:
        return fetch_wavelength_sets(ra, dec, radius, collection)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/featured")
def get_featured():
    return get_featured_targets()

@router.get("/ai-search")
def ai_search(q: str = Query(...)):
    target = resolve_target(q)
    if not target:
        raise HTTPException(status_code=404, detail="Database could not find object.")
    validate_coordinates(target["ra"], target["dec"], target["search_radius"])
    return target

@router.get("/solar-system-model")
def solar_system_model():
    return get_solar_system_model()

@router.get("/random")
def random_coord():
    coords = get_random_coordinate()
    return {"ra": coords[0], "dec": coords[1]}

@router.get("/preview/rgb")
def get_rgb_preview(url1: str = Query(...), url2: str = Query(...), url3: str = Query(...)):
    for url in [url1, url2, url3]:
        if not url.startswith("https://irsa.ipac.caltech.edu"):
            raise HTTPException(status_code=400, detail="Invalid NASA URL")
            
    image_bytes = generate_rgb_preview([url1, url2, url3])
    return Response(content=image_bytes, media_type="image/jpeg")

@router.get("/preview")
def get_preview(url: str = Query(...), palette: str = Query("inferno")):
    if url.startswith("cached://"):
        filename = url.replace("cached://", "")
        file_path = settings.preview_cache_dir / filename
        if not file_path.exists(): raise HTTPException(status_code=404, detail="Cached image not found.")
        with open(file_path, "rb") as f: return Response(content=f.read(), media_type="image/jpeg")
    if not url.startswith("https://irsa.ipac.caltech.edu"):
        raise HTTPException(status_code=400, detail="Invalid NASA URL")
    
    image_bytes = generate_preview(url, palette)
    return Response(content=image_bytes, media_type="image/jpeg")
