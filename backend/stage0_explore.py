"""
Stage 0 exploration: understand the 415-row SIA2 result.
Run from ~/IDE/cosic-eye/backend with venv active: python stage0_explore.py
"""
from collections import Counter

import numpy as np
from astropy import units as u
from astropy.coordinates import SkyCoord
from astroquery.ipac.irsa import Irsa

RA, DEC, R = 304.693508808, 42.4436872991, 1 * u.arcsec


def main():
    r = Irsa.query_sia(
        pos=(SkyCoord(RA, DEC, unit="deg"), R),
        collection="spherex_qr2",
    )
    t = r.to_table()
    print(f"Total rows: {len(t)}")

    print(f"Unique obs_collection:   {sorted(set(t['obs_collection']))}")
    print(f"Unique calib_level:      {sorted(set(t['calib_level']))}")
    print(f"Unique dataproduct_type: {sorted(set(t['dataproduct_type']))}")
    print(f"Unique obs_intent:       {sorted(set(t['obs_intent']))}")
    print(f"Unique dataproduct_subtype: {sorted(set(t['dataproduct_subtype']))}")

    print(f"\nUnique obs_id:           {len(set(t['obs_id']))}")

    em_min = np.array(t["em_min"], dtype=float)
    em_max = np.array(t["em_max"], dtype=float)
    band_centers = ((em_min + em_max) / 2 * 1e6).round(2)  # µm
    print(f"\nBand center (µm) counts (each ≈ one detector):")
    for center, n in sorted(Counter(band_centers).items()):
        print(f"   {center:6.2f} µm   rows={n}")

    tmin = np.array(t["t_min"], dtype=float)
    print(f"\nt_min range:             {tmin.min():.3f}  →  {tmin.max():.3f} MJD")
    print(f"days covered:            {(tmin.max() - tmin.min()):.2f}")

    print(f"\nTop 10 obs_id frequencies:")
    for oid, n in Counter(t["obs_id"]).most_common(10):
        print(f"   {oid:40s}  x{n}")

    # Distinct obs_id prefixes (typically <week>_<exposure> — grouping exposes structure)
    prefixes = Counter("_".join(str(o).split("_")[:2]) for o in t["obs_id"])
    print(f"\nDistinct 2-part obs_id prefixes: {len(prefixes)}")
    for p, n in prefixes.most_common(5):
        print(f"   {p:20s}  rows={n}")

    # Does any obs_id appear once per band (i.e. do rows share obs_id across bands)?
    print(f"\nRows sharing an obs_id across different band centers:")
    grouped = {}
    for i, oid in enumerate(t["obs_id"]):
        grouped.setdefault(oid, set()).add(band_centers[i])
    multi = sum(1 for oid, bands in grouped.items() if len(bands) > 1)
    single = sum(1 for oid, bands in grouped.items() if len(bands) == 1)
    print(f"   obs_ids with >1 band: {multi}")
    print(f"   obs_ids with =1 band: {single}")


if __name__ == "__main__":
    main()
