# Cosmic Eye — Architecture & Development Handoff

> **Project:** Cosmic Eye  
> **Challenge:** 2026 NASA Space Apps Challenge — “Planet X and SPHEREx”  
> **Document type:** Product definition, technical architecture, implementation plan, and team handoff  
> **Status:** Proposed architecture — validate data access and scientific assumptions during Stage 0  
> **Primary development machine:** MacBook Air 2015, Intel Core i5, 8 GB RAM, Zorin OS XFCE  
> **Platform goal:** A responsive web application that works across operating systems and modern browsers; Linux is a development environment only, not a product requirement.

---

## 1. Executive summary

**Cosmic Eye** is a public-facing web application that makes NASA SPHEREx observations easier for non-experts to explore. Users should be able to discover a region of the sky, view available observations, compare compatible images, inspect possible changes, and learn what the data does—and does not—tell them.

The app must be designed for ordinary people first. Astronomy terms should be explained in plain language, the first useful action should be obvious, and advanced details should be available when users want them without overwhelming beginners.

### One-sentence pitch

**Cosmic Eye turns real SPHEREx observations into an approachable, interactive sky explorer where anyone can compare what a region looks like and investigate what may have changed.**

### Product principles

1. **Real data before impressive claims.** Every observation shown as SPHEREx data must be traceable to an official source or a verified data product.
2. **Plain language by default.** Explain terms such as wavelength, infrared, coordinates, and image difference with short contextual help.
3. **Evidence before conclusions.** A highlighted difference is a *candidate change*, not automatically a moving object, new planet, or discovery.
4. **Progressive complexity.** Beginners see simple actions first; metadata and technical tools remain available in an advanced panel.
5. **Small, reliable, deployable scope.** Build a complete end-to-end path before adding ambitious features.
6. **Cross-platform by design.** The app runs in a browser. No Linux-specific commands, filesystem paths, or native dependencies may be required from end users.
7. **Lightweight development.** Keep the developer workflow practical on an 8 GB Intel laptop and avoid unnecessary services, containers, or large downloads.

---

## 2. Challenge context and scientific guardrails

The challenge asks for a public-facing web tool to display SPHEREx sky images and make changes over time easier to inspect. SPHEREx observes the sky in near-infrared light using spectral bands. Scientific products are released through the NASA/IPAC Infrared Science Archive (IRSA).

Official resources to consult during implementation:

- SPHEREx archive: https://irsa.ipac.caltech.edu/Missions/spherex.html
- SPHEREx data access documentation: https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/
- SPHEREx data products and release notes: https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-products/
- SPHEREx data tools: https://spherex.caltech.edu/page/data-tools
- SPHEREx mission overview: https://science.nasa.gov/mission/spherex/
- NASA FITS overview: https://science.data.nasa.gov/fits

### Important availability caveat

Do not assume every SPHEREx product is already released. Calibrated spectral images, all-sky data cubes, source catalogues, and specialized tools have different release schedules. Build against products that are actually available on the day of implementation. The archive documentation describes a Simple Image Access (SIA2) service for querying spectral images by constraints such as sky position, band, time, and observation ID. Confirm current endpoints, parameters, product availability, and terms in the official documentation before coding against them.

### Scientific guardrails

- A visual difference can arise from real source variability or motion, but also from image registration, detector artifacts, noise, background, calibration, saturation, or different observing conditions.
- Do not call a candidate “Planet X,” “a new planet,” or a confirmed discovery without appropriate independent scientific evidence.
- Never invent observation IDs, dates, wavelengths, coordinates, measurements, or NASA endorsements.
- UI mockups may use illustrative imagery, but illustrative data must be visibly labelled as such and must not be confused with a real SPHEREx result.
- Preserve data provenance: archive URL, observation identifier, product/version if available, access date, and relevant processing choices.
- Follow the data provider's attribution and usage guidance.

---

## 3. Product objectives

### Primary objective

Develop a responsive, accessible web app that helps the public explore available SPHEREx observations and understand how comparable observations differ across time or wavelength.

### Secondary objectives

1. Let a user start exploring without knowing astronomical coordinates.
2. Search and display observations using official archive data and metadata.
3. Present scientific images with sensible zoom, pan, loading, and error states.
4. Compare two compatible observations of the same region.
5. Generate a transparent difference view and, if feasible, a ranked list of candidate regions.
6. Explain what infrared light and wavelength bands mean in beginner-friendly language.
7. Make data source and uncertainty visible.
8. Work in modern browsers on Windows, macOS, Linux, ChromeOS, Android, and iOS, subject to normal browser support.

### Non-goals for the first release

- Discovering or proving the existence of Planet X.
- Processing the entire sky or billions of sources in real time.
- Training a large machine-learning model from scratch.
- Replacing the official IRSA archive or professional astronomy software.
- Requiring users to install Python, Node.js, or astronomy software.
- Creating accounts, social features, or a complex user database unless a concrete requirement emerges.
- Claiming that all 102 spectral channels are available in one ready-made all-sky cube at launch.

---

## 4. Target users and user experience

### User groups

- **Space-curious public:** wants to see and understand something interesting without technical knowledge.
- **Students:** wants to explore real observations and learn astronomy concepts.
- **Educators:** wants a simple demonstration tool.
- **Enthusiasts and advanced users:** wants access to observation metadata, coordinates, source links, and analysis details.
- **Researchers:** may use the app for quick-look exploration, not as a replacement for validated scientific analysis.

### The 10-second rule

A first-time user should understand within about ten seconds:
1. What Cosmic Eye does.
2. How to start exploring.
3. That the image is an observation of the sky.
4. Where to find a simple explanation.

### Plain-language vocabulary

Prefer:
- “Explore the sky” instead of “query the celestial archive.”
- “Compare dates” instead of “temporal comparison.”
- “Find possible changes” instead of “transient detection.”
- “Light wavelength” with a “What does this mean?” help link instead of unexplained spectral jargon.
- “Possible change” instead of “discovery.”
- “Sky position” with an optional advanced coordinate view.

### Proposed pages / navigation

1. **Home** — short explanation, featured exploration, “Start exploring” action.
2. **Explore** — search, popular regions or guided examples, filters, image viewer, simple details.
3. **Compare over time** — select two observations and compare them.
4. **Find changes** — display difference views and candidate regions with caveats.
5. **Explore wavelengths** — compare supported wavelength products or measurements.
6. **Learn** — concise guides to infrared light, wavelengths, observations, and uncertainty.
7. **About & sources** — project purpose, data provenance, limitations, acknowledgements, and challenge disclaimer.

### Interface requirements

- Dark space-inspired theme is acceptable, but text contrast and readability take priority over visual effects.
- Use large, clearly labelled controls and short descriptions.
- Do not rely on colour alone to communicate significance.
- Provide visible loading, empty, offline/error, and retry states.
- Use accessible names for icon-only controls.
- Keep mobile layouts usable: stack panels, preserve image controls, and avoid requiring horizontal scrolling.
- Include a “Beginner view” by default and an optional “Technical details” expansion.
- Every visualisation must have a short explanation and a data-source link.
- Do not use fabricated sample metadata in a production view.

---

## 5. Feature scope and priorities

### P0 — Required for a credible MVP

#### A. Home and onboarding
- Explain the product in a few sentences.
- Provide “Explore the sky” as the primary action.
- Include a short guided path or a known, verified example region if suitable data is available.
- Explain that the tool explores data; it does not certify discoveries.

#### B. Observation search and selection
- Query the official SPHEREx archive using a documented access method.
- Support a practical search such as sky position and an available date/band filter, subject to the service's supported parameters.
- Offer friendly search help and an advanced coordinate option.
- Show result metadata and a link to the official source.
- Handle no results, slow network, invalid coordinates, and archive failure gracefully.

#### C. Observation viewer
- Render a selected scientific image in the browser.
- Provide zoom, pan, reset view, and fit-to-screen.
- Show observation date, identifier, wavelength/band information where available, and source.
- Display a plain-language description.
- Keep scientific metadata available without crowding the main screen.

#### D. Comparison
- Let users select two observations that are suitable for comparison.
- Show them side by side or use a before/after slider.
- Synchronise zoom and pan where feasible.
- State clearly when observations are not directly comparable.
- If valid pairs cannot be found for the selected region, explain why rather than fabricating a comparison.

#### E. Provenance and accessibility
- Every real observation must have source information.
- Keyboard navigation and semantic labels for core controls.
- Responsive desktop, tablet, and mobile layouts.
- Useful empty, loading, and error states.

### P1 — Main differentiator

#### F. Difference image
- Compare compatible observations after validating and aligning them.
- Present a difference view using a scientifically appropriate method for the data.
- Allow toggling original A, original B, and difference.
- Show what processing was applied.
- Make clear that a difference is not automatically a physical event.

#### G. Candidate list
- Flag regions with strong differences using transparent, configurable criteria.
- Show coordinates or image position, score/measurement, and reason for flagging.
- Use labels such as “high-priority candidate,” never “confirmed discovery.”
- Explain possible artefacts and uncertainty.
- Include a route back to the original observations.

### P2 — Add only after the core workflow works

#### H. Wavelength explorer
- Compare only wavelength products that are truly available and comparable.
- Provide a simple explanation of how different wavelengths can reveal different features.
- Show a plot only when values and units support it; label axes and units.
- Avoid implying that a set of coloured preview images is a complete scientific spectrum.

#### I. Guided learning
- Short definitions, tooltips, and a few guided exploration steps.
- A “Why might this look different?” explanation.
- Glossary of infrared, wavelength, observation, calibration, image alignment, noise, and candidate.

#### J. Export / sharing
- Share a URL to a selected observation or comparison if the state can be represented safely in the URL.
- Optional export of a small preview and metadata summary, preserving attribution.
- Avoid bulk downloads in the MVP.

---

## 6. Recommended technical architecture

Use a small, separated frontend and backend. This provides a portable browser app while keeping scientific processing in Python.

### Architecture overview

```text
                         PUBLIC USER
                              |
                              v
                  Responsive browser interface
                     React + TypeScript
                              |
                     HTTPS JSON API calls
                              |
                              v
                   Python API (FastAPI)
                   /        |           \
                  /         |            \
                 v          v             v
          Search service  Metadata     Processing service
                 |                       |
                 v                       v
        Official IRSA/SPHEREx      Astropy / NumPy /
        documented archive API    SciPy / scikit-image
                 |                       |
                 v                       v
          Observation records      Preview / difference /
          and source URLs          candidate measurements
                 \                       /
                  \                     /
                   v                   v
                    API response / image assets
                              |
                              v
                  Browser viewer and explanations
```

### Component responsibilities

**Frontend**
- Navigation, onboarding, search forms, filters, observation cards.
- Image viewer and comparison controls.
- Beginner-friendly explanations and metadata panels.
- Error, loading, and empty states.
- Calls only the app's backend API for archive operations; do not embed secrets in frontend code.

**Backend API**
- Validates input and applies safe limits.
- Queries official archive endpoints.
- Normalises archive records into stable app-specific response objects.
- Retrieves selected products where permitted.
- Converts FITS image data into a browser-friendly preview format when necessary.
- Runs bounded image comparison tasks.
- Returns provenance and processing metadata.
- Handles timeouts, retries, and upstream service errors.

**Archive adapter**
- Encapsulates the documented IRSA/SPHEREx access method.
- Keeps provider-specific query parameters out of route handlers.
- Supports unit tests with mocked responses.
- Uses only public, documented access methods; do not scrape undocumented pages if an API exists.

**Image processing service**
- Reads supported FITS products with Astropy.
- Checks dimensions, units, WCS/coordinate metadata, masks, and relevant headers.
- Applies a documented display stretch for visual previews; do not silently change scientific values.
- Aligns images only when appropriate metadata and a valid method are available.
- Produces difference images only for compatible products.
- Returns warnings if products cannot be safely compared.

**Cache**
- Cache small search results and derived previews when sensible.
- Use bounded cache size and expiry.
- Cache keys must include query parameters and product/version identifiers.
- Do not assume that an archive result never changes.
- MVP can use an in-memory cache; this is intentionally simple and is cleared on restart. A persistent cache is optional later.

**Storage**
- No user database is required for the MVP.
- Avoid storing raw full-size science data locally unless necessary.
- Use a temporary directory with size limits for downloads and derived files.
- Delete temporary files after processing when safe.
- If a persistent cache is added, document where it lives and how to clear it.

### Why not make it Linux-specific?

The development machine's operating system affects only the developer setup. The finished product is a web application delivered over HTTP(S). End users need a supported browser and internet access, not Zorin OS, a terminal, Python, or Node.js. All system-specific instructions belong in development documentation, never in user-facing app behaviour.

---

## 7. Technology decisions

### Recommended stack

| Area | Choice | Reason |
|---|---|---|
| Frontend | React + TypeScript + Vite | Portable, well-supported browser app and clear component structure |
| Styling | CSS modules or a small utility CSS setup | Keep styling predictable and bundle small |
| Routing | React Router, if multiple routes are needed | Familiar navigation and URL state |
| Backend | Python + FastAPI | Good fit for data retrieval and scientific processing |
| Validation | Pydantic | Validate API input and response shapes |
| HTTP client | httpx | Timeouts and async requests to archive services |
| Astronomy data | Astropy | FITS and coordinate-aware scientific data support |
| Numerical work | NumPy | Array operations |
| Processing | SciPy and/or scikit-image | Add only where needed for alignment and image analysis |
| Archive query | PyVO or direct documented HTTP/SIA2 integration | Select after verifying the current API and simplest reliable route |
| Tests | pytest; frontend tests with Vitest and Testing Library | Catch regressions without a heavy workflow |
| Lint/format | Ruff; ESLint/Prettier | Consistent code |
| Version control | Git | Collaboration and rollback |
| Deployment | Static frontend host + Python API host | Separate frontend and backend, both accessible cross-platform |

### Avoid in the MVP

- Kubernetes, microservices, and complex cloud infrastructure.
- A database before we have a real need for persistent user data.
- A GPU or large AI model.
- Heavy desktop-only dependencies.
- A mandatory Docker setup on the development laptop. Docker may be documented as optional, but direct local setup should remain available.
- A third-party image source as a substitute for real SPHEREx data.

### Dependency discipline

Use a Python virtual environment and a locked or reproducible dependency file. Pin tested versions before submission. For the frontend, commit the package lockfile. Do not blindly install every suggested package; add a dependency only when a concrete feature needs it.

---

## 8. Proposed repository structure

```text
cosmic-eye/
├── README.md
├── architecture_handoff.md
├── LICENSE
├── .gitignore
├── .editorconfig
├── .env.example
├── docs/
│   ├── product_requirements.md
│   ├── data_provenance.md
│   ├── science_and_limitations.md
│   ├── api_contract.md
│   ├── testing_plan.md
│   ├── deployment.md
│   └── demo_script.md
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── routes/
│       │   ├── HomePage.tsx
│       │   ├── ExplorePage.tsx
│       │   ├── ComparePage.tsx
│       │   ├── ChangesPage.tsx
│       │   ├── WavelengthsPage.tsx
│       │   └── LearnPage.tsx
│       ├── components/
│       │   ├── AppHeader.tsx
│       │   ├── BeginnerHelp.tsx
│       │   ├── SearchPanel.tsx
│       │   ├── ObservationCard.tsx
│       │   ├── ObservationViewer.tsx
│       │   ├── MetadataPanel.tsx
│       │   ├── CompareViewer.tsx
│       │   ├── DifferenceViewer.tsx
│       │   ├── CandidateList.tsx
│       │   ├── LoadingState.tsx
│       │   ├── ErrorState.tsx
│       │   └── SourceLink.tsx
│       ├── api/
│       │   ├── client.ts
│       │   ├── observations.ts
│       │   └── analysis.ts
│       ├── types/
│       │   ├── observation.ts
│       │   └── analysis.ts
│       ├── utils/
│       │   ├── formatDate.ts
│       │   └── validation.ts
│       └── styles/
│           ├── tokens.css
│           └── global.css
├── backend/
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   ├── health.py
│   │   │   ├── observations.py
│   │   │   └── analysis.py
│   │   ├── schemas/
│   │   │   ├── observation.py
│   │   │   └── analysis.py
│   │   ├── services/
│   │   │   ├── archive_service.py
│   │   │   ├── fits_service.py
│   │   │   ├── preview_service.py
│   │   │   ├── comparison_service.py
│   │   │   └── candidate_service.py
│   │   ├── adapters/
│   │   │   └── irsa_spherex.py
│   │   └── utils/
│   │       ├── limits.py
│   │       └── errors.py
│   └── tests/
│       ├── test_health.py
│       ├── test_observation_validation.py
│       ├── test_archive_adapter.py
│       ├── test_fits_service.py
│       └── test_comparison_service.py
├── tests/
│   ├── fixtures/
│   │   ├── README.md
│   │   └── sample_metadata.json
│   └── e2e/
│       └── critical-user-journey.md
└── scripts/
    ├── dev.sh
    └── check.sh
```

Notes:
- This is the intended structure, not a claim that all files already exist.
- Avoid committing large FITS files or private data. Keep any small test fixture properly licensed, documented, and clearly separated from real archive content.
- `dev.sh` is a convenience script, not a requirement for end users. Provide equivalent manual commands in the README so the project is not shell-specific.
- Keep the spelling **Cosmic Eye** consistent in titles, package metadata, documentation, and UI.

---

## 9. API design (proposed contract)

The frontend should depend on a stable API contract, not directly on the archive's changing response format.

Prefix: `/api/v1`

### `GET /health`
Returns a simple status for deployment checks.

Example:
```json
{
  "status": "ok",
  "service": "cosmic-eye-api"
}
```

### `GET /observations`
Searches observations using supported filters. The exact parameter set must be mapped to the current documented archive API during Stage 0.

Proposed query parameters:
- `ra`: right ascension, if coordinate search is supported by the selected endpoint.
- `dec`: declination.
- `radius`: search radius with safe maximum.
- `start_date`, `end_date`: optional dates if supported.
- `band`: optional supported band constraint.
- `page`, `page_size`: app-level pagination and result limits.

Example response shape:
```json
{
  "items": [
    {
      "id": "archive-observation-id",
      "title": "SPHEREx observation",
      "observed_at": "archive-provided timestamp",
      "band": "archive-provided band metadata",
      "ra": null,
      "dec": null,
      "preview_url": null,
      "source_url": "official archive product URL",
      "product_version": null,
      "provenance": {
        "archive": "NASA/IPAC IRSA",
        "retrieved_at": "ISO-8601 timestamp"
      }
    }
  ],
  "page": 1,
  "page_size": 10,
  "has_more": false
}
```

These are **schema examples only**. The strings above are placeholders and must never be presented as real observations. Use actual provider values when integrating the archive.

### `GET /observations/{observation_id}`
Returns metadata for one validated observation, with source links and available preview/product references.

### `GET /observations/{observation_id}/preview`
Returns or redirects to a browser-friendly preview derived from the selected product. Response should include content type and caching policy. Large raw FITS files should not be sent to the browser as if they were ordinary images.

### `POST /analysis/compare`
Accepts two observation identifiers and a limited set of processing options. Backend must verify both identifiers, retrieve metadata, validate comparability, enforce download/processing limits, and return a result or a useful incompatibility reason.

Proposed request:
```json
{
  "observation_a_id": "real-archive-id-a",
  "observation_b_id": "real-archive-id-b",
  "mode": "difference"
}
```

Proposed response:
```json
{
  "status": "completed",
  "comparable": true,
  "preview_a_url": "/api/v1/...",
  "preview_b_url": "/api/v1/...",
  "difference_preview_url": "/api/v1/...",
  "method": "documented method name",
  "warnings": [],
  "provenance": {
    "observation_a": "real-archive-source-url",
    "observation_b": "real-archive-source-url"
  }
}
```

This is a proposed interface. Do not implement a `comparable: true` response until the validation and processing have genuinely succeeded.

### `GET /analysis/candidates`
Optional P1 endpoint. Returns candidate regions for a bounded selected dataset or pair of observations. Each candidate should include:
- stable identifier for the current result,
- image position and/or coordinates when available,
- measurement or transparent score,
- reason for flagging,
- quality flags and caveats,
- links to the original data.

### API rules

- Use explicit response schemas.
- Validate numeric inputs and reject invalid coordinates or unbounded radii.
- Set request timeouts and cap result counts.
- Return consistent error objects with a human-readable message and a stable error code.
- Do not leak local paths, tracebacks, credentials, or internal server details.
- Configure CORS narrowly for the deployed frontend origin.
- Never expose archive credentials or other secrets in frontend code.
- Keep provider-specific details in the archive adapter.
- Use rate limits or other reasonable safeguards if publicly deployed.

---

## 10. Data model and provenance

### Observation model

At minimum, normalise the following fields where the archive provides them:

- `id` — archive observation/product identifier.
- `title` — human-readable title.
- `observed_at` — observation time/date with timezone semantics preserved.
- `band` or wavelength metadata — exact provider representation and units.
- `ra`, `dec` — sky coordinates if supplied or reliably derived.
- `preview_url` — app-served preview or allowed provider preview.
- `source_url` — official archive page/product URL.
- `product_version` — release/version identifier if available.
- `instrument` — only if supplied by reliable metadata.
- `quality_flags` — relevant quality metadata where available.
- `retrieved_at` — when the app accessed the data.
- `processing_notes` — transformations used for the preview.

### Provenance display

The user should be able to open a “Source & details” panel and see:
- “Source: NASA/IPAC Infrared Science Archive (IRSA)” where accurate.
- The official source/product link.
- Observation identifier.
- Date and wavelength/band metadata from the product.
- Whether the displayed image is a processed preview.
- Any analysis performed by Cosmic Eye.
- Warnings about comparability or uncertainty.

Do not invent missing metadata. If a field is unavailable, omit it or label it “Not provided by the archive,” rather than filling it with a plausible guess.

---

## 11. Image processing and comparison design

This is the most scientifically sensitive subsystem. Build it incrementally and test each step.

### Step 1: Inspect a product
- Download only a small, selected public product.
- Read it using Astropy.
- Inspect HDUs, dimensions, headers, data units, masks, and WCS information.
- Record memory use and processing time.
- Confirm how the selected product maps pixels to sky coordinates and wavelength information.

### Step 2: Make a preview
- Apply a documented display stretch for human viewing.
- Handle NaN/invalid pixels and masks.
- Keep the scientific source values untouched.
- Include a note that display contrast is adjusted for viewing if applicable.
- Convert to a supported image format or serve a browser-safe tiled/preview representation if needed.

### Step 3: Decide if a pair is comparable
Before subtraction, validate at least:
- same sky area or a valid overlap,
- compatible pixel coordinate systems / WCS,
- dimensions and image registration,
- relevant units and calibration,
- wavelength/band compatibility for the intended comparison,
- masks, invalid pixels, and image quality,
- observation dates and product versions.

If these conditions cannot be established, do not generate a scientific difference product. Show a helpful explanation and allow side-by-side visual exploration instead.

### Step 4: Align and compare
- Use a documented alignment/reprojection method only when supported by metadata.
- Match scale and resolution when necessary.
- Apply appropriate masks and background handling.
- Avoid interpreting raw pixel subtraction as scientifically meaningful without validation.
- Create a difference preview and retain method/settings metadata.
- Add a warning that image differences can be instrumental or processing artefacts.

### Step 5: Candidate ranking
MVP candidate detection may use simple, transparent thresholds on a validated difference image. Record:
- detection threshold and relevant units,
- candidate measurement,
- quality filters,
- processing version,
- limitations and known false-positive sources.

Do not advertise a statistical confidence or “probability of discovery” unless a defensible statistical model has been developed and validated. A simple score should be called a **ranking score**, not a probability.

### Step 6: Validate with tests
- Use small, known test arrays to test difference calculations.
- Test NaNs and masks.
- Test images that should be rejected as incompatible.
- Test empty/no-difference cases.
- Keep a clear distinction between synthetic unit-test fixtures and real science observations.

---

## 12. Performance and memory constraints

The development laptop has 8 GB RAM and an Intel Core i5 from 2015. The application should be developed with this resource budget in mind.

### Development practices
- Start one backend and one frontend dev server only.
- Avoid running multiple heavy IDEs, notebooks, and browser profiles at the same time.
- Use small test observations and small cutouts before full-size products.
- Avoid holding multiple full-resolution FITS arrays in memory.
- Process one comparison at a time in the MVP.
- Release arrays and temporary files after processing.
- Do not download a whole archive or all-sky dataset.
- Use browser previews for UI work; keep scientific arrays in the backend.
- Use a virtual environment to isolate Python dependencies.
- Prefer local direct setup over requiring Docker.
- Keep image-processing jobs bounded by size and duration.

### Suggested safeguards
- Maximum archive result count per request.
- Maximum download size and image dimensions accepted by a processing job.
- Backend request timeout.
- Maximum concurrent comparison tasks: initially one or two, depending on measured memory.
- Temporary storage cleanup.
- Clear “This image is large; processing may take a moment” messages where relevant.

Measure actual resource use before choosing exact limits. Do not hard-code limits that cannot be justified by the product files and machine.

---

## 13. Cross-platform and browser compatibility

### Product compatibility target

The app must be a standard web app that works on modern browsers:
- Chrome and Edge on Windows.
- Safari and Chrome on macOS.
- Firefox and Chrome on Linux.
- Chrome on ChromeOS.
- Safari on iOS and Chrome on Android.

Support depends on current browser capabilities; test the critical flows on available browsers before release.

### Rules
- Use web standards, HTML, CSS, TypeScript/JavaScript, and HTTP(S).
- Do not use Linux-only APIs or paths in frontend code.
- Do not assume the user's home directory or filesystem structure.
- Do not require a terminal for end users.
- Use relative API paths or environment-based public API configuration.
- Handle network interruption and archive downtime.
- Make all essential features usable with a keyboard.
- Respect reduced-motion preferences; animations must not be required to understand a comparison.
- Provide responsive layouts for mobile, tablet, and desktop.
- Do not assume users have high bandwidth or powerful graphics hardware.
- Keep bundles and image previews reasonable.

### Local development is separate from end-user requirements

A developer needs Python and Node.js to build the project. An end user should need only a browser and internet access. Deployment should run the backend on a compatible host and serve the frontend as a standard web application.

---

## 14. Security, privacy, and reliability

The app does not need user accounts in the MVP, which reduces privacy and security complexity.

- Never commit `.env` secrets or API keys.
- Keep `.env.example` free of real credentials.
- Validate all user inputs and archive identifiers.
- Restrict upstream URLs to the intended archive hosts to reduce server-side request forgery risk.
- Do not let users supply arbitrary URLs for the backend to fetch.
- Use request timeouts, response-size limits, and bounded downloads.
- Escape user-controlled text in the UI.
- Keep CORS restricted to known origins in production.
- Do not log unnecessary personal data.
- Do not store user searches beyond what is required for the request.
- Handle upstream errors without exposing stack traces.
- Use HTTPS for deployment.
- Add attribution and licence/usage notes for any bundled assets.
- Keep dependency versions updated and scan for obvious known vulnerabilities if time permits.

---

## 15. Error handling and user states

Every core page needs these states:

1. **Initial:** explain what the user can do.
2. **Loading:** say what is loading and avoid indefinite spinners.
3. **Success:** show data and source.
4. **No results:** explain that no matching observations were found and suggest changing filters.
5. **Network/archive failure:** explain that the archive may be unavailable and provide retry.
6. **Invalid input:** identify the field and explain the expected format.
7. **Incompatible images:** explain why comparison cannot safely run; still offer separate viewing if possible.
8. **Partial metadata:** display available fields and label unavailable fields honestly.
9. **Processing failure:** offer a retry and preserve the selected observations.
10. **Illustrative demo mode:** visibly label all synthetic examples as demo/test data.

---

## 16. Testing and acceptance criteria

### Unit tests
- Input validation and coordinate bounds.
- Normalisation of archive responses.
- FITS parsing for the supported product types.
- Preview generation with invalid pixels.
- Difference calculations on small test arrays.
- Rejection of incompatible observations.
- Provenance fields remain attached to outputs.

### Integration tests
- Mock the archive service to test search results.
- Test timeout and malformed upstream responses.
- Test the backend preview route.
- Test comparison requests end to end with small test fixtures.
- Confirm errors do not leak file paths or tracebacks.

### Frontend tests
- Home page makes the next action obvious.
- Search form validates and displays errors.
- Observation cards display source metadata.
- Viewer controls have accessible labels.
- Comparison selection and result states work.
- Mobile layout does not hide essential actions.
- Empty, loading, and failure states are understandable.

### Manual test checklist
- Run the project from a clean checkout.
- Open the app in a browser.
- Search the archive for a small region.
- Open a returned observation.
- Confirm that metadata comes from the source.
- Try an invalid search.
- Try an empty result.
- Simulate network failure.
- Compare two compatible observations if available.
- Confirm the app refuses or warns on an incompatible pair.
- Test on a narrow mobile viewport.
- Verify all source links work.
- Verify no placeholder data is presented as real.
- Rehearse the demo from a clean browser session.

### MVP definition of done
The MVP is done only when:
- At least one real, currently available SPHEREx observation can be retrieved through the documented archive interface.
- The app displays it with source metadata.
- Users can understand the page without knowing astronomy jargon.
- A comparison path exists, with real compatible observations if available.
- If valid repeat observations cannot be obtained during the build window, the UI honestly explains the limitation and the comparison algorithm is tested separately using labelled synthetic fixtures.
- The deployed app loads on a non-Linux system/browser.
- A README provides clean setup and demo instructions.
- No fake discovery claims are made.

---

## 17. Staged development plan

The exact schedule depends on the hackathon deadline and team size. These are stages with exit criteria, not promises about hours.

### Stage 0 — Scope and data feasibility
**Goal:** Verify that the core idea is feasible with currently released products.

Tasks:
1. Read the current official data-access documentation.
2. Identify the documented query method and required parameters.
3. Find one small, available SPHEREx observation product.
4. Download and inspect it with Astropy.
5. Record product ID, date, band, dimensions, metadata, size, and source URL.
6. Check whether suitable observations for comparison exist for the same region.
7. Decide the smallest credible demo workflow.

Deliverables:
- `docs/data_provenance.md`
- A verified sample observation record
- A short data-feasibility note
- A go/no-go decision for real time comparison

Exit criteria:
- One real observation can be queried and read.
- Product availability and constraints are understood.
- The team knows whether real compatible pairs can be demonstrated.

### Stage 1 — Project skeleton and developer setup
**Goal:** Establish a clean, reproducible repository.

Tasks:
1. Create the repository and folders.
2. Set up Python virtual environment and frontend package.
3. Add lint/format/test commands.
4. Add `.env.example` and `.gitignore`.
5. Create a minimal frontend and FastAPI health route.
6. Document setup for Zorin OS and equivalent commands for other development systems.

Deliverables:
- Repository skeleton
- Frontend page loads locally
- Backend `/api/v1/health` responds
- Setup README

Exit criteria:
- A new checkout can be run using documented commands.
- No secrets or large data files are committed.

### Stage 2 — Real data integration
**Goal:** Search and display actual archive observations.

Tasks:
1. Implement the IRSA/SPHEREx adapter.
2. Validate search input.
3. Normalise archive responses.
4. Return a small page of observation results.
5. Show actual source metadata in the frontend.
6. Add timeouts, retries, and error messages.
7. Test using mocked archive responses as well as the live service.

Deliverables:
- Search endpoint
- Observation list UI
- Source and metadata panel
- Error/empty states

Exit criteria:
- A user can search and open one real observation without manually using the terminal.

### Stage 3 — Viewer and beginner UX
**Goal:** Make the first experience simple.

Tasks:
1. Build the central image viewer.
2. Add zoom, pan, reset, and fit controls.
3. Add a simple description and “What am I seeing?” help.
4. Add advanced metadata panel.
5. Add responsive layouts and keyboard labels.
6. Ensure image source and processing notes remain visible.

Deliverables:
- Usable Explore page
- Beginner view and technical details
- Responsive layout

Exit criteria:
- A first-time user can find and understand an observation without help.

### Stage 4 — Compare over time
**Goal:** Compare two observations responsibly.

Tasks:
1. Identify valid observation pairs.
2. Validate compatibility.
3. Add side-by-side view.
4. Add a before/after slider if time allows.
5. Synchronise zoom/pan where practical.
6. Explain the dates and any known differences in band/product.
7. Add clear “cannot compare safely” state.

Deliverables:
- Comparison page
- Compatibility checks
- Pair provenance and warnings

Exit criteria:
- A real compatible pair works, or the app honestly explains the lack of one and uses labelled fixtures only for algorithm tests.

### Stage 5 — Difference analysis
**Goal:** Create an interpretable candidate-change view.

Tasks:
1. Validate units, masks, alignment, and comparable data.
2. Implement a small and tested difference pipeline.
3. Produce a preview of the difference result.
4. Display the original images alongside the result.
5. Add a basic transparent candidate ranking.
6. Explain noise and artefacts.
7. Record processing settings and warnings.

Deliverables:
- Difference view
- Candidate list where valid
- Processing explanation

Exit criteria:
- The system can explain why a candidate was flagged and does not label it as a discovery.

### Stage 6 — Wavelength explorer and learning content
**Goal:** Add education and spectral context.

Tasks:
1. Verify what wavelength/band data is available for selected products.
2. Build a band selector only where the archive supports it.
3. Add simple plots when measurements and units are available.
4. Add concise educational cards and glossary.
5. Test that visual comparisons do not misrepresent the data.

Deliverables:
- Wavelength page
- Learn page
- Glossary and help text

Exit criteria:
- The educational content is accurate, plain-language, and linked to relevant sources.

### Stage 7 — Polish, deploy, and rehearse
**Goal:** Produce a stable public demonstration.

Tasks:
1. Fix critical bugs.
2. Test keyboard, mobile, and cross-browser behaviour.
3. Verify data provenance and attribution.
4. Configure frontend and backend deployment.
5. Set production CORS and environment variables.
6. Test the deployed API and live archive calls.
7. Record a backup demo video.
8. Prepare project summary, architecture diagram, known limitations, and demonstration script.

Deliverables:
- Public demo URL
- Final README and documentation
- Demo video/backup screenshots
- Tested submission narrative

Exit criteria:
- The critical journey works from a clean browser.
- The demo does not depend on a developer's local files or terminal.

### Suggested time-boxing for a short hackathon
Prioritise Stage 0, Stage 1, Stage 2, Stage 3, and a simple Stage 4. Add Stage 5 only after a real observation can be reliably displayed. Stages 6 and optional export are stretch goals. A functioning core beats incomplete breadth.

---

## 18. Team roles (adapt to actual team size)

For a small team, one person may own multiple areas.

### Product/science lead
- Keep the challenge requirements visible.
- Verify scientific wording and source data.
- Define acceptance criteria.
- Review candidate-change claims and limitations.

### Backend/data lead
- Implement archive access and API.
- Read FITS products and create previews.
- Build comparison pipeline and tests.

### Frontend/UX lead
- Build pages, viewer, search, and comparison controls.
- Keep language beginner-friendly and layout responsive.
- Check accessibility.

### Integration/demo lead
- Maintain README and architecture docs.
- Coordinate API contract and integration.
- Test deployment and prepare demo narrative.

For a solo or two-person team, merge roles and keep the MVP narrower.

---

## 19. Development setup on the specified MacBook

Machine: MacBook Air 2015, Intel Core i5, 8 GB RAM, running Zorin OS XFCE.

This is a development environment choice only. The app itself must remain operating-system independent.

### Prerequisites
- Git
- A currently supported Node.js LTS version compatible with the selected Vite release
- Python 3.11 or another version supported by the chosen scientific dependencies
- A modern browser
- Internet access to the official archive

Check installed versions:
```bash
git --version
node --version
npm --version
python3 --version
```

### Backend setup (example)
Run from the repository root:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

If a dependency fails to install on the laptop, check its supported Python version and wheel availability before attempting system-level changes. Do not use `sudo pip` to install project packages.

### Frontend setup (example)
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Use the local URL printed by Vite. The exact host/port may differ.

### Environment variables
Keep local configuration in `.env` files that are excluded by Git. Document variables in `.env.example`, such as:
- `IRSA_BASE_URL` — only if a configurable documented endpoint is needed.
- `FRONTEND_ORIGIN` — local or deployed frontend origin for CORS.
- `CACHE_TTL_SECONDS` — optional cache expiry.
- `MAX_RESULTS` — safe maximum result count.

Do not add secrets unless the selected service actually requires them. Never put private backend variables into the frontend's public build environment.

### Resource-saving habits
- Start with one observation/cutout.
- Do not download all data.
- Avoid simultaneous heavy notebook, IDE, and browser sessions.
- Keep temporary files out of the Git repository.
- Use small fixtures for automated tests.
- Avoid Docker unless a deployment or team requirement justifies it.

---

## 20. Configuration, deployment, and operations

### Local configuration
- Frontend uses a configurable API base URL or a same-origin `/api/v1` path.
- Backend reads configuration from environment variables.
- Local development should have clear CORS configuration.
- No user secrets should be necessary for public archive access unless official documentation says otherwise.

### Production layout
- Deploy the frontend to a static web host or equivalent.
- Deploy the Python API to a compatible host.
- Use HTTPS.
- Configure CORS to permit only the deployed frontend origin.
- Ensure temporary storage is writable and bounded.
- Confirm the host has enough memory and processing time for FITS handling.
- Verify upstream network access and timeouts.
- Use health checks and logs without sensitive data.

### Reliability strategy
- If the archive is down, show a useful error and retry option.
- Do not make the home page depend on a live archive request to render.
- Cache a small number of results/previews where appropriate.
- Do not pretend cached data is newly retrieved; display the retrieval/source date.
- Provide a known-good demo route only if its real data and provenance have been verified.

---

## 21. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Needed data product not released | Comparison feature cannot use intended product | Verify release schedule early; use available calibrated products and narrow the demo |
| No suitable repeat observations | No honest real-data before/after demo for selected region | Search for a suitable pair during Stage 0; fall back to real image browsing plus labelled test fixtures for pipeline tests |
| FITS products are large | Slow processing or memory exhaustion | Use small cutouts, bounded downloads, one job at a time, and previews |
| Images are not directly comparable | Misleading difference result | Validate WCS, units, calibration, band, masks, and overlap; refuse unsafe comparisons |
| Visual differences mistaken for discoveries | Scientific credibility problem | Plain-language warnings, transparent candidate labels, source links |
| Archive service is slow/unavailable | Demo may fail | Timeouts, graceful errors, small cache, backup recording |
| Team overbuilds | Core features remain unfinished | Strict P0/P1/P2 priorities and stage exit criteria |
| Interface too technical | Public users do not understand it | Beginner view, guided exploration, tooltips, usability testing |
| Laptop runs out of memory | Development stalls | Small products, bounded processing, avoid unnecessary containers and large datasets |
| Cross-platform bugs | App fails on some devices | Browser-based design, responsive testing, no OS-specific end-user assumptions |

---

## 22. Definition of success for the challenge

A strong submission should demonstrate:

1. **Direct relevance:** the app visibly addresses exploring SPHEREx images and understanding changes over time.
2. **Authentic data:** a real archive product is displayed with verifiable provenance.
3. **Usability:** a beginner can start without knowing astronomy terminology.
4. **Working core:** the viewer and comparison path actually function.
5. **Scientific responsibility:** candidates, limitations, and uncertainty are explained honestly.
6. **Accessibility:** usable layout and controls across common devices.
7. **Technical clarity:** modular architecture, documented API, tests, and reproducible setup.
8. **Presentation:** a short demo tells a clear story from search to observation to comparison to interpretation.

Do not claim official NASA endorsement. Describe Cosmic Eye as a team-built prototype for the NASA Space Apps Challenge.

---

## 23. Demo script outline

1. **Opening:** “Space telescopes collect enormous amounts of data. Cosmic Eye helps ordinary people explore SPHEREx observations without needing specialist software.”
2. **Search:** Show how to select a region or use a guided example.
3. **Explore:** Open a real observation and explain the image in plain language.
4. **Understand:** Open the details panel and show its official source, date, and available wavelength metadata.
5. **Compare:** Select another suitable observation and move between the two.
6. **Investigate:** Show a difference view or candidate region if scientifically valid.
7. **Explain:** State why the difference may be interesting and what uncertainty remains.
8. **Close:** “Cosmic Eye does not declare discoveries; it makes it easier for people to explore real data and decide what deserves closer investigation.”

If real compatible observations are unavailable during the event, say so plainly. Demonstrate the real-data viewer and explain that the comparison pipeline is being tested with clearly labelled fixtures rather than pretending synthetic results came from NASA.

---

## 24. Project decisions to keep stable

- Project name: **Cosmic Eye** (use this exact spelling unless the team explicitly changes it).
- Product type: public, responsive web application.
- Audience: non-experts first, with optional advanced details.
- Data source: official SPHEREx data available through IRSA.
- Frontend/backend separation: React + TypeScript frontend; Python + FastAPI backend.
- Core workflow: find observation → view and understand → compare suitable observations → investigate candidate changes.
- Scientific language: “possible change” or “candidate,” not “discovery.”
- Cross-platform: browser-based, not Linux-centric.
- Development constraints: 8 GB Intel laptop; start with small products and bounded processing.
- Priority: prove real data access before building elaborate UI or advanced analysis.

---

## 25. First 10 actions after opening this handoff

1. Create the `cosmic-eye` repository.
2. Add this file as `architecture_handoff.md`.
3. Read the official SPHEREx data-access guide and confirm the current SIA2/query method.
4. Retrieve one small real observation product and record its exact source and metadata.
5. Inspect the FITS structure with Astropy.
6. Check whether a suitable observation pair exists for the same region.
7. Create the FastAPI health route and React starter.
8. Connect the archive adapter to the backend and display one real result.
9. Build the beginner-friendly observation viewer.
10. Only after this works, implement comparison and difference analysis.

**Do not start by building the full dashboard. Start by proving that one real SPHEREx observation can travel from the official archive into Cosmic Eye and appear correctly in the browser.** That single end-to-end milestone validates the project's foundation.

---

## Appendix A — Source links

These official resources should be checked again during implementation because endpoints, product availability, and release notes can change.

- SPHEREx archive at IRSA: https://irsa.ipac.caltech.edu/Missions/spherex.html
- SPHEREx archive data access: https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/
- SPHEREx data products: https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-products/
- SPHEREx data tools: https://spherex.caltech.edu/page/data-tools
- SPHEREx data product overview: https://spherex.caltech.edu/page/data-products
- NASA SPHEREx mission: https://science.nasa.gov/mission/spherex/
- NASA FITS overview: https://science.data.nasa.gov/fits

## Appendix B — Terms in simple language

- **Observation:** Data collected by a telescope at a particular time.
- **Infrared light:** Light with wavelengths longer than visible light; it can reveal information not apparent in ordinary visible-light images.
- **Wavelength band:** A range of wavelengths being measured.
- **FITS:** A standard scientific file format used to store astronomical images, tables, and metadata.
- **Metadata:** Information about the data, such as date, instrument, coordinates, or units.
- **Coordinates:** A way to specify a location on the sky.
- **Image alignment:** Matching the same sky locations between two images before comparing them.
- **Difference image:** A visualisation of how two suitably comparable images differ after required processing.
- **Candidate:** A region flagged for closer inspection, not a confirmed astronomical discovery.
- **Provenance:** The record of where data came from and how it was processed.
- **Calibration:** Scientific correction that helps measurements represent the observed signal more accurately.
- **Artifact:** A feature introduced by the instrument, data processing, or noise rather than a real astronomical change.

