from datetime import datetime, timezone
from collections import defaultdict
from astropy.time import Time
from astropy.table import Table

from app.adapters.irsa_spherex import search_observations
from app.schemas.observation import (
    Observation,
    ObservationListResponse,
    QueryInfo,
    ProvenanceInfo,
    WavelengthSet,
    BandDetail,
    WavelengthResponse,
)

def fetch_normalized_observations(
    ra: float,
    dec: float,
    radius_deg: float,
    collection: str,
    page: int,
    page_size: int,
) -> ObservationListResponse:
    # ... (keep the existing function exactly as it is) ...
    raw_table = search_observations(ra, dec, radius_deg, collection)
    valid_rows = []
    for row in raw_table:
        if row["calib_level"] < 2 or row["dataproduct_type"] != "image":
            continue
        em_min_um = row["em_min"] * 1e6
        em_max_um = row["em_max"] * 1e6
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
    total_valid = len(valid_rows)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = valid_rows[start_idx:end_idx]
    return ObservationListResponse(
        items=paginated_items,
        page=page,
        page_size=page_size,
        has_more=end_idx < total_valid,
        query=QueryInfo(ra=ra, dec=dec, radius=radius_deg, collection=collection),
        provenance=ProvenanceInfo(retrieved_at=datetime.now(timezone.utc).isoformat())
    )


# --- STAGE 6: WAVELENGTH GROUPING ---

def fetch_wavelength_sets(
    ra: float,
    dec: float,
    radius_deg: float,
    collection: str,
) -> WavelengthResponse:
    """
    Fetches observations, groups them by obs_id, and returns only those
    with multiple bands so the frontend can build a slider.
    """
    raw_table = search_observations(ra, dec, radius_deg, collection)
    
    # Group the raw rows by obs_id
    grouped_data = defaultdict(list)
    for row in raw_table:
        if row["calib_level"] < 2 or row["dataproduct_type"] != "image":
            continue
            
        obs_id = str(row["obs_id"])
        em_min_um = row["em_min"] * 1e6
        em_max_um = row["em_max"] * 1e6
        center_um = (em_min_um + em_max_um) / 2
        
        grouped_data[obs_id].append({
            "band_name": f"{em_min_um:.2f}–{em_max_um:.2f} µm",
            "wavelength_um": round(center_um, 3),
            "source_url": str(row["access_url"]),
            "ra": float(row["s_ra"]),
            "dec": float(row["s_dec"])
        })

    valid_sets = []
    for obs_id, bands in grouped_data.items():
        # We only care about observations that have more than 1 wavelength
        if len(bands) > 1:
            # Sort the bands by wavelength (shortest to longest)
            sorted_bands = sorted(bands, key=lambda b: b["wavelength_um"])
            
            # Create the Pydantic objects
            band_details = [
                BandDetail(
                    band_name=b["band_name"],
                    wavelength_um=b["wavelength_um"],
                    source_url=b["source_url"]
                ) for b in sorted_bands
            ]
            
            valid_sets.append(
                WavelengthSet(
                    obs_id=obs_id,
                    ra=sorted_bands[0]["ra"],
                    dec=sorted_bands[0]["dec"],
                    bands=band_details
                )
            )

    # Sort the sets by how many bands they have (most bands first)
    valid_sets.sort(key=lambda s: len(s.bands), reverse=True)

    return WavelengthResponse(
        sets=valid_sets,
        provenance=ProvenanceInfo(retrieved_at=datetime.now(timezone.utc).isoformat())
    )