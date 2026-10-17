# Stage 1 Handoff — Skeleton + Developer Setup

**Date:** (fill in)
**Status:** ✅ Complete
**Next:** `handoffs/stage2_handoff.md`

---

## Summary

Full repository skeleton plus a working frontend and backend. A clean clone
can be brought up with documented commands and reach `http://localhost:5173`
(frontend) and `http://localhost:8000/api/v1/health` (backend).

**Project name updated:** `Cosic Eye` → `Cosmic Eye` across all code, docs, and configs.
**UI Layout:** "World monitor" aesthetic implemented with a fixed left sidebar navigation.

---

## Files delivered

### Repo root
- `.editorconfig` — LF endings, 2-space default, 4-space Python
- `.gitignore` — excludes `.venv/`, `.env`, caches, `node_modules/`, `*.fits`, `tmp/`, `data/`
- `.env.example` — documented backend env vars (no secrets)
- `README.md` — full setup instructions and status table
- `architecture_handoff.md` — original handoff (unchanged)
- `LICENSE` — placeholder

### Backend
- `requirements.txt` — pinned: fastapi 0.115.6, uvicorn 0.32.1, pydantic 2.10.3,
  pydantic-settings 2.6.1, httpx 0.28.1, python-dotenv 1.0.1, astropy 7.0.0,
  numpy 2.1.3, scipy 1.14.1, scikit-image 0.24.0, pyvo ≥1.5 <2, astroquery 0.4.7,
  pytest 8.3.4, pytest-asyncio 0.24.0, ruff 0.8.2
- `pyproject.toml` — ruff config (line-length 100, py311), pytest config
- `app/config.py` — Pydantic settings, `IRSA_BASE_URL`, `FRONTEND_ORIGIN`,
  cache/limit/timeout defaults. Service name: `cosmic-eye-api`.
- `app/main.py` — FastAPI app, CORS, `/api/v1` router include, root endpoint
- `app/api/__init__.py` — aggregates `api_router` (currently includes health)
- `app/api/health.py` — `GET /health` returns `{status, service, version}`
- `app/{schemas,services,adapters,utils}/__init__.py` — package markers with docstrings
- `tests/test_health.py` — 3 tests: ok response, root endpoint, 405 on POST

### Frontend
- `package.json` — React 18, react-router-dom 6, Vite 6, TS 5.6
- `vite.config.ts` — `/api` proxy → `http://localhost:8000`
- `tsconfig.json`, `tsconfig.node.json` — strict, ES2022
- `index.html`, `src/main.tsx`, `src/App.tsx` — entry with `BrowserRouter`
- `src/components/AppHeader.tsx` — fixed left sidebar navigation with active states
- `src/routes/{Home,Explore,Compare,Changes,Wavelengths,Learn}Page.tsx` — Home is
  fleshed out; other five are informative stubs ("arrives in Stage N")
- `src/api/client.ts` — `fetchJson<T>` + `getHealth()`
- `src/styles/{tokens,global}.css` — dashboard-style dark theme, responsive,
  accessible contrast, fixed sidebar with mobile fallback (stacks to top on mobile)

### Scripts
- `scripts/dev.sh` — runs uvicorn (backend) + vite (frontend) in parallel
- `scripts/check.sh` — ruff + pytest on `app`/`tests`, tsc on `frontend`

---

## What was verified

| Check | Command | Result |
|---|---|---|
| Backend health | `curl .../api/v1/health` | `200 {"status":"ok","service":"cosmic-eye-api","version":"0.1.0"}` |
| Backend tests | `pytest -q` (in `backend/`) | 3 passed |
| Backend lint | `ruff check app tests` | All checks passed |
| Frontend typecheck | `npm run typecheck` | No errors |
| Frontend loads | open http://localhost:5173 | Dashboard renders, sidebar nav works |
| Vite proxy | page + `curl` on 8000 | `/api/*` reaches backend from frontend |
| Combined dev | `./scripts/dev.sh` | Both servers start, proxy works |
| Combined check | `./scripts/check.sh` | All green |
| `.gitignore` | `git status` | `.venv/`, `.env`, `node_modules/` not listed |

---

## How to run from clean checkout

Backend:
```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend (second terminal):
```bash
cd frontend
npm install
npm run dev
```

Or both at once: `./scripts/dev.sh`

Full checks: `./scripts/check.sh`

---

## Decisions made

1. **Dashboard Layout** — Navigation moved to a fixed left sidebar to match the
   "world monitor" aesthetic. Mobile falls back to top horizontal scroll.
2. **Vite dev proxy for `/api`** — frontend calls `/api/v1/...`;
   Vite forwards to `localhost:8000`. No CORS config needed in dev.
3. **ESLint deferred** — Stage 1 uses `tsc -b --noEmit` for type checking.
   ESLint/Prettier can be added in a polish stage; not blocking.
4. **SIP WCS confirmed in Stage 0** — Stage 4/5 reprojection must use SIP-aware
   handling (Astropy `WCS` or `reproject`), not simple shifts.
5. **Stage 0 evidence kept at `backend/stage0_*.py` and `backend/stage0_output/`**
   — not part of the app; not linted, not tested. Documents the verified data path.
6. **`.env` at `backend/.env`** — gitignored; `.env.example` at repo root documents
   variables. Defaults in `config.py` are safe for dev.

---

## Stage 0 evidence (context for Stage 2)

- IRSA SIA2 query works via `astroquery.ipac.irsa.Irsa.query_sia`.
- `collection='spherex_qr2'` returns 415 rows for a 1-arcsec cone at
  RA=304.69, Dec=42.44.
- Downloaded obs `2025W43_1A_0516_1`: 71 MB, band 5 (3.81–4.43 µm), 7 HDUs.
- HDUs: PRIMARY, IMAGE (2040×2040 f32), FLAGS (i32), VARIANCE (f32),
  ZODI (f32), PSF (121×101×101 f32), WCS-WAVE (bintable).
- WCS: `RA---TAN-SIP` / `DEC--TAN-SIP`, CRVAL=(302.85, 43.51).
- Column list from SIA2 (51 columns) captured in `backend/stage0_output/provenance.json`.
- Full provenance: `docs/data_provenance.md`.

---

## What's next — Stage 2 (Real data integration)

Goal: search and display actual IRSA observations end-to-end.

Planned deliverables:
- `backend/app/adapters/irsa_spherex.py` — encapsulate SIA2 query using real
  column names (`obs_id`, `obs_collection`, `access_url`, `em_min`, `em_max`,
  `t_min`, `t_max`, `calib_level`, `s_ra`, `s_dec`).
- `backend/app/services/archive_service.py` — orchestration + normalisation.
- `backend/app/schemas/observation.py` — Pydantic models for search input and
  observation output.
- `backend/app/api/observations.py` — `GET /api/v1/observations` with
  validated `ra`, `dec`, `radius`, `collection`, paging.
- `backend/app/utils/{errors,limits}.py` — consistent error shape and bounds.
- Tests: mocked SIA2 responses (VOTable fixtures), validation tests,
  timeout/error handling tests.
- Frontend: replace `ExplorePage.tsx` stub with search form + result list +
  loading/empty/error states.
- Source-link component showing official IRSA URL per result.

First action for Stage 2: run
`cd backend && python stage0_explore.py`
to record the SIA2 result structure (band/date distribution per `obs_id`)
before designing the grouping logic.

---

## Known limitations at Stage 1 exit

- `Explore`, `Compare`, `Find changes`, `Wavelengths`, `Learn` are stub pages.
- No live archive data is displayed in the UI yet. All real-data wiring is Stage 2.
- ESLint not configured (uses `tsc` only).
- No favicon, no PWA manifest (optional later).
- No Docker (intentional, matches handoff §7).
- No `npm test` script — frontend has no logic tests yet, only type-check.
  Vitest + Testing Library arrive when there is something worth testing.
