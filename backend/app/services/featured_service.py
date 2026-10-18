import json
from pathlib import Path
from typing import List, Dict

_MESSIER_PATH = Path(__file__).resolve().parents[1] / "catalogs" / "messier_targets.json"
with _MESSIER_PATH.open(encoding="utf-8") as _catalog_file:
    _MESSIER_TARGETS = json.load(_catalog_file)

def get_featured_targets() -> List[Dict]:
    """
    Return famous targets plus Messier catalog objects with confirmed archive coverage.
    Coordinates come from SIMBAD; the additional catalog positions were checked against
    SPHEREx QR2 level-2 image footprints and are kept as a compact static index.
    """
    curated = [
        {
            "id": "orion",
            "name": "Orion Nebula (M42)",
            "type": "Star-forming region",
            "ra": 83.82,
            "dec": -5.39,
            "description": "The closest massive star-forming region to Earth.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "andromeda",
            "name": "Andromeda Galaxy (M31)",
            "type": "Galaxy",
            "ra": 10.68,
            "dec": 41.27,
            "description": "The nearest major galaxy to the Milky Way.",
            "image_url": "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "ring",
            "name": "Ring Nebula (M57)",
            "type": "Planetary nebula",
            "ra": 283.39,
            "dec": 33.02,
            "description": "A glowing shell of ionized gas ejected from a dying star.",
            "image_url": "https://science.nasa.gov/wp-content/uploads/2023/04/ring-nebula-full_jpg-jpg.webp"
        },
        {
            "id": "carina",
            "name": "Carina Nebula",
            "type": "Nebula",
            "ra": 161.26,
            "dec": -59.87,
            "description": "A massive, bright nebula containing some of the hottest stars.",
            "image_url": "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "horsehead",
            "name": "Horsehead Nebula",
            "type": "Dark nebula",
            "ra": 85.25,
            "dec": -2.46,
            "description": "A cold, dark cloud of gas and dust silhouetted against a glowing background.",
            "image_url": "https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "milky-way",
            "name": "Milky Way · Galactic Center",
            "type": "Star-forming region",
            "ra": 266.4168,
            "dec": -29.0078,
            "description": "A dense, infrared-bright view toward the center of our galaxy.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "pleiades",
            "name": "Pleiades (M45)",
            "type": "Open star cluster",
            "ra": 56.75,
            "dec": 24.1167,
            "description": "A nearby cluster of young stars surrounded by reflection dust.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "crab",
            "name": "Crab Nebula (M1)",
            "type": "Supernova remnant",
            "ra": 83.63,
            "dec": 22.0145,
            "description": "The expanding debris cloud left by a supernova recorded in 1054.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "helix",
            "name": "Helix Nebula (NGC 7293)",
            "type": "Planetary nebula",
            "ra": 337.409,
            "dec": -20.837,
            "description": "A nearby shell of gas released by a Sun-like star near the end of its life.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "lagoon",
            "name": "Lagoon Nebula (M8)",
            "type": "Star-forming nebula",
            "ra": 270.9,
            "dec": -24.38,
            "description": "A large cloud of gas and dust where new stars are forming.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "eagle",
            "name": "Eagle Nebula (M16)",
            "type": "Star-forming nebula",
            "ra": 274.7,
            "dec": -13.8,
            "description": "A star-forming cloud that includes the Pillars of Creation.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "whirlpool",
            "name": "Whirlpool Galaxy (M51)",
            "type": "Spiral galaxy",
            "ra": 202.47,
            "dec": 47.195,
            "description": "A face-on spiral galaxy interacting with a smaller companion galaxy.",
            "image_url": "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "rosette",
            "name": "Rosette Nebula (NGC 2237)",
            "type": "Star-forming nebula",
            "ra": 97.97,
            "dec": 4.98,
            "description": "A broad ring of gas and dust shaped by a cluster of young stars.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "north-america",
            "name": "North America Nebula (NGC 7000)",
            "type": "Emission nebula",
            "ra": 314.7,
            "dec": 44.5,
            "description": "A large hydrogen-rich cloud in the constellation Cygnus.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        },
        {
            "id": "cygnus-x",
            "name": "Cygnus X",
            "type": "Star-forming complex",
            "ra": 308.0,
            "dec": 41.0,
            "description": "A massive complex of star-forming clouds in the Milky Way.",
            "image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
        }
    ]
    return curated + _MESSIER_TARGETS
