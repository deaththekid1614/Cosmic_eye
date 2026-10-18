import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchObservations, getFeaturedTargets } from '../api/observations';
import type { FeaturedTarget, Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';
import ObservationViewer from '../components/ObservationViewer';
import PopularRegionCard from '../components/PopularRegionCard';
import { AlertCircle, Calendar, Loader2, Palette } from 'lucide-react';

type BrowsePageProps = { mode?: 'recent' | 'regions' };

export default function BrowsePage({ mode = 'recent' }: BrowsePageProps) {
  const navigate = useNavigate();
  const [regions, setRegions] = useState<FeaturedTarget[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(mode === 'regions');
  const [regionsError, setRegionsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'recent');
  const [results, setResults] = useState<Observation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchObservations(304.69, 42.44, 0.5, 1, 20);
      const sorted = [...data.items].sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime());
      setResults(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load observations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'recent') {
      void fetchRecent();
      return;
    }

    getFeaturedTargets()
      .then(setRegions)
      .catch((err: unknown) => setRegionsError(err instanceof Error ? err.message : 'Could not load popular regions.'))
      .finally(() => setRegionsLoading(false));
  }, [fetchRecent, mode]);

  const isRegionsPage = mode === 'regions';

  return (
    <div className="dashboard-wrapper" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <section style={{ flex: 1 }}>
        <div className="explore-header">
          <div>
            <h1>{isRegionsPage ? 'Popular regions' : 'Latest SPHEREx observations'}</h1>
            <p>{isRegionsPage
              ? 'Explore well-known nebulae, galaxies, and other regions with SPHEREx archive coverage.'
              : 'Browse the newest SPHEREx scans returned for a sample region of the sky.'}</p>
          </div>
          {!isRegionsPage && (
            <button onClick={() => void fetchRecent()} disabled={loading} className="glow-btn" style={{ padding: '10px 24px', borderRadius: '8px' }}>
              {loading ? <Loader2 size={16} className="spin" /> : <Calendar size={16} />} {loading ? 'Loading…' : 'Refresh observations'}
            </button>
          )}
        </div>

        {isRegionsPage ? (
          <>
            <p className="browse-note">Select a region to search its location in the SPHEREx archive and inspect available images.</p>
            {regionsError && <div className="status-message error" role="alert"><AlertCircle size={18} />{regionsError}</div>}
            {regionsLoading && <div className="empty-state"><Loader2 size={26} className="spin" /><h2>Loading regions</h2><p>Getting the list of popular sky targets.</p></div>}
            {!regionsLoading && !regionsError && (
              <div className="browse-regions-grid">
                {regions.map((region) => <PopularRegionCard key={region.id} target={region} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="browse-note">Newest first · Sample field: RA 304.69°, Dec 42.44° · 0.5° search radius</p>
            {error && <div className="status-message error" role="alert"><AlertCircle size={18} />{error}</div>}
            {loading && <div className="empty-state"><Loader2 size={26} className="spin" /><h2>Loading recent observations</h2><p>Searching the SPHEREx archive for the latest scans in this field.</p></div>}
            {!loading && !error && results.length === 0 && <div className="empty-state"><Calendar size={28} /><h2>No observations found</h2><p>Try again later or explore a different sky position using Manual Search.</p></div>}
            {!loading && results.length > 0 && (
              <div className="results-grid">
                {results.map((obs) => (
                  <div key={`${obs.id}-${obs.band}`} style={{ position: 'relative' }}>
                    <ObservationCard observation={obs} onClick={() => setSelectedObs(obs)} />
                    <button
                      type="button"
                      className="color-lab-action"
                      onClick={(event) => { event.stopPropagation(); navigate('/rgb', { state: { ra: obs.ra, dec: obs.dec, obsId: obs.id, wavelength: Number(((obs.wavelength_min_um + obs.wavelength_max_um) / 2).toFixed(2)) } }); }}
                      aria-label={`Explore ${obs.id} in Color Lab`}
                    >
                      <Palette size={14} /> Color Lab
                    </button>
                    {obs.classification && <div className="observation-band-label">{obs.classification}</div>}
                  </div>
                ))}
              </div>
            )}
            {selectedObs && <ObservationViewer observation={selectedObs} onClose={() => setSelectedObs(null)} />}
          </>
        )}
      </section>
    </div>
  );
}
