import math
import random
from astroquery.simbad import Simbad
from astropy.coordinates import SkyCoord
import astropy.units as u

def parse_natural_language(query: str) -> tuple[float, float] | None:
    # 1. Try the global Simbad database (standard for astronomy)
    try:
        result_table = Simbad.query_object(query)
        if result_table is not None and len(result_table) > 0:
            ra_str = result_table['RA'][0]
            dec_str = result_table['DEC'][0]
            coord = SkyCoord(ra_str, dec_str, unit=(u.hourangle, u.deg))
            return (float(coord.ra.deg), float(coord.dec.deg))
    except Exception as e:
        print(f"AI Lookup Error: {e}")
    
    # 2. Fallback to popular objects if the database is down or fails
    KNOWN_OBJECTS = {
        "orion nebula": (83.82, -5.39), "m42": (83.82, -5.39),
        "andromeda": (10.68, 41.27), "m31": (10.68, 41.27),
        "ring nebula": (283.39, 33.02), "m57": (283.39, 33.02),
        "carina nebula": (161.26, -59.87),
        "horsehead nebula": (85.25, -2.46),
        "helix nebula": (337.42, -20.83),
        "crab nebula": (83.63, 22.01)
    }
    q = query.lower().strip()
    if q in KNOWN_OBJECTS:
        return KNOWN_OBJECTS[q]
        
    return None

def get_random_coordinate() -> tuple[float, float]:
    ra = random.uniform(0.0, 360.0)
    dec = math.degrees(math.asin(random.uniform(-1.0, 1.0)))
    return (round(ra, 3), round(dec, 3))

def classify_observation(wavelength_um: float, band_name: str) -> str:
    if wavelength_um < 1.5:
        return "Stellar Activity (Mostly Stars)"
    elif 1.5 <= wavelength_um < 3.0:
        return "Transition Zone (Stars & Gas)"
    elif 3.0 <= wavelength_um < 4.5:
        return "Warm Dust & Gas"
    else:
        return "Deep Infrared Background"
