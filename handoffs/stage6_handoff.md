# Stage 6 Handoff — Wavelength Explorer

**Date:** (fill in)
**Status:** ✅ Complete
**Next:** `handoffs/stage7_handoff.md` (Deploy & Rehearse)

---

## Summary

Stage 6 introduced the **Wavelength Explorer**. SPHEREx observes the sky in 102 different infrared bands, but a single observation (`obs_id`) may contain multiple band images. This stage groups observations by their `obs_id` on the backend and provides a frontend UI to let users toggle between the available wavelengths.

Because shorter wavelengths (e.g., 2.0 µm) mostly show starlight and longer wavelengths (e.g., 4.7 µm) show warm dust, users can visually see how the exact same region of space looks completely different depending on the light being measured.

*(Note: Stage 5 — Difference Analysis / Time Machine — was built, tested, and intentionally removed per user request to keep the app focused and stable.)*

---

## Files delivered

### Backend
- `app/schemas/observation.py` — Added `BandDetail`, `WavelengthSet`, and `WavelengthResponse` Pydantic models.
- `app/services/archive_service.py` — Added `fetch_wavelength_sets()`. Uses `collections.defaultdict` to group raw NASA rows by `obs_id`, filters out any observation with only 1 band, and sorts the remaining sets by number of available bands and wavelength.
- `app/api/observations.py` — Added `GET /api/v1/observations/wavelengths` route.

### Frontend
- `src/types/observation.ts` — Added TypeScript interfaces for the new models.
- `src/api/observations.ts` — Added `getWavelengthSets()` fetch function.
- `src/routes/WavelengthsPage.tsx` — Replaced stub. Built a 3-panel UI:
  1. Search form (RA/Dec).
  2. Sidebar list of available multi-band `obs_id`s.
  3. Interactive wavelength pill selector that updates a large central image viewer.
- `src/styles/global.css` — Added `.wavelength-layout`, `.wavelength-viewer`, and `.wavelength-sidebar` styles for a responsive control panel look.

---

## What was verified

| Check | Result |
|---|---|
| **Backend Grouping** | 191 multi-band sets found for test coords (304.69, 42.44). |
| **API Response** | `GET /wavelengths` returns correct `obs_id`, sorted `bands`, and source URLs. |
| **Frontend Typecheck** | 0 errors (X 0). |
| **UI Interaction** | Searched Andromeda (10.68, 41.27), selected `2025W51_1A_0684_3`, toggled between 2.032 µm and 4.711 µm. The image instantly updated to show the difference between starlight and dust. |

---

## Decisions made

1. **Backend Grouping:** We group the data on the backend rather than the frontend to ensure that pagination doesn't split multi-band observations across different pages.
2. **Sorting:** Sets are sorted by the number of available bands (descending), so the most scientifically rich observations appear at the top of the sidebar.
3. **No RGB Composite:** We are strictly toggling between single-band grayscale/heatmaps. We did not mix bands into an RGB image.

---

## Known limitations at Stage 6 exit

- **Only 2 bands per set:** As discovered during testing, SPHEREx splits its 102 bands across 6 different detectors. A single `obs_id` points to one specific detector's scan. Therefore, the current Quick Release 2 (QR2) dataset only has 1 or 2 processed bands per `obs_id`. To see 3+ bands, the user must find a location where multiple detectors overlap, or wait for future data releases.
- **No direct coordinate lookup:** Users can only search by RA/Dec. Typing "Orion" or "Andromeda" requires a name resolver (not yet implemented).

---

## What's next — Stage 7 (Polish, Deploy, and Rehearse)

Goal: Produce a stable public demonstration ready for the hackathon.

Planned deliverables:
- **Final UI Polish:** Fix any minor alignment issues on mobile.
- **Deployment:** 
  - Deploy the backend (FastAPI) to a host like Render, Railway, or Fly.io.
  - Deploy the frontend (Vite) to Vercel or Netlify.
- **Environment Config:** Set the production `FRONTEND_ORIGIN` in the backend `.env` and `VITE_API_BASE_URL` in the frontend build.
- **Demo Script:** Write a step-by-step narrative for the judges (Search -> View -> Wavelengths).
- **Backup Video:** Record a 2-minute screen capture of the app working in case the live NASA archive goes down during the presentation.

---

## Final Project State

All core features from the original architecture handoff are now complete:
- ✅ Real NASA SPHEREx data via IRSA SIA2.
- ✅ Search by coordinates.
- ✅ FITS-to-JPEG image generation.
- ✅ Disk caching.
- ✅ Full-screen interactive image viewer with zoom/pan.
- ✅ Multi-band Wavelength Explorer.
- ✅ Cross-platform responsive UI.
