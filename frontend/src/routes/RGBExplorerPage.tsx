import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { getWavelengthSets } from '../api/observations';
import type { BandDetail, WavelengthSet } from '../types/observation';
import { Activity, AlertCircle, Loader2, Palette, Sparkles } from 'lucide-react';
import { observationPreviewUrl } from '../api/client';

const palettes = [
  { id: 'inferno', name: 'Inferno', hint: 'High contrast' },
  { id: 'viridis', name: 'Viridis', hint: 'Easy to read' },
  { id: 'plasma', name: 'Plasma', hint: 'Bright colors' },
  { id: 'cividis', name: 'Cividis', hint: 'Color-blind friendly' },
  { id: 'magma', name: 'Magma', hint: 'Soft contrast' },
];

export default function RGBExplorerPage() {
  const location = useLocation();
  const [ra, setRa] = useState('10.68');
  const [dec, setDec] = useState('41.27');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allBands, setAllBands] = useState<BandDetail[]>([]);
  const [sets, setSets] = useState<WavelengthSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<WavelengthSet | null>(null);
  const [selectedBand, setSelectedBand] = useState<BandDetail | null>(null);
  const [palette, setPalette] = useState('inferno');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchRa: string, searchDec: string, target?: { obsId?: string; wavelength?: number }) => {
    setLoading(true);
    setError(null);
    setImageError(false);
    setHasSearched(true);
    setAllBands([]);
    setSets([]);
    setSelectedSet(null);
    setSelectedBand(null);

    try {
      const data = await getWavelengthSets(Number(searchRa), Number(searchDec), 0.01);
      setAllBands(data.all_bands);
      setSets(data.sets);
      const firstSet = data.sets[0] ?? null;
      const chosenSet = target?.obsId ? data.sets.find((set) => set.obs_id === target.obsId) ?? firstSet : firstSet;
      const availableBands = chosenSet?.bands.length ? chosenSet.bands : data.all_bands;
      const selected = target?.wavelength != null && availableBands.length
        ? availableBands.reduce((closest, band) => Math.abs(band.wavelength_um - target.wavelength!) < Math.abs(closest.wavelength_um - target.wavelength!) ? band : closest)
        : availableBands[0] ?? null;
      setSelectedSet(chosenSet);
      setSelectedBand(selected);
      setImageLoading(Boolean(selected));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load observations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.ra != null && location.state?.dec != null) {
      setRa(location.state.ra);
      setDec(location.state.dec);
      handleSearch(location.state.ra, location.state.dec, { obsId: location.state.obsId, wavelength: location.state.wavelength });
    }
  }, [location.state]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleSearch(ra, dec);
  };

  const chooseBand = (band: BandDetail) => {
    setSelectedBand(band);
    setImageError(false);
    setImageLoading(true);
  };

  const previewUrl = selectedBand ? observationPreviewUrl(selectedBand.source_url, palette) : '';

  return (
    <section className="tool-page color-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      <div className="explore-header">
        <div>
          <span className="eyebrow">MAKE INFRARED DATA EASIER TO SEE</span>
          <h1>Color Lab</h1>
          <p>Choose a wavelength and a color palette. One image loads at a time.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="search-form color-search-form">
        <div className="input-group"><label htmlFor="color-ra">RA (degrees)</label><input id="color-ra" type="number" step="any" min="0" max="360" value={ra} onChange={(event) => setRa(event.target.value)} required /></div>
        <div className="input-group"><label htmlFor="color-dec">Dec (degrees)</label><input id="color-dec" type="number" step="any" min="-90" max="90" value={dec} onChange={(event) => setDec(event.target.value)} required /></div>
        <div className="form-actions"><button type="submit" className="glow-btn" disabled={loading}>{loading ? <><Loader2 size={16} className="spin" /> Searching…</> : <><Palette size={16} /> Find image</>}</button></div>
      </form>

      {error && <div className="status-message error" role="alert"><AlertCircle size={18} />{error}</div>}

      {!loading && hasSearched && !allBands.length && !error && (
        <div className="empty-state"><AlertCircle size={28} /><h2>No images found at these coordinates</h2><p>Try a nearby sky position or search for an object by name first.</p></div>
      )}

      {selectedBand && (
        <div className="tool-workspace color-workspace">
          <div className="color-main">
            <div className="color-image-frame">
              {imageLoading && <div className="color-image-loading"><Loader2 size={34} className="spin" /><span>Preparing this band…</span><small>The first view can take a little longer while the image is cached.</small></div>}
              {imageError ? <div className="color-image-error"><AlertCircle size={28} /><strong>Could not load this image</strong><span>Try another band or color palette.</span></div> : <img key={previewUrl} src={previewUrl} alt={`Infrared observation colored with ${palette}`} onLoad={() => setImageLoading(false)} onError={() => { setImageLoading(false); setImageError(true); }} className="color-image" />}
              <div className="image-signal-label"><span>LOWER SIGNAL</span><span>HIGHER SIGNAL</span></div>
            </div>

            <div className="color-controls-panel">
              <div className="color-control-heading"><div><h2><Sparkles size={18} /> Color palette</h2><p>These colors help show signal strength. They are not the object’s actual visible-light colors.</p></div></div>
              <div className="palette-options" role="group" aria-label="Choose color palette">
                {palettes.map((option) => <button key={option.id} type="button" className={`palette-option palette-${option.id}${palette === option.id ? ' selected' : ''}`} aria-pressed={palette === option.id} onClick={() => { setPalette(option.id); setImageError(false); setImageLoading(true); }}><span className="palette-swatch" /><span><strong>{option.name}</strong><small>{option.hint}</small></span></button>)}
              </div>
              <label className="band-select-label" htmlFor="color-band">Wavelength band</label>
              <select id="color-band" value={selectedBand.wavelength_um} onChange={(event) => { const band = allBands.find((item) => item.wavelength_um === Number(event.target.value)); if (band) chooseBand(band); }}>
                {allBands.map((band) => <option key={`${band.wavelength_um}-${band.source_url}`} value={band.wavelength_um}>{band.wavelength_um.toFixed(2)} µm · {band.classification}</option>)}
              </select>
              <p className="signal-explainer"><strong>How to read this:</strong> darker areas have a weaker measured signal; brighter areas have a stronger one. Changing the palette changes the display colors, not the data.</p>
            </div>
          </div>

          <aside className="tool-rail color-rail">
            <div className="wavelength-card color-queue">
              <h2><Activity size={18} /> Observation queue</h2>
              <p className="color-queue-note">Choose another scan from this sky region.</p>
              <div className="color-queue-list">
                {sets.map((set: WavelengthSet) => (
                  <button key={set.obs_id} type="button" className={`color-queue-item${selectedSet?.obs_id === set.obs_id ? ' selected' : ''}`} onClick={() => { setSelectedSet(set); if (set.bands[0]) chooseBand(set.bands[0]); }}>
                    <strong>{set.obs_id}</strong><span>{set.bands.length} wavelengths</span>
                  </button>
                ))}
                {!sets.length && <p className="color-queue-note">No multi-band scans found. You can still choose from all available wavelengths above.</p>}
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
