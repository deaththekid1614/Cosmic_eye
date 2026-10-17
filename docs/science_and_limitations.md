# Science & Limitations — Stage 0

## Confirmed capabilities

- Programmatic query of SPHEREx L2 products via IRSA SIA2 (`astroquery`).
- 415 rows returned for a 1 arcsec cone search at RA=304.69, Dec=42.44.
- FITS structure verified: IMAGE, FLAGS, VARIANCE, ZODI, PSF, WCS-WAVE HDUs.
- SIP-distorted WCS confirmed → reprojection must use Astropy/WCS or similar.

## Open questions (to resolve in Stage 2–4)

1. Do multiple rows share the same sky pointing at different bands?
   (Determines whether **same-observation band comparison** is available.)
2. Are there genuine **repeat observations** of the same sky region on
   different dates? (Needed for real time-difference demos.)
3. What `s_region` overlap exists between rows — how compatible are pairs?
4. What does `calib_level == 2` guarantee about absolute flux calibration?
5. What are realistic magnitudes of instrumental vs astrophysical variability?

## Scientific guardrails (unchanged)

- A visual difference is **not** a discovery.
- FLAGS and VARIANCE HDUs must be used to mask artefacts before subtraction.
- ZODI HDU provides a background model that should be considered during
  background subtraction — not ignored.
- Any candidate-change claim must state which HDUs and thresholds were used.

## HDU-by-HDU relevance for later stages

| HDU | Use in Stage 4/5 |
|---|---|
| IMAGE | Science data; do not alter |
| FLAGS | Mask bad pixels before any difference |
| VARIANCE | Provide statistical weighting / significance |
| ZODI | Subtract or flag background model influence |
| PSF | Note beam-size differences between bands |
| WCS-WAVE | Convert pixel positions to wavelength in Stage 6 |
