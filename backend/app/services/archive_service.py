"""
Orchestrates the archive adapter and converts raw Astropy tables
into clean, browser-ready JSON schemas.
"""
from datetime import datetime, timezone
from astropy.time import Time
from astropy.table import Table

from app.adapters.irsa_spherex import search_observations
from app.schemas.observation import (
    Observation,
    ObservationListResponse,
    QueryInfo,
    ProvenanceInfo,
)

def fetch_normalized_observations(
    ra: float,
    dec: float,
    radius_deg: float,
    collection: str,
    page: int,
    page_size: int,
) -> ObservationListResponse:
    
    # 1. Get the raw table from NASA
    raw_table = search_observations(ra, dec, radius_deg, collection)
    
    # 2. Filter out anything that isn't science-ready
    valid_rows = []
    for row in raw_table:
        if row["calib_level"] < 2 or row["dataproduct_type"] != "image":
            continue
            
        # Convert meters to micrometers
        em_min_um = row["em_min"] * 1e6
        em_max_um = row["em_max"] * 1e6
        
        # Convert MJD to human-readable ISO-8601 date
        try:
            t = Time(row["t_min"], format="mjd")
            date_str = t.iso
        except Exception:
            date_str = "Unknown date"

        valid_rows.append(
            Observation(
                id=str(row["obs_id"]),
                title=f"SPHEREx observation · Band {em_min_um:.1f}-{em_max_um:.1f} µm",
                observed_at=date_str,
                band=f"{em_min_um:.2f}–{em_max_um:.2f} µm",
                wavelength_min_um=round(em_min_um, 2),
                wavelength_max_um=round(em_max_um, 2),
                ra=float(row["s_ra"]),
                dec=float(row["s_dec"]),
                source_url=str(row["access_url"]),
                collection=str(row["obs_collection"]),
                calib_level=int(row["calib_level"]),
            )
        )

    # 3. Apply pagination *after* filtering
    total_valid = len(valid_rows)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = valid_rows[start_idx:end_idx]
    
    # 4. Build the final response
    return ObservationListResponse(
        items=paginated_items,
        page=page,
        page_size=page_size,
        has_more=end_idx < total_valid,
        query=QueryInfo(ra=ra, dec=dec, radius=radius_deg, collection=collection),
        provenance=ProvenanceInfo(
            retrieved_at=datetime.now(timezone.utc).isoformat()
        )
    )
