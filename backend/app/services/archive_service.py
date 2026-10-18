from datetime import datetime, timezone
from collections import defaultdict
from astropy.time import Time
from app.adapters.irsa_spherex import search_observations
from app.services.ml_service import describe_wavelength
from app.schemas.observation import (
    Observation, ObservationListResponse, QueryInfo, ProvenanceInfo,
    WavelengthSet, BandDetail, WavelengthResponse
)

def fetch_normalized_observations(ra: float, dec: float, radius_deg: float, collection: str, page: int, page_size: int) -> ObservationListResponse:
    # (Keep exactly as it is)
    raw_table = search_observations(ra, dec, radius_deg, collection)
    valid_rows = []
    for row in raw_table:
        if row["calib_level"] < 2 or row["dataproduct_type"] != "image": continue
        em_min_um = row["em_min"] * 1e6
        em_max_um = row["em_max"] * 1e6
        center_um = (em_min_um + em_max_um) / 2
        try:
            t = Time(row["t_min"], format="mjd")
            date_str = t.iso
        except Exception:
            date_str = "Unknown date"
        ml_class = describe_wavelength(center_um)
        valid_rows.append(Observation(
            id=str(row["obs_id"]), title=f"SPHEREx observation · Band {em_min_um:.1f}-{em_max_um:.1f} µm",
            observed_at=date_str, band=f"{em_min_um:.2f}–{em_max_um:.2f} µm",
            wavelength_min_um=round(em_min_um, 2), wavelength_max_um=round(em_max_um, 2),
            ra=float(row["s_ra"]), dec=float(row["s_dec"]), source_url=str(row["access_url"]),
            collection=str(row["obs_collection"]), calib_level=int(row["calib_level"]), classification=ml_class
        ))
    total_valid = len(valid_rows)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    return ObservationListResponse(
        items=valid_rows[start_idx:end_idx], page=page, page_size=page_size, has_more=end_idx < total_valid,
        query=QueryInfo(ra=ra, dec=dec, radius=radius_deg, collection=collection),
        provenance=ProvenanceInfo(retrieved_at=datetime.now(timezone.utc).isoformat())
    )

def fetch_wavelength_sets(ra: float, dec: float, radius_deg: float, collection: str) -> WavelengthResponse:
    raw_table = search_observations(ra, dec, radius_deg, collection)
    
    grouped_data = defaultdict(list)
    all_unique_bands = {} # Use dict to avoid duplicate wavelengths
    
    for row in raw_table:
        if row["calib_level"] < 2 or row["dataproduct_type"] != "image": continue
        
        obs_id = str(row["obs_id"])
        em_min_um = row["em_min"] * 1e6
        em_max_um = row["em_max"] * 1e6
        center_um = (em_min_um + em_max_um) / 2
        rounded_center = round(center_um, 2)
        
        ml_class = describe_wavelength(center_um)
        
        band_obj = BandDetail(
            band_name=f"{em_min_um:.2f}–{em_max_um:.2f} µm",
            wavelength_um=rounded_center,
            source_url=str(row["access_url"]),
            classification=ml_class
        )
        
        grouped_data[obs_id].append(band_obj)
        
        # Add to the global list if we haven't seen this exact wavelength yet
        if rounded_center not in all_unique_bands:
            all_unique_bands[rounded_center] = band_obj

    valid_sets = []
    for obs_id, bands in grouped_data.items():
        if len(bands) > 1:
            sorted_bands = sorted(bands, key=lambda b: b.wavelength_um)
            valid_sets.append(WavelengthSet(obs_id=obs_id, ra=ra, dec=dec, bands=sorted_bands))

    valid_sets.sort(key=lambda s: len(s.bands), reverse=True)
    
    # Sort the global band list from shortest to longest wavelength
    sorted_all_bands = sorted(all_unique_bands.values(), key=lambda b: b.wavelength_um)
    
    return WavelengthResponse(
        all_bands=sorted_all_bands, 
        sets=valid_sets, 
        provenance=ProvenanceInfo(retrieved_at=datetime.now(timezone.utc).isoformat())
    )
