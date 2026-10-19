"""JPL element feed for the interactive, approximate solar-system scene."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from math import isfinite
import re
from threading import Lock
import time
from typing import Any

import requests
from fastapi import HTTPException

HORIZONS_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"
SBDB_QUERY_URL = "https://ssd-api.jpl.nasa.gov/sbdb_query.api"
MODEL_TTL_SECONDS = 1800
_cache_lock = Lock()
_cached_at = 0.0
_cached_model: dict[str, Any] | None = None

# Horizons IDs, parent centers, and visible scale/rotation metadata. Orbital
# elements themselves are fetched for the current epoch from JPL Horizons.
PLANETS = [
    {"id": "199", "name": "Mercury", "type": "planet", "radius_km": 2439.7, "rotation_hours": 1407.6, "axial_tilt_deg": 0.034, "color": "#b9a18d"},
    {"id": "299", "name": "Venus", "type": "planet", "radius_km": 6051.8, "rotation_hours": -5832.5, "axial_tilt_deg": 177.36, "color": "#e8b66b"},
    {"id": "399", "name": "Earth", "type": "planet", "radius_km": 6371.0, "rotation_hours": 23.934, "axial_tilt_deg": 23.44, "color": "#4c9dff"},
    {"id": "499", "name": "Mars", "type": "planet", "radius_km": 3389.5, "rotation_hours": 24.623, "axial_tilt_deg": 25.19, "color": "#e77c56"},
    {"id": "599", "name": "Jupiter", "type": "planet", "radius_km": 69911, "rotation_hours": 9.925, "axial_tilt_deg": 3.13, "color": "#ddb38a"},
    {"id": "699", "name": "Saturn", "type": "planet", "radius_km": 58232, "rotation_hours": 10.656, "axial_tilt_deg": 26.73, "color": "#e8d18f", "rings": True},
    {"id": "799", "name": "Uranus", "type": "planet", "radius_km": 25362, "rotation_hours": -17.24, "axial_tilt_deg": 97.77, "color": "#83d8df"},
    {"id": "899", "name": "Neptune", "type": "planet", "radius_km": 24622, "rotation_hours": 16.11, "axial_tilt_deg": 28.32, "color": "#5a7bff"},
]

MOONS = [
    {"id": "301", "name": "Moon", "parent_id": "399", "parent_name": "Earth", "radius_km": 1737.4, "rotation_hours": 655.72, "color": "#d7d2c8"},
    {"id": "401", "name": "Phobos", "parent_id": "499", "parent_name": "Mars", "radius_km": 11.27, "rotation_hours": 7.65, "color": "#b6a99a"},
    {"id": "402", "name": "Deimos", "parent_id": "499", "parent_name": "Mars", "radius_km": 6.2, "rotation_hours": 30.31, "color": "#d3c0a4"},
    {"id": "501", "name": "Io", "parent_id": "599", "parent_name": "Jupiter", "radius_km": 1821.6, "rotation_hours": 42.46, "color": "#f4c94b"},
    {"id": "502", "name": "Europa", "parent_id": "599", "parent_name": "Jupiter", "radius_km": 1560.8, "rotation_hours": 85.22, "color": "#dfd6bd"},
    {"id": "503", "name": "Ganymede", "parent_id": "599", "parent_name": "Jupiter", "radius_km": 2634.1, "rotation_hours": 171.72, "color": "#9d9a91"},
    {"id": "504", "name": "Callisto", "parent_id": "599", "parent_name": "Jupiter", "radius_km": 2410.3, "rotation_hours": 400.54, "color": "#8e8175"},
    {"id": "602", "name": "Enceladus", "parent_id": "699", "parent_name": "Saturn", "radius_km": 252.1, "rotation_hours": 32.88, "color": "#e9edf2"},
    {"id": "606", "name": "Titan", "parent_id": "699", "parent_name": "Saturn", "radius_km": 2574.7, "rotation_hours": 382.68, "color": "#d9a55c"},
    {"id": "701", "name": "Ariel", "parent_id": "799", "parent_name": "Uranus", "radius_km": 578.9, "rotation_hours": 60.49, "color": "#d9d8ca"},
    {"id": "702", "name": "Umbriel", "parent_id": "799", "parent_name": "Uranus", "radius_km": 584.7, "rotation_hours": 99.46, "color": "#8b8990"},
    {"id": "703", "name": "Titania", "parent_id": "799", "parent_name": "Uranus", "radius_km": 788.9, "rotation_hours": 208.94, "color": "#b9b6ae"},
    {"id": "704", "name": "Oberon", "parent_id": "799", "parent_name": "Uranus", "radius_km": 761.4, "rotation_hours": 323.12, "color": "#99958e"},
    {"id": "801", "name": "Triton", "parent_id": "899", "parent_name": "Neptune", "radius_km": 1353.4, "rotation_hours": -141.05, "color": "#c9c9dc"},
]


def _parse_number(text: str, default: float | None = None) -> float | None:
    try:
        value = float(text)
        return value if isfinite(value) else default
    except (TypeError, ValueError):
        return default


def _horizons_elements(target: dict[str, Any], epoch: datetime) -> dict[str, Any]:
    params = {
        "format": "json",
        "COMMAND": target["id"],
        "OBJ_DATA": "NO",
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "ELEMENTS",
        "CENTER": f"500@{target.get('parent_id', '10')}",
        "START_TIME": epoch.strftime("%Y-%m-%d %H:%M"),
        "STOP_TIME": (epoch + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M"),
        "STEP_SIZE": "1 d",
        "REF_PLANE": "ECLIPTIC",
        "OUT_UNITS": "AU-D",
        "ELM_LABELS": "YES",
    }
    response = None
    for attempt in range(4):
        try:
            response = requests.get(HORIZONS_URL, params=params, timeout=30)
            if response.status_code not in {429, 500, 502, 503, 504}:
                response.raise_for_status()
                break
            if attempt == 3:
                response.raise_for_status()
        except requests.RequestException:
            if attempt == 3:
                raise
        time.sleep(0.5 * (2 ** attempt))
    assert response is not None
    result = response.json().get("result", "")
    if "$$SOE" not in result:
        raise ValueError(f"JPL Horizons returned no orbital elements for {target['name']}.")

    first_record = result.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
    lines = first_record.strip().splitlines()
    epoch_jd = _parse_number(lines[0].split("=", 1)[0].strip())
    fields = {key: _parse_number(value) for key, value in re.findall(
        r"\b(EC|QR|IN|OM|W|Tp|N|MA|TA|A|AD|PR)\s*=\s*([+-]?[\d.]+(?:[Ee][+-]?\d+)?)",
        " ".join(lines[1:]),
    )}
    if epoch_jd is None or fields.get("A") is None or fields.get("MA") is None:
        raise ValueError(f"JPL Horizons returned incomplete orbital elements for {target['name']}.")

    return {
        **target,
        "type": target.get("type", "moon" if target.get("parent_id") else "planet"),
        "epoch_jd": epoch_jd,
        "a_au": fields["A"],
        "e": fields.get("EC", 0.0),
        "inclination_deg": fields.get("IN", 0.0),
        "ascending_node_deg": fields.get("OM", 0.0),
        "argument_periapsis_deg": fields.get("W", 0.0),
        "mean_anomaly_deg": fields["MA"],
        "mean_motion_deg_day": fields.get("N"),
        "period_days": fields.get("PR"),
    }


def _asteroid_belt() -> list[dict[str, Any]]:
    response = requests.get(SBDB_QUERY_URL, params={
        "fields": "spkid,full_name,epoch,e,a,i,om,w,ma,per,rot_per,diameter,H",
        "sb-class": "MBA",
        "limit": "450",
        "sort": "H",
        "full-prec": "true",
    }, timeout=25)
    response.raise_for_status()
    payload = response.json()
    fields = payload.get("fields", [])
    asteroids: list[dict[str, Any]] = []
    for raw in payload.get("data", []):
        row = dict(zip(fields, raw))
        values = {key: _parse_number(row.get(key)) for key in ("epoch", "e", "a", "i", "om", "w", "ma", "per", "rot_per", "diameter", "H")}
        if not row.get("spkid") or values["epoch"] is None or values["a"] is None or values["e"] is None or values["ma"] is None:
            continue
        asteroids.append({
            "id": f"asteroid-{row['spkid']}",
            "spkid": str(row["spkid"]),
            "name": row.get("full_name", "Asteroid").strip(),
            "type": "asteroid",
            "epoch_jd": values["epoch"],
            "a_au": values["a"],
            "e": values["e"],
            "inclination_deg": values["i"] or 0.0,
            "ascending_node_deg": values["om"] or 0.0,
            "argument_periapsis_deg": values["w"] or 0.0,
            "mean_anomaly_deg": values["ma"],
            "period_days": values["per"],
            "rotation_hours": values["rot_per"],
            "radius_km": values["diameter"] * 0.5 if values["diameter"] else None,
            "absolute_magnitude": values["H"],
        })
    return asteroids


def _build_model() -> dict[str, Any]:
    epoch = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    targets = [*PLANETS, *MOONS]
    records: list[dict[str, Any]] = []
    failures: list[str] = []
    # Horizons returns transient 503s when many object requests arrive at once.
    # Keep concurrency low and retry transient failures in _horizons_elements.
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(_horizons_elements, target, epoch): target for target in targets}
        for future in as_completed(futures):
            target = futures[future]
            try:
                records.append(future.result())
            except Exception as error:  # Continue with other bodies if JPL has a partial outage.
                failures.append(f"{target['name']}: {type(error).__name__} from JPL")

    planet_records = [body for body in records if body["type"] == "planet"]
    if len(planet_records) < 6:
        raise RuntimeError("JPL Horizons returned too few planet orbits to build the model.")

    try:
        asteroids = _asteroid_belt()
    except Exception as error:
        asteroids = []
        failures.append(f"Asteroid belt: {type(error).__name__} from JPL SBDB")

    return {
        "epoch_utc": epoch.isoformat(),
        "epoch_jd": next(body["epoch_jd"] for body in planet_records if body["name"] == "Earth"),
        "planets": planet_records,
        "moons": [body for body in records if body["type"] == "moon"],
        "asteroids": asteroids,
        "asteroid_count": len(asteroids),
        "sources": ["JPL Horizons", "JPL Small-Body Database"],
        "spacecraft": {
            "name": "SPHEREx",
            "semi_major_axis_km": 7037.41,
            "eccentricity": 0.00034,
            "inclination_deg": 97.951,
            "ascending_node_deg": 27.06,
            "period_minutes": 98.0,
            "phase_is_telemetry": False,
        },
        "notes": failures,
    }


def get_solar_system_model() -> dict[str, Any]:
    global _cached_at, _cached_model
    with _cache_lock:
        if _cached_model is not None and time.monotonic() - _cached_at < MODEL_TTL_SECONDS:
            return _cached_model
        try:
            model = _build_model()
        except Exception as error:
            if _cached_model is not None:
                return {**_cached_model, "stale": True, "notes": [*(_cached_model.get("notes", [])), str(error)]}
            raise HTTPException(status_code=502, detail=f"Could not load solar-system elements from JPL: {error}") from error
        _cached_model = model
        _cached_at = time.monotonic()
        return model
