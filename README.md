# Cosmic Eye

Cosmic Eye is a web app for exploring public NASA SPHEREx infrared observations. Search by sky coordinates or astronomical object name, browse regions with archive coverage, view image previews, and inspect the same sky area across available infrared bands.

The project was built for the 2026 NASA Space Apps Challenge. It is an independent prototype, not an official NASA product, and it does not detect or confirm Planet X or any other discovery.

## Contents

- [Features](#features)
- [End-to-end architecture](#end-to-end-architecture)
- [Science and data limits](#science-and-data-limits)
- [Technology](#technology)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [API](#api)
- [Project structure](#project-structure)
- [Checks](#checks)
- [License and attribution](#license-and-attribution)

## Features

| Feature | What it does | Data and behavior |
| --- | --- | --- |
| Home (`/`) | Introduces Cosmic Eye and links to search, browse, and featured targets. | Featured thumbnails can be decorative external images; selecting a target starts an archive search at its coordinates. |
| AI Search (`/ai-search`) | Resolves an astronomical object name and finds SPHEREx products near its position. | Uses SIMBAD plus a small local alias list. “AI” is the product label; this is name resolution, not a generative assistant. |
| Manual Search (`/explore`) | Searches by right ascension and declination; opens observation metadata and source links. | Results are image footprints around the searched position. Displayed RA/Dec values are the product field centers. |
| Browse (`/browse`) | Offers Popular Regions and Recent Observations tabs. | Region cards load real SPHEREx previews. Recent Observations queries a fixed sample sky field, not a mission-wide date search. |
| Popular Regions (`/popular-regions`) | Opens Browse at its region tab. | Uses a curated target catalog; selecting a card opens that target’s archive observations. |
| Sky Map (`/skymap`) | Interactive Three.js sky sphere with rotation, zoom, grid, filters, target selection, and name search. | Displays 117 built-in target records and Hipparcos guide stars. Added targets are checked for archive coverage and saved in browser local storage. It is not a complete map of all observations. |
| Color Lab (`/rgb`) | Changes the display palette or wavelength band for an infrared image; includes a queue of scans in the region. | Displays one band image at a time. Palettes: Inferno, Viridis, Plasma, Cividis, and Magma. |
| Learn (`/learn`) | Explains infrared and how wavelength/palette choices affect display. | Includes an illustrative signal graphic, not observed SPHEREx data. |

## End-to-end architecture

This block diagram follows a request from the browser through the API and out to the astronomy data services. It shows the three backend jobs separately: resolve a name, find image products, and render a preview.

```text
+------------------------------------------------------------------+
| 1. BROWSER                                                       |
| User -> React pages -> typed API client                          |
+-------------------------------+----------------------------------+
                                | HTTP requests to /api/v1
                                v
+------------------------------------------------------------------+
| 2. FASTAPI BACKEND                                               |
| Validates inputs and dispatches each request to the right flow.  |
|                                                                  |
| NAME SEARCH                                                      |
| Local aliases or SIMBAD -> target coordinates returned to UI     |
|                                                                  |
| ARCHIVE SEARCH                                                   |
| Coordinates -> archive service -> Astroquery SIA2 -> IRSA QR2    |
| IRSA image records -> normalized observation JSON                |
|                                                                  |
| IMAGE PREVIEW                                                    |
| IRSA product URL -> download FITS -> normalize and palette       |
| -> local JPEG cache                                              |
+-------------------------------+----------------------------------+
                                | JSON results and JPEG previews
                                v
+------------------------------------------------------------------+
| 3. BROWSER RESULT                                                |
| React renders images, field-center metadata, details, and links.  |
+------------------------------------------------------------------+
```

**Typical user flow:** AI Search resolves a name to coordinates, then searches the archive. Manual Search starts with coordinates and skips name resolution. Browse and Sky Map supply coordinates from a selected region. When a card or viewer needs an image, the browser requests a preview; the backend returns a cached JPEG or builds one from the FITS product. Color Lab also requests available wavelength groups for its band selector and scan queue.

## AI and machine learning

The app’s “AI Search” label describes an astronomical name lookup. The current user-facing product does not run a generative AI model or a trained machine-learning model.

| Component | What is actually used | What it does not do |
| --- | --- | --- |
| Object-name search | A local alias table for common objects, followed by an online SIMBAD lookup for other names. | Does not interpret open-ended questions or generate answers. A result supplies a catalog position for an archive query. |
| Wavelength labels | Deterministic thresholds in `backend/app/services/ml_service.py`: `<1.65 µm`, `<2.43 µm`, `<3.10 µm`, and longer bands. | Does not analyze pixels, detect stars/nebulae, or predict anything. The label describes the wavelength band. |
| XGBoost dependency | `xgboost` is listed in `backend/requirements.txt`. | No active service imports XGBoost, loads trained weights, or runs XGBoost inference. The app has no active neural-network or LLM inference path. |
| Color palettes | Matplotlib colormaps applied to normalized FITS pixels. | This is image rendering, not AI or learned image classification. |

Accordingly, there is no trained model accuracy score to report. The M74 cross-check below validates one name-resolution and archive-coverage example; it is not a model evaluation.

### Component responsibilities

| Component | Responsibility |
| --- | --- |
| React pages and components (`frontend/src/`) | Search forms, navigation, result cards, metadata viewer, Color Lab controls, and 3D sky view. |
| Typed API clients (`frontend/src/api/`) | Build `/api/v1` requests and preview URLs. |
| FastAPI routes (`backend/app/api/`) | Validate and route observation, name-resolution, catalog, and preview requests. |
| Archive service (`backend/app/services/archive_service.py`) | Filter calibrated image products, normalize wavelength units and timestamps, and group available bands. |
| IRSA adapter (`backend/app/adapters/irsa_spherex.py`) | Query SPHEREx image coverage through Astroquery’s SIA interface. |
| Name resolver (`backend/app/services/ai_service.py`) | Resolve local aliases or query SIMBAD for target coordinates. |
| Preview service (`backend/app/services/preview_service.py`) | Download FITS, normalize science pixels, apply a display palette, and cache JPEG previews. |
| External services | NASA/IPAC IRSA supplies SPHEREx products; SIMBAD resolves astronomical names. |

Single-band previews are display renderings, not the underlying science arrays. Palette colors encode signal and do not show true visible-light colors. The optional backend RGB-preview endpoint combines three files for illustration; it does not perform WCS registration/reprojection or photometric color calibration.

### Science and data limits

- A search result’s RA and Dec are the image tile’s center. A tile can cover the requested target even when its center is some distance away. The preview can show a wide field rather than a close-up of the target.
- IRSA results and available bands depend on the archive release and sky position. An empty result means no matching product was returned for that query; it does not mean there are no astronomical objects there.
- The Color Lab queue groups archive records by observation ID. Bands may come from overlapping scans, and comparing them is not a calibrated spectrum.
- The Sky Map plots catalog directions on a sphere centered at the SPHEREx observer viewpoint. Marker locations encode RA/Dec direction, not physical distance or object size. The background stars come from a bundled Hipparcos coordinate list; target markers represent catalog entries with recorded SPHEREx coverage.
- Observation wavelength labels describe the band. They do not identify the contents of an image. Do not interpret UI labels as scientific classifications or detections.
- Archive files and externally hosted imagery retain their own source terms and attribution requirements. The repository’s MIT license does not relicense them.

## Cross-check: M74 (Phantom Galaxy)

On 2026-10-18, we cross-checked the M74 search shown in the app against SIMBAD and a live positional query of the SPHEREx QR2 archive:

| Check | Result |
| --- | --- |
| Target identity and coordinates | SIMBAD lists M74 at ICRS RA `24.1739379°`, Dec `+15.7836409°`. The app’s search coordinates, RA `24.17393792°`, Dec `+15.78364083°`, match to the displayed precision. [SIMBAD: M 74](https://simbad.u-strasbg.fr/simbad/sim-id?Ident=M+74) |
| SPHEREx archive coverage | An IRSA SIA2 position query at M74 returned the screenshot’s QR2 products, including `2026W01_2A_0510_1`, `2026W01_2A_0510_2`, and `2026W01_2A_0510_4`. Their `s_region` footprint polygons include M74’s coordinates. [SPHEREx archive SIA2 documentation](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/) |
| Why image centers differ | Those records report tile centers around RA `23.57°`, Dec `+14.81°` for the first product, roughly `1.14°` from M74. The archive returns them because their larger image footprints cover the target; the center is not M74’s position. |
| What the preview proves | It is a real SPHEREx infrared tile that covers the target. The app preview shows the tile’s broad field; it is not a crop or a claim that M74 is visibly resolved in that thumbnail. |

**What this validates:** the M74 name resolves to the expected position, the app searches those coordinates, and the returned archive footprints cover that position. This is an end-to-end cross-check of this target lookup and coverage path.

**What it does not validate:** this single example does not verify every catalog entry, every archive result, the photometric calibration of an image, or a scientific detection. The preview remains a wide-field infrared tile, not a close-up of the galaxy.

## Technology

| Area | Technologies | Role in this project |
| --- | --- | --- |
| Frontend | React 18, TypeScript 5.6, Vite 6 | Builds the browser interface and development server. |
| Routing and UI | React Router 6, Lucide React, `react-zoom-pan-pinch` | Page navigation, icons, and image zoom/pan controls. |
| 3D visualization | Three.js | Renders the interactive celestial sphere in Sky Map. |
| Backend API | Python 3.11, FastAPI, Uvicorn, Pydantic 2, pydantic-settings | Serves and validates the `/api/v1` endpoints and application settings. |
| Astronomy/archive access | Astroquery, PyVO, Astropy, NASA/IPAC IRSA, SIMBAD | Resolves target names and queries SPHEREx archive products and metadata. |
| FITS image processing | Astropy, NumPy, Matplotlib, Pillow | Reads FITS data, scales pixel values, applies display palettes, and writes JPEG previews. |
| HTTP and configuration | HTTPX, Requests, python-dotenv | Supports HTTP integrations and optional `.env` configuration. |
| Scientific Python dependencies | SciPy, scikit-image, scikit-learn, XGBoost | Declared in the backend environment; they are not currently used for active model inference in the app. |
| Quality checks | Ruff, pytest, pytest-asyncio, TypeScript compiler (`tsc`) | Python linting/tests and frontend type checking. |

### AI and ML status

Cosmic Eye currently has no trained model, neural network, or large language model in its request flow. The feature named **AI Search** looks up known aliases locally and uses SIMBAD through Astroquery to resolve other object names to catalog coordinates. Wavelength descriptions are assigned by fixed thresholds in `backend/app/services/ml_service.py`. The palette controls transform FITS pixels for display; they do not classify the image. Although scikit-learn and XGBoost are listed as dependencies, active application code does not load a trained model or call their inference APIs.

## Run locally

You need Python 3.11, Node.js/npm, Git, and internet access to reach IRSA and SIMBAD. From the repository root, create and start the backend:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

In a second terminal, start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The Vite development server proxies `/api` to the backend at `http://localhost:8000`. Alternatively, after installing both sets of dependencies, run `./run.sh` from the repository root. The helper scripts use Bash.

The API health check is at `http://localhost:8000/api/v1/health`; interactive API documentation is at `http://localhost:8000/docs`.

## Configuration

The backend can read an optional `backend/.env` file. `.env.example` lists the declared environment settings. `FRONTEND_ORIGIN` controls the CORS allowlist; the preview cache defaults to `backend/tmp/previews/`. Some other example settings are declared in configuration but are not currently used to control every upstream request or cache behavior. The app does not require an IRSA API key.

The frontend accepts `VITE_API_BASE_URL` for an API base URL; when unset it uses relative `/api` URLs, which work with the local Vite proxy. Local preview generation requires the backend to be reachable.

## API

All routes are under `/api/v1`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness and service version. |
| `GET` | `/observations?ra=…&dec=…` | Search calibrated SPHEREx image products near a coordinate. Optional parameters: `radius` (default `0.01°`, maximum `1°`), `collection` (default `spherex_qr2`), `page` (default `1`), and `page_size` (default `10`, maximum `50`). |
| `GET` | `/observations/wavelengths?ra=…&dec=…` | Return available wavelength records and multi-band observation groups. Used by Color Lab. |
| `GET` | `/observations/featured` | Return the built-in featured target catalog. |
| `GET` | `/observations/ai-search?q=…` | Resolve an object name and return its coordinates. |
| `GET` | `/observations/random` | Return a random sky coordinate. |
| `GET` | `/observations/preview?url=…&palette=…` | Return a cached or newly generated single-band JPEG preview. |
| `GET` | `/observations/preview/rgb?url1=…&url2=…&url3=…` | Return an experimental three-band composite. |

Coordinates and search bounds are validated by the backend. The live OpenAPI documentation at `/docs` is the reference for request and response schemas.

## Project structure

```text
cosmic-eye/
├── README.md                         Setup, features, architecture, and limits
├── LICENSE                           MIT license for project source
├── .env.example                      Backend environment examples
├── run.sh                            Starts backend and frontend (Bash)
├── scripts/
│   ├── dev.sh                        Development server launcher
│   └── check.sh                      Ruff, pytest, and TypeScript checks
├── backend/
│   ├── app/
│   │   ├── main.py                   FastAPI application and middleware
│   │   ├── config.py                 Backend settings
│   │   ├── api/                      Health and observation HTTP routes
│   │   ├── adapters/                 NASA/IPAC IRSA access
│   │   ├── services/                 Archive, name resolution, FITS preview services
│   │   ├── schemas/                  Pydantic API response models
│   │   ├── utils/                    Coordinate validation and error handling
│   │   └── catalogs/                 Bundled Messier target records
│   ├── tests/                        Backend pytest suite
│   ├── requirements.txt              Python dependencies
│   └── pyproject.toml                Python and tool configuration
├── frontend/
│   ├── index.html                    Vite HTML entry
│   ├── package.json                  Frontend scripts and dependencies
│   ├── vite.config.ts                Development server and API proxy
│   └── src/
│       ├── main.tsx                  React entry point and global styles
│       ├── App.tsx                   Layout and route table
│       ├── api/                      Typed API clients and URL builders
│       ├── routes/                   Routed page implementations
│       ├── components/               Shared UI, viewers, cards, and sky map
│       ├── catalogs/                 Hipparcos star coordinates for the map
│       ├── styles/                   Design tokens and global CSS
│       ├── types/                    Shared frontend/API types
│       └── utils/                    Formatting and input validation helpers
├── docs/
│   ├── data_provenance.md            Archive sample and data provenance notes
│   └── science_and_limitations.md    Interpretation and science cautions
└── handoffs/
    ├── handoff_updated.md            Current implementation handoff
    └── …                             Earlier staged project notes
```

Generated files and local environments such as `frontend/node_modules/`, `frontend/dist/`, `backend/.venv/`, and `backend/tmp/previews/` are local build/runtime artifacts and are not part of the application source tree.

```
