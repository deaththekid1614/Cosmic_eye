"""
Stage 0: Data feasibility script.
Queries IRSA SIA2 for SPHEREx data, downloads one MEF, inspects it with Astropy.
Run from: ~/IDE/cosic-eye/backend
Command: python stage0_inspect.py
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from astropy import units as u
from astropy.coordinates import SkyCoord
from astropy.io import fits
from astropy.utils.data import download_file
from astropy.wcs import WCS
from astroquery.ipac.irsa import Irsa

# --- Configuration ---
OUTPUT_DIR = Path("stage0_output")
OUTPUT_DIR.mkdir(exist_ok=True)

RA_DEG = 304.693508808
DEC_DEG = 42.4436872991
SEARCH_RADIUS = 1 * u.arcsec
COLLECTION = "spherex_qr2"


def safe_get(row, key, default="(not available)"):
    """Return row[key] if the column exists, else a readable placeholder."""
    try:
        val = row[key]
        return val if val is not None else default
    except (KeyError, IndexError, AttributeError):
        return default


def query_archive():
    print("🔍 Querying IRSA SIA2...")
    coord = SkyCoord(RA_DEG, DEC_DEG, unit="deg")
    try:
        results = Irsa.query_sia(
            pos=(coord, SEARCH_RADIUS),
            collection=COLLECTION,
        )
    except Exception as e:
        print(f"❌ Query failed: {e}")
        sys.exit(1)

    print(f"✅ Query returned {len(results)} rows.")

    # SIA2Results wraps a VOTable; convert to astropy Table for uniform access.
    table = results.to_table() if hasattr(results, "to_table") else results

    colnames = list(getattr(table, "colnames", []) or getattr(results, "fieldnames", []))
    print(f"📊 Available columns ({len(colnames)}):")
    for col in colnames:
        print(f"     - {col}")

    return table


def pick_result(table):
    if len(table) == 0:
        print("❌ No observations found at this coordinate.")
        sys.exit(1)

    row = table[0]
    print("\n📦 Selected observation:")
    for key in (
        "obs_id",
        "obs_collection",
        "access_url",
        "dataproduct_type",
        "calib_level",
        "em_min",
        "em_max",
        "t_min",
        "t_max",
        "size",
    ):
        print(f"   {key:18s} {safe_get(row, key)}")

    access_url = safe_get(row, "access_url", default=None)
    if not access_url:
        print("❌ No access_url for this row — cannot download.")
        sys.exit(1)
    return row


def download_and_inspect(row):
    url = row["access_url"]
    print(f"\n⬇️  Downloading from {url}")
    print("    (MEF files are typically ~50–80 MB. First run is the slowest.)")

    try:
        local_path = download_file(url, cache=True, timeout=300)
        print(f"✅ Downloaded to: {local_path}")
    except Exception as e:
        print(f"❌ Download failed: {e}")
        sys.exit(1)

    print("\n🔬 Inspecting FITS structure...")
    metadata = {
        "obs_id": safe_get(row, "obs_id"),
        "obs_collection": safe_get(row, "obs_collection"),
        "access_url": url,
        "download_date_utc": datetime.now(timezone.utc).isoformat(),
        "query": {
            "ra_deg": RA_DEG,
            "dec_deg": DEC_DEG,
            "radius_arcsec": float(SEARCH_RADIUS.to_value(u.arcsec)),
            "collection": COLLECTION,
        },
        "fits_info": {"hdu_count": 0, "hdus": []},
    }

    try:
        with fits.open(local_path) as hdul:
            hdul.info()
            metadata["fits_info"]["hdu_count"] = len(hdul)

            for i, hdu in enumerate(hdul):
                info = {
                    "index": i,
                    "name": hdu.name,
                    "shape": list(hdu.data.shape) if hdu.data is not None else None,
                    "dtype": str(hdu.data.dtype) if hdu.data is not None else None,
                    "has_header": len(hdu.header) > 0,
                }
                metadata["fits_info"]["hdus"].append(info)
                print(f"   HDU {i}: {info['name']}, shape={info['shape']}, dtype={info['dtype']}")

            # WCS from first image HDU that has data
            wcs_info = None
            for i in range(1, len(hdul)):
                if hdul[i].data is not None:
                    try:
                        wcs = WCS(hdul[i].header)
                        if wcs.has_celestial:
                            wcs_info = {
                                "hdu_index": i,
                                "crpix": list(wcs.wcs.crpix),
                                "crval": list(wcs.wcs.crval),
                                "ctype": list(wcs.wcs.ctype),
                            }
                            print(f"   ✅ WCS on HDU {i}: CRVAL={wcs.wcs.crval}, CTYPE={wcs.wcs.ctype}")
                            break
                    except Exception as e:
                        print(f"   ⚠️ WCS parse on HDU {i} failed: {e}")
            metadata["wcs"] = wcs_info

            # Sample wavelength-ish header keys on HDU 1, if any exist
            if len(hdul) > 1:
                hdr1 = hdul[1].header
                for k in hdr1.keys():
                    if any(tok in k.upper() for tok in ("WAVE", "LAMBDA", "BAND", "FILTER")):
                        print(f"   🔧 Header[{k}] = {hdr1[k]}")

    except Exception as e:
        print(f"❌ FITS inspection failed: {e}")
        sys.exit(1)

    prov_path = OUTPUT_DIR / "provenance.json"
    with open(prov_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"\n💾 Provenance: {prov_path}")

    summary_path = OUTPUT_DIR / "stage0_summary.txt"
    with open(summary_path, "w") as f:
        f.write("Stage 0 Feasibility Summary\n")
        f.write("===========================\n")
        f.write(f"obs_id:       {metadata['obs_id']}\n")
        f.write(f"collection:   {metadata['obs_collection']}\n")
        f.write(f"access_url:   {metadata['access_url']}\n")
        f.write(f"coordinate:   RA={RA_DEG}, Dec={DEC_DEG}\n")
        f.write(f"retrieved:    {metadata['download_date_utc']}\n")
        f.write(f"hdu_count:    {metadata['fits_info']['hdu_count']}\n")
        if metadata.get("wcs"):
            f.write(f"wcs_crval:    {metadata['wcs']['crval']}\n")
            f.write(f"wcs_ctype:    {metadata['wcs']['ctype']}\n")
    print(f"📄 Summary:   {summary_path}")


def main():
    table = query_archive()
    row = pick_result(table)
    download_and_inspect(row)
    print("\n✅ Stage 0 inspection complete. See stage0_output/ for results.")


if __name__ == "__main__":
    main()