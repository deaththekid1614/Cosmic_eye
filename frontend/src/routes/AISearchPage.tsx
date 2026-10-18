import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchObservations } from '../api/observations';
import type { Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';
import ObservationViewer from '../components/ObservationViewer';
import ColorReferenceImage from '../components/ColorReferenceImage';
import { Sparkles, Loader2, Palette, AlertCircle } from 'lucide-react';
import { fetchJson } from '../api/client';

export default function AISearchPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Observation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);

  const [searchedObject, setSearchedObject] = useState<string | null>(null);
  const [resolvedCoords, setResolvedCoords] = useState<{ ra: number, dec: number } | null>(null);
  const [targetNote, setTargetNote] = useState<string | null>(null);
  const wavelengthBandCount = new Set(results.map((obs) => `${obs.wavelength_min_um}-${obs.wavelength_max_um}`)).size;

  const handleAiSearch = async () => {
    if (!query) return;
    document.querySelector<HTMLElement>('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true); setError(null); setResults([]); setSearchedObject(null); setResolvedCoords(null); setTargetNote(null);

    try {
      const coords = await fetchJson<{ ra: number, dec: number, matched_query: string, search_radius?: number, target_note?: string | null }>(`/api/v1/observations/ai-search?q=${encodeURIComponent(query)}`);
      setSearchedObject(coords.matched_query);
      setResolvedCoords({ ra: coords.ra, dec: coords.dec });
      setTargetNote(coords.target_note ?? null);

      try {
        const data = await searchObservations(coords.ra, coords.dec, coords.search_radius ?? 0.01);
        setResults(data.items);
        if (data.items.length === 0) {
          setError(`Found ${coords.matched_query}, but no SPHEREx observations are available for this sky area yet. Try again later or explore another target.`);
        }
      } catch (nasaErr: any) {
        setError(nasaErr.message || `AI found ${coords.matched_query}, but the NASA archive timed out. Please try again.`);
      }
    } catch (aiErr: any) {
      setError(`Could not resolve "${query}" to a sky position. Try a target such as "Milky Way", "Gaia BH3", "Orion", or "M31".`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <section style={{ flex: 1 }}>

        <div className="explore-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>AI Universe Search</h1>
            <p>Find known targets by name and explore the SPHEREx infrared observations near them.</p>
          </div>

          {resolvedCoords && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => navigate('/rgb', { state: { ra: resolvedCoords.ra, dec: resolvedCoords.dec } })}
                className="secondary-btn"
                style={{ borderColor: '#c084fc', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Palette size={16} /> Color Lab
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <div style={{ flex: 1, display: 'flex', background: 'var(--bg-panel)', border: '1px solid var(--accent-blue)', borderRadius: '8px', padding: '4px 16px', alignItems: 'center', boxShadow: '0 0 15px rgba(79, 140, 255, 0.15)' }}>
            <Sparkles size={18} color="var(--accent-blue)" />
            <input
              type="text"
              placeholder="Try ‘Milky Way’, ‘Gaia BH3’, ‘Orion’, or ‘M31’…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '16px', fontSize: '1.1rem', outline: 'none' }}
            />
            <button onClick={handleAiSearch} disabled={loading} style={{ background: 'var(--accent-blue)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              {loading ? <Loader2 size={18} className="spin" /> : 'Search AI'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ff8888', padding: '16px', background: 'rgba(255,100,100,0.1)', borderRadius: '8px', border: '1px solid rgba(255,100,100,0.3)', marginBottom: '16px' }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {searchedObject && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Observations for: {searchedObject}</h2>
            {resolvedCoords && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>RA: {resolvedCoords.ra.toFixed(3)}° Dec: {resolvedCoords.dec.toFixed(3)}°</span>}
          </div>
        )}

        {targetNote && (
          <div style={{ margin: '-4px 0 20px', padding: '14px 16px', borderRadius: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border-color, #26364c)', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            <span>{targetNote}</span>
            {searchedObject?.startsWith('Milky Way') && (
              <> <a href="https://www.jpl.nasa.gov/images/pia26600-spherexs-first-all-sky-map/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>View SPHEREx’s all-sky map</a>.</>
            )}
          </div>
        )}

        <ColorReferenceImage targetName={searchedObject} show={results.length > 0} />

        {results.length > 0 && (
          <p className="browse-note">{results.length} image tiles across {wavelengthBandCount} wavelength ranges. Each tile is a false-color infrared view; repeated scans can overlap and show similar structure.</p>
        )}

        <div className="results-grid">
          {results.map((obs) => (
            <div key={`${obs.id}-${obs.band}`} style={{ position: 'relative' }}>
              <ObservationCard observation={obs} onClick={() => setSelectedObs(obs)} />
              {obs.classification && (
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(77, 55, 116, 0.92)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(4px)', zIndex: 10, pointerEvents: 'none' }}>
                  {obs.classification}
                </div>
              )}
              <button
                type="button"
                className="color-lab-action"
                onClick={(event) => { event.stopPropagation(); navigate('/rgb', { state: { ra: obs.ra, dec: obs.dec, obsId: obs.id, wavelength: Number(((obs.wavelength_min_um + obs.wavelength_max_um) / 2).toFixed(2)) } }); }}
                aria-label={`Explore ${obs.id} in Color Lab`}
              >
                <Palette size={14} /> Color Lab
              </button>
            </div>
          ))}
        </div>
        {selectedObs && <ObservationViewer observation={selectedObs} onClose={() => setSelectedObs(null)} />}
      </section>
    </div>
  );
}
