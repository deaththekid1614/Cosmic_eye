# Stage 4 Handoff — Time Machine (Compare over time)

**Date:** (fill in)
**Status:** ✅ Complete
**Next:** `handoffs/stage5_handoff.md`

---

## Summary

Stage 4 introduced the "Time Machine," allowing users to select two different observations from the Explore page and compare them visually. 

To ensure scientific accuracy, a new backend endpoint was created to validate compatibility (checking spatial distance via Astropy and wavelength overlap). The frontend uses a global React Context to remember the user's selection across pages, and renders a custom, interactive Before/After image slider.

Additionally, a major CSS overhaul was applied to bring the entire application to a premium, "World Monitor" style dashboard aesthetic with glassmorphism, smooth hover states, and custom scrollbars.

---

## Files delivered

### Backend
- `app/schemas/analysis.py` (NEW) — `CompareRequest` and `CompareResponse` Pydantic models.
- `app/services/comparison_service.py` (NEW) — Uses `astropy.coordinates.SkyCoord` to calculate angular separation and checks for wavelength mismatches.
- `app/api/analysis.py` (NEW) — `POST /api/v1/analysis/compare` route.
- `app/api/__init__.py` — Registered the `analysis` router.

### Frontend
- `src/context/CompareContext.tsx` (NEW) — Global state managing `selectedObs` (max 2).
- `src/App.tsx` — Wrapped the app in `<CompareProvider>`.
- `src/types/analysis.ts` (NEW) — TypeScript types for the compare endpoint.
- `src/api/client.ts` — Updated `fetchJson` to accept `RequestInit` (for POST requests).
- `src/components/ObservationCard.tsx` — Added a "Compare" toggle button.
- `src/routes/ExplorePage.tsx` — Added the floating bottom action bar ("Go to Time Machine").
- `src/components/ImageSlider.tsx` (NEW) — Uses CSS `clip-path` and an invisible range input for the drag slider.
- `src/routes/ComparePage.tsx` — Fetches validation from the backend and renders the slider.
- `src/components/{ObservationViewer,AppHeader,Sidebar}.tsx` & `routes/HomePage.tsx` — Formatted with `import type` for strict TypeScript compliance.
- `src/styles/global.css` — Complete UI polish: glassmorphism, hover animations, clean inline slider styles, and custom scrollbar.

---

## What was verified

| Check | Result |
|---|---|
| **Backend Validation** | Passing different bands returns `warnings: ['Different wavelengths...']` |
| **Frontend Typecheck** | 0 errors (X 0) |
| **Selection Flow** | Clicking "Compare" on 2 cards highlights them and shows the floating bar. |
| **Slider UI** | Drag handle smoothly reveals Image B over Image A. |
| **Responsive** | The warning banner and floating bar adapt to screen widths. |

---

## Decisions made

1. **Astropy Spatial Check:** Instead of just trusting the frontend, the backend uses `SkyCoord.separation()` to calculate the exact angular distance between the two observations. If they are too far apart, it warns the user.
2. **Inline Styles for Slider:** The `ImageSlider` component uses React inline styles for its absolute positioning and `clip-path`. This prevents external CSS classes from accidentally breaking the overlapping layout.
3. **Strict `import type`:** TypeScript strict mode was failing on type-only imports (e.g., `FormEvent`, `Observation`). We fixed this by explicitly using `import type { ... }` across the codebase.

---

## Known limitations at Stage 4 exit

- **No Pixel Subtraction:** The Time Machine only lets you *visually* slide between the two images. It does not mathematically subtract the pixels to highlight the exact differences.
- **No Candidate Ranking:** We don't yet flag *where* the changes are happening.

---

## What's next — Stage 5 (Difference Analysis)

Goal: Create an interpretable candidate-change view.

Planned deliverables:
- **Backend Difference Service:** A new endpoint that downloads both FITS files, aligns them (using WCS), subtracts the pixel values, and returns a difference JPEG.
- **Candidate Detection:** Rank the regions with the highest pixel differences and return a list of coordinates/scores.
- **Frontend Difference Viewer:** A new mode in the Time Machine to toggle between "Swipe", "Blend", and "Difference".
- **Warning System:** Clear disclaimers that a difference could be an artifact, noise, or a real change.
