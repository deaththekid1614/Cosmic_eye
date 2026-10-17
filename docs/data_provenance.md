# Data Provenance — Stage 0

## Verified observation (2026-xx-xx)

- **obs_id:** `2025W43_1A_0516_1`
- **obs_collection:** `spherex_qr2` (SPHEREx Quick Release 2)
- **Source URL (official IRSA):**
  `https://irsa.ipac.caltech.edu/ibe/data/spherex/qr2/level2/2025W43_1A/l2b-v20-2025-299/5/level2_2025W43_1A_0516_1D5_spx_l2b-v20-2025-299.fits`
- **Query:** IRSA SIA2 via `astroquery.ipac.irsa.Irsa.query_sia`
  - RA = 304.693508808°, Dec = 42.4436872991°
  - radius = 1 arcsec
  - collection = `spherex_qr2`
- **Retrieved:** timestamp recorded in `backend/stage0_output/provenance.json`
- **File size:** 71 MB
- **Pipeline version (from filename):** `l2b-v20-2025-299`

## Product structure (verified by Astropy)

| HDU | Name | Shape | dtype | Purpose |
|---|---|---|---|---|
| 0 | PRIMARY | — | — | metadata only |
| 1 | IMAGE | 2040×2040 | float32 | science surface brightness |
| 2 | FLAGS | 2040×2040 | int32 | pixel quality flags |
| 3 | VARIANCE | 2040×2040 | float32 | per-pixel variance |
| 4 | ZODI | 2040×2040 | float32 | zodiacal background model |
| 5 | PSF | 121×101×101 | float32 | point-spread function |
| 6 | WCS-WAVE | 1R×3C | binary table | per-pixel wavelength mapping |

## WCS

- **CTYPE:** `RA---TAN-SIP`, `DEC--TAN-SIP` (SIP distortion)
- **CRVAL:** RA 302.84983254°, Dec 43.50834015°
- **Implication:** reprojection will need SIP-aware handling in Stage 4/5.

## Scientific band

- **Wavelength range:** 3.8113 µm – 4.43 µm (SPHEREx band 5, ~4.1 µm central)
- Filename suffix `D5` identifies this as detector 5 / band 5.

## Feasibility verdict

✅ A real SPHEREx Level 2 Spectral Image can be queried via SIA2, downloaded,
read by Astropy, and structurally understood. Core data-access path is confirmed.
