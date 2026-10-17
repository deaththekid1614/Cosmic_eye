# Stage 2 Handoff — Real Data Integration & UI Overhaul

**Date:** (fill in)
**Status:** ✅ Complete
**Next:** `handoffs/stage3_handoff.md`

---

## Summary

Stage 2 successfully connected the React frontend to the live NASA IRSA SIA2 archive via the FastAPI backend. Users can now search for real SPHEREx observations by coordinates, and the backend fetches the metadata, normalizes it, and serves it to the UI.

During this stage, we also executed a **major UI overhaul** to match the high-fidelity "World Monitor" dashboard mockup provided by the design team. We added a top navigation bar, left sidebar, hero banner, and a 3-column layout.

Additionally, we implemented a preview image generator so the cards display actual FITS data instead of just numbers.

---

## Files delivered (Backend)

### Core Utilities & Schemas
- `app/utils/errors.py` — Custom error classes mapped to HTTP codes.
- `app/utils/limits.py` — Input validation (RA 0-360, max 1-degree radius, max page size).
- `app/utils/handlers.py` — FastAPI global exception handler to format errors cleanly.
- `app/schemas/observation.py` — Pydantic models defining the exact JSON contract.

### Data Pipeline
- `app/adapters/irsa_spherex.py` — Encapsulates `astroquery.ipac.irsa`. Only file that talks to NASA.
- `app/services/archive_service.py` — Filters `calib_level >= 2`, converts MJD to ISO-8601, converts meters to micrometers, applies pagination.
- `app/services/preview_service.py` — **NEW:** Downloads the 71MB FITS file, uses Astropy `ImageNormalize` (ZScale + LogStretch), and uses PIL to output a 400x400 JPEG.

### API Routes
- `app/api/observations.py` — 
  - `GET /api/v1/observations` (Metadata search).
  - `GET /api/v1/observations/preview?url=...` (FITS-to-JPEG converter).
- `app/api/__init__.py` & `app/main.py` — Registered the routers and exception handlers.

---

## Files delivered (Frontend)

### Components & Layout
- `src/App.tsx` — Updated to use the new 3-column layout.
- `src/components/AppHeader.tsx` — Top navigation with Lucide icons.
- `src/components/Sidebar.tsx` — Left fixed sidebar with NASA SPHEREx promo card.
- `src/components/ObservationCard.tsx` — Image preview, badge, and NASA source link.

### Pages & Styles
- `src/routes/HomePage.tsx` — Full hero banner, feature grid, and "Explore the Universe" right panel.
- `src/routes/ExplorePage.tsx` — Search form + dynamic results grid.
- `src/types/observation.ts` & `src/api/observations.ts` — Type-safe API integration.
- `src/styles/global.css` — Completely rewritten with CSS variables, glassmorphism, and the "World Monitor" aesthetic.

---

## What was verified

| Check | Command | Result |
|---|---|---|
| Error Handling | `TestClient` GET `ra=400` | Returns `422` with `{"error": {"code": "invalid_input"}}` |
| Live NASA Query | `TestClient` GET `ra=304.69...` | Returns `200` with real `obs_id`s |
| Preview Image | Browser check | Backend downloads FITS, renders grayscale JPEG, UI displays it |
| UI Mockup | Browser check | Matches provided high-fidelity mockup |

---

## How to run

Backend:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm run dev
```

Or run both from root: `./run.sh`

---

## Decisions made

1. **Real-time Preview Generation:** We are downloading and processing FITS files on-the-fly in `preview_service.py`. This is slow (takes ~5-10s per image) but avoids needing a database/cache for the MVP.
2. **ZScale + LogStretch:** We use Astropy's ZScale interval to handle the vast dynamic range of infrared data, preventing the images from being completely black.
3. **Strict TypeScript:** `noUnusedLocals` is on. Unused icon imports will throw a red error in VS Code.

---

## Known limitations at Stage 2 exit

- **Images are Grayscale:** The `preview_service.py` currently saves a standard 8-bit grayscale image. It does not yet apply a false-color heatmap (like "magma" or "inferno"). This is the immediate next task.
- **No Caching:** Every time the Explore page loads, it downloads 71MB from NASA. This is very slow. We need to implement a disk or memory cache for generated previews.
- **Hardcoded Coordinates:** The "Use Example" button uses the fixed Stage 0 coordinates. No object name resolution yet (e.g., typing "Orion" does nothing).

---

## What's next — Stage 3 (Viewer + UX)

Goal: Polish the Explore page and build the full-screen interactive image viewer.

Planned deliverables:
- **False-color image mapping:** Update `preview_service.py` to use Matplotlib colormaps (e.g., `magma`) so the images look like beautiful nebulas.
- **Caching:** Cache generated previews in a local `tmp/previews` folder so reloading the page doesn't re-download 71MB from NASA.
- **Interactive Viewer:** Build `ObservationViewer.tsx`. Clicking an observation card should open a modal with zoom/pan capabilities (using a library like `react-zoom-pan-pinch`).
- **Metadata Panel:** Show the full observation details (variance, WCS info) in an expandable panel within the viewer.
