# Cosmic Eye — Current Project Handoff

This document describes the application and API present in the repository now. It is an implementation handoff: use the checked-in source as the final authority for behavior. Older staged handoffs may describe earlier designs and should not be used as a feature inventory for the current app.

## Project summary

Cosmic Eye is a React and FastAPI web application for browsing public SPHEREx infrared image products from NASA/IPAC IRSA. It lets a user resolve an astronomical name or enter coordinates, search archive coverage, inspect false-color previews and metadata, explore cataloged regions on an interactive sky sphere, and change how an infrared band is displayed.

It is an independent prototype built for the 2026 NASA Space Apps Challenge, not an official NASA product. It is not a planet-finding or discovery-confirmation system.

## AI and ML used by the current app

The “AI Search” route uses a local alias table for common objects and SIMBAD name resolution for other object names. It returns catalog coordinates for a subsequent archive query; it is not a generative assistant. Archive-result labels come from deterministic wavelength thresholds in `backend/app/services/ml_service.py`, not image-content recognition. The `xgboost` package appears in `backend/requirements.txt`, but the active app does not import it, load a trained model, or run inference. There is no current LLM or trained ML model whose prediction accuracy can be reported.

## Current frontend

Frontend entry and routing are in `frontend/src/main.tsx` and `frontend/src/App.tsx`. Shared layout is in `frontend/src/components/AppHeader.tsx` and `Sidebar.tsx`; styling is in `frontend/src/styles/`.

| Path | Current behavior |
| --- | --- |
| `/` | Home page with featured target cards and entry points to search, browse, and Color Lab. Featured home imagery may be decorative external imagery. |
| `/ai-search` | Resolves a target name through the backend, then loads archive observations around the returned coordinate. Per-result actions open Color Lab with that image’s region and observation selected. |
| `/explore` | Manual coordinate/archive search, with optional object-name resolution and observation detail viewing. Search results can be passed to Color Lab. |
| `/browse` | Popular Regions and Recent Observations tabs. Region cards request genuine SPHEREx preview images lazily; Recent Observations uses the fixed sample field RA `304.69°`, Dec `42.44°`, radius `0.5°`, page size `20`, then sorts those results by date. |
| `/popular-regions` | Alias to the same Browse page. |
| `/skymap` | Interactive Three.js celestial sphere with drag rotation, scroll zoom, RA/Dec grid toggle, automatic spin, filters, target search, and target selection. The selected target can open Manual Search. User-added targets are saved in browser local storage. |
| `/rgb` | Color Lab: fetches the available band groups for entered coordinates; supports five palettes, selecting individual bands, and choosing a scan from the observation queue. Only one band image is shown at a time. |
| `/learn` | Short infrared explainer with an interactive illustrative signal graphic. This graphic is not an archive image. |
| `/wavelengths` | Redirects to `/rgb`. Wavelength selection and queues are part of Color Lab; the backend wavelength endpoint remains active. |

The built-in Sky Map target response combines 15 curated targets with 102 records from `backend/app/catalogs/messier_targets.json` (117 built-in targets at the current catalog revision). `frontend/src/catalogs/hipparcos_bright_stars.json` contains 4,992 bright-star coordinate records used as the map backdrop. The target catalog is curated; it does not mean every SPHEREx observation or every known astronomical object is plotted.

## User-facing data flow

1. The frontend calls the same-origin `/api/v1` API. During Vite development, `frontend/vite.config.ts` proxies `/api` to `http://localhost:8000`.
2. For archive searches, FastAPI validates coordinates and bounds, then `backend/app/adapters/irsa_spherex.py` calls Astroquery’s IRSA SIA query for SPHEREx collection `spherex_qr2` by default.
3. `backend/app/services/archive_service.py` filters to calibrated image products, converts wavelength units from meters to micrometers, and builds observation and band-group responses.
4. For image previews, the backend downloads the IRSA FITS product, reads the science image from FITS extension 1, subtracts the ZODI extension when it is present in the expected position, normalizes the data, maps it through the requested display palette, and caches a JPEG under `backend/tmp/previews/`.
5. SIMBAD target resolution is implemented in `backend/app/services/ai_service.py`. A small built-in alias list handles common targets; otherwise it queries SIMBAD. “AI Search” is the product label; this is name resolution, not a generative assistant or scientific classifier.

## Backend API

FastAPI routes are mounted under `/api/v1`. The endpoint definitions are in `backend/app/api/observations.py` and `backend/app/api/health.py`.

| Endpoint | Current purpose |
| --- | --- |
| `GET /health` | Liveness response. |
| `GET /observations` | Query SPHEREx image products by RA/Dec, optional radius and collection, and pagination. Defaults: radius `0.01°`, collection `spherex_qr2`, page `1`, page size `10`. Maximum radius is `1°`; maximum page size is `50`. |
| `GET /observations/wavelengths` | Returns available unique bands and grouped multi-band observation sets. Used by Color Lab. |
| `GET /observations/featured` | Returns the built-in featured/covered target list. |
| `GET /observations/ai-search?q=…` | Resolves a target name and returns its coordinate, matched name and, where provided, search note/radius. |
| `GET /observations/random` | Returns a randomly sampled sky direction. |
| `GET /observations/preview?url=…&palette=…` | Returns a generated/cached single-band JPEG. Allowed source URLs must use the IRSA host. Supported palettes: `inferno`, `magma`, `plasma`, `viridis`, and `cividis`. |
| `GET /observations/preview/rgb?url1=…&url2=…&url3=…` | Returns an experimental three-file RGB composite. Each URL is host-checked against IRSA. |

Full request/response models are in `backend/app/schemas/observation.py`; interactive OpenAPI is available at `/docs` while the API is running.

## Local development

Requirements: Python `>=3.11,<3.12`, Node.js/npm, Git, and a network connection for IRSA/SIMBAD and FITS downloads.

Backend, from the repository root:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend, in a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

The local UI is normally at `http://localhost:5173`; the API is at `http://localhost:8000`. `./run.sh` and `./scripts/dev.sh` start both processes and require Bash. The Vite proxy is configured for local development.

To run configured checks, provision `backend/.venv` and install frontend dependencies, then run `./scripts/check.sh`. It runs Ruff, pytest, and TypeScript type checking. `cd frontend && npm run build` creates a frontend production bundle. No check/build was run as part of this documentation update.

## Configuration and operational notes

- `backend/.env` is optional; `.env.example` documents the declared settings. `FRONTEND_ORIGIN` controls API CORS. The preview cache defaults to `backend/tmp/previews/`.
- `VITE_API_BASE_URL` can set a frontend API base URL; by default, frontend API calls use relative `/api` URLs.
- The code defines additional settings such as `CACHE_TTL_SECONDS`, `MAX_RESULTS`, `MAX_DOWNLOAD_BYTES`, and `REQUEST_TIMEOUT_SECONDS`, but do not assume every one currently governs upstream calls. Some request and download behavior is specified directly in service code.
- There is no configured IRSA API key. Archive access and SIMBAD name resolution require network/upstream availability.
- Local generated previews are cache files, not source/archive products. A first preview request downloads and processes a FITS file and may take time. Source product links remain available through observation details.
- Local preview URLs expect the backend API to be reachable. A deployed frontend requires the matching API base/proxy and deployment configuration; no production deployment is configured here.

## Scientific interpretation and product limits

- IRSA SIA returns image footprints that intersect the requested position. Observation-card RA/Dec values are product field centers, not necessarily the searched object’s exact coordinates. A thumbnail may show the full field and may not make the target visually prominent.
- A preview is a display rendering, not the original science array. Palette colors are false color and do not represent visible-light appearance.
- The RGB endpoint normalizes three inputs independently and crops arrays to common dimensions. It does not align images by WCS, reproject them, or calibrate color. Treat it as illustrative.
- Bands returned for a search can belong to overlapping scans. A band list or queue is not a calibrated spectrum or guaranteed matched observation set.
- Wavelength descriptions in `backend/app/services/ml_service.py` are fixed wavelength-range labels. They do not classify image contents, identify objects, or claim a detection.
- Sky Map geometry shows direction only. It does not encode distance, physical scale, or a physical model of object placement.
- Featured images on Home can use external decorative imagery. Popular Region cards request actual SPHEREx archive preview products separately.
- The app does not claim to detect Planet X or confirm transient discoveries. Interpret observations through the archive product, its metadata, calibration, and applicable scientific documentation.

## Verified M74 search example

On 2026-10-18, we checked the app’s Phantom Galaxy (M74) search against SIMBAD and queried the SPHEREx QR2 archive at the target coordinates. SIMBAD’s ICRS position is RA `24.1739379°`, Dec `+15.7836409°`, matching the app search coordinates RA `24.17393792°`, Dec `+15.78364083°`. The IRSA SIA2 response included products shown in the app (`2026W01_2A_0510_1`, `2026W01_2A_0510_2`, and `2026W01_2A_0510_4`); their `s_region` polygons cover M74. For the first product, the field center is about RA `23.57°`, Dec `+14.81°`, roughly `1.14°` from the galaxy. This is consistent with a wide SPHEREx footprint covering M74; it does not mean the thumbnail is a crop or a resolved close-up of the galaxy.

References: [SIMBAD M 74 record](https://simbad.u-strasbg.fr/simbad/sim-id?Ident=M+74), [IRSA SPHEREx SIA2 data-access guide](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/).

This validates the M74 name-resolution and archive-coverage path for this example. It does not validate every catalog entry or represent an evaluation of an ML model; the current app does not use a trained model for this workflow.

## Important source locations

```text
backend/app/main.py                           FastAPI app, CORS, API setup
backend/app/api/observations.py               Observation, target, and preview routes
backend/app/adapters/irsa_spherex.py          Astroquery / IRSA SIA access
backend/app/services/archive_service.py       Observation normalization and band grouping
backend/app/services/ai_service.py            SIMBAD name resolution and random coordinates
backend/app/services/preview_service.py       FITS preview and RGB rendering/cache
backend/app/services/featured_service.py      Featured target catalog response
backend/app/catalogs/messier_targets.json     Bundled Messier target records
frontend/src/App.tsx                          Frontend routes
frontend/src/routes/                          Routed pages
frontend/src/components/SkyMapGlobe.tsx       Three.js celestial view
frontend/src/components/PopularRegionCard.tsx Archive-backed region previews
frontend/src/catalogs/hipparcos_bright_stars.json  Sky Map backdrop coordinates
frontend/src/api/                             Typed frontend API wrappers
frontend/src/styles/                          App styling and tokens
docs/data_provenance.md                       Existing archive provenance notes
docs/science_and_limitations.md               Existing interpretation notes
```

## License and attribution

Project source code is licensed under the MIT License in the repository root. That license does not grant rights to NASA/IPAC IRSA products, SIMBAD content, astronomical catalogs, or third-party images. Check and follow applicable source-specific terms and attribution instructions before redistributing those materials. Cosmic Eye is independent and is not affiliated with or endorsed by NASA, JPL, Caltech, or the SPHEREx mission team.
