# Stage 3 Handoff — Viewer & Beginner UX

**Date:** (fill in)
**Status:** ✅ Complete
**Next:** `handoffs/stage4_handoff.md`

---

## Summary

Stage 3 transformed the Explore page from a simple grid of thumbnails into a fully interactive experience. 

To solve the severe performance bottleneck of downloading 71MB FITS files on every page load, we implemented **Disk Caching** on the backend. The first time an image is requested, it is downloaded from NASA, processed, and saved to disk. Every subsequent request for that image returns in milliseconds.

We also built a full-screen, interactive **Image Viewer** modal. Users can now click any observation card to open a zoomable/pannable view of the image, complete with a blurred background aesthetic, beginner-friendly explanations ("What am I seeing?"), and a structured technical metadata panel.

---

## Files delivered

### Backend
- `app/config.py` — Added `preview_cache_dir` setting.
- `app/services/preview_service.py` — Implemented MD5-based disk caching (`tmp/previews/`). Checks cache before downloading. Added ZODI background subtraction and `AsinhStretch`.
- `.gitignore` — Added `backend/tmp/` to prevent committing cached images.

### Frontend
- `package.json` & `tsconfig.json` — Installed `react-zoom-pan-pinch`, fixed TS build mode errors.
- `src/components/ObservationViewer.tsx` (NEW) — Full-screen modal with zoom/pan controls, blurred background, beginner help box, and metadata panel. Closes on `Escape` key.
- `src/components/ObservationCard.tsx` — Added `onClick` prop to trigger the viewer.
- `src/routes/ExplorePage.tsx` — Added state to manage the selected observation and render the viewer.
- `src/styles/global.css` — Added full styling for the viewer modal, blur effects, metadata lists, and zoom controls.

---

## What was verified

| Check | Result |
|---|---|
| **Caching Speed** | First run: ~179s. Second run: 0.0003s. |
| **Viewer Modal** | Opens on card click, closes on `X` or `Escape`. |
| **Zoom/Pan** | Mouse wheel zooms, drag pans, reset button works. |
| **Responsive UI** | Blurred background fills the container, image is centered. |
| **Metadata** | NASA source URL, RA/Dec, and Calibration level display correctly. |

---

## Decisions made

1. **Disk Caching:** Stored as JPEGs in `backend/tmp/previews/`. Keyed by MD5 hash of the FITS URL. Solves the performance bottleneck without needing a database (MVP-friendly).
2. **Blurred Background:** Instead of leaving black bars around the image (letterboxing), we stretch the same image, blur it heavily, and darken it behind the main image for a premium "Netflix" aesthetic.
3. **ZODI Subtraction:** The raw infrared images are full of zodiacal dust. We subtract `hdul[4].data` (the ZODI model) from the primary image before applying the colormap. This makes the stars pop.

---

## Known limitations at Stage 3 exit

- **No Object Name Search:** You can only search by RA/Dec coordinates. Typing "Orion" or "Andromeda" does not work yet (this requires a name resolver like Sesame).
- **No Side-by-Side Comparison:** The viewer only shows one image at a time.
- **No RGB Composites:** Images are single-band (heat map). True color requires combining 3 bands (planned for Stage 6).

---

## What's next — Stage 4 (Compare over time)

Goal: Select two observations and compare them side-by-side.

Planned deliverables:
- **Time Machine Page (`ComparePage.tsx`)**: A dedicated UI to select two `obs_id`s from a previous search.
- **Side-by-Side Viewer**: A dual-pane viewer that synchronizes zoom and pan between the two images.
- **Compatibility Validation**: Backend check to ensure the two observations are actually comparable (same WCS, same band, etc.) before allowing a comparison.
- **"Before/After" Slider**: An interactive slider to swipe between Image A and Image B.
