from typing import List, Dict

def get_featured_targets() -> List[Dict]:
    """
    Returns a curated list of famous objects.
    We use static high-res images here so the Home Page loads instantly.
    When clicked, it passes the real RA/Dec to the Explore page to fetch real NASA data.
    """
    return [
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
            "image_url": "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=800&auto=format&fit=crop"
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
        }
    ]
