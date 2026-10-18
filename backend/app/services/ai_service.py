import math
import random
import re
from astroquery.simbad import Simbad
from astropy.coordinates import SkyCoord
import astropy.units as u

Simbad.add_votable_fields("otype")

def _normalize_name(query: str) -> str:
    return re.sub(r"[^a-z0-9]", "", query.lower())


# A wider field around the Galactic Center gives the Milky Way search useful
# context; it is still a small sample, not an image of the whole galaxy.
KNOWN_TARGETS = {
    "orionnebula": (83.82, -5.39, "Orion Nebula (M42)", 0.01, None),
    "m42": (83.82, -5.39, "Orion Nebula (M42)", 0.01, None),
    "andromeda": (10.68, 41.27, "Andromeda Galaxy (M31)", 0.01, None),
    "m31": (10.68, 41.27, "Andromeda Galaxy (M31)", 0.01, None),
    "ringnebula": (283.39, 33.02, "Ring Nebula (M57)", 0.01, None),
    "m57": (283.39, 33.02, "Ring Nebula (M57)", 0.01, None),
    "carinanebula": (161.26, -59.87, "Carina Nebula", 0.01, None),
    "horseheadnebula": (85.25, -2.46, "Horsehead Nebula", 0.01, None),
    "helixnebula": (337.42, -20.83, "Helix Nebula", 0.01, None),
    "crabnebula": (83.63, 22.01, "Crab Nebula", 0.01, None),
    "milkyway": (266.416833, -29.007806, "Milky Way · Galactic Center sample", 0.5,
                 "This is a 0.5° sample around the Galactic Center, not a view of the whole Milky Way. SPHEREx maps the full sky in infrared."),
    "themilkyway": (266.416833, -29.007806, "Milky Way · Galactic Center sample", 0.5,
                    "This is a 0.5° sample around the Galactic Center, not a view of the whole Milky Way. SPHEREx maps the full sky in infrared."),
    "milkywaygalaxy": (266.416833, -29.007806, "Milky Way · Galactic Center sample", 0.5,
                       "This is a 0.5° sample around the Galactic Center, not a view of the whole Milky Way. SPHEREx maps the full sky in infrared."),
    "ourgalaxy": (266.416833, -29.007806, "Milky Way · Galactic Center sample", 0.5,
                  "This is a 0.5° sample around the Galactic Center, not a view of the whole Milky Way. SPHEREx maps the full sky in infrared."),
    "galacticcenter": (266.416833, -29.007806, "Galactic Center (Sgr A*)", 0.1, None),
    "sgrastar": (266.416833, -29.007806, "Galactic Center (Sgr A*)", 0.1, None),
    # Gaia BH3 / its visible companion position (J2017.5).
    "gaiabh3": (294.8278502411, 14.9309190720, "Gaia BH3", 0.03,
                "SPHEREx can show the infrared field around Gaia BH3; the dormant black hole itself is not a resolved light source."),
    "gaiablackhole3": (294.8278502411, 14.9309190720, "Gaia BH3", 0.03,
                       "SPHEREx can show the infrared field around Gaia BH3; the dormant black hole itself is not a resolved light source."),
    "2massj193918721455542": (294.8278502411, 14.9309190720, "Gaia BH3", 0.03,
                              "SPHEREx can show the infrared field around Gaia BH3; the dormant black hole itself is not a resolved light source."),
}


def resolve_target(query: str) -> dict | None:
    normalized = _normalize_name(query.strip())
    known = KNOWN_TARGETS.get(normalized)
    if known:
        ra, dec, name, radius, note = known
        object_type = "Galaxy" if "galaxy" in name.lower() else "Nebula" if "nebula" in name.lower() else "Known object"
        return {"ra": ra, "dec": dec, "matched_query": name,
                "search_radius": radius, "target_note": note, "object_type": object_type}

    # Try the global SIMBAD database for names outside the curated list.
    try:
        result_table = Simbad.query_object(query)
        if result_table is not None and len(result_table) > 0:
            ra_str = result_table['RA'][0]
            dec_str = result_table['DEC'][0]
            coord = SkyCoord(ra_str, dec_str, unit=(u.hourangle, u.deg))
            return {"ra": float(coord.ra.deg), "dec": float(coord.dec.deg),
                    "matched_query": query.strip(), "search_radius": 0.01,
                    "target_note": None,
                    "object_type": str(result_table["OTYPE"][0]) if "OTYPE" in result_table.colnames else "Astronomical object"}
    except Exception as e:
        print(f"AI Lookup Error: {e}")
    return None


def parse_natural_language(query: str) -> tuple[float, float] | None:
    """Backward-compatible coordinate resolver."""
    target = resolve_target(query)
    return (target["ra"], target["dec"]) if target else None

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
