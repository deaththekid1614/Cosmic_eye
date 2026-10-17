from astropy.coordinates import SkyCoord
import astropy.units as u

from app.schemas.observation import Observation
from app.schemas.analysis import CompareResponse

def check_compatibility(obs_a: Observation, obs_b: Observation) -> CompareResponse:
    warnings = []
    
    # 1. Check if they are the exact same observation ID (different bands)
    if obs_a.id == obs_b.id:
        warnings.append("You are comparing different wavelength bands of the exact same scan.")
    
    # 2. Check the spatial distance
    coord_a = SkyCoord(ra=obs_a.ra, dec=obs_a.dec, unit="deg")
    coord_b = SkyCoord(ra=obs_b.ra, dec=obs_b.dec, unit="deg")
    separation = coord_a.separation(coord_b)
    
    if separation > 5 * u.arcmin:
        warnings.append(f"These observations are {separation.arcmin:.1f} arcminutes apart. They might not overlap.")
    
    # 3. Check wavelength compatibility
    wave_diff = abs(obs_a.wavelength_min_um - obs_b.wavelength_min_um)
    if wave_diff > 1.0:
        warnings.append(f"Different wavelengths: {obs_a.band} vs {obs_b.band}.")

    # For MVP, if they have warnings, we still allow comparison but flag it.
    is_comparable = True
    
    return CompareResponse(
        is_comparable=is_comparable,
        warnings=warnings
    )
