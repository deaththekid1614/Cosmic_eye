import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchObservations, getFeaturedTargets } from '../api/observations';
import type { FeaturedTarget, Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';
import ObservationViewer from '../components/ObservationViewer';
import PopularRegionCard from '../components/PopularRegionCard';
import { AlertCircle, Calendar, Loader2, Palette, Sparkles } from 'lucide-react';

type BrowseTab = 'regions' | 'recent';

export default function BrowsePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BrowseTab>('regions');
  const [regions, setRegions] = useState<FeaturedTarget[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Observation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeaturedTargets()
      .then(setRegions)
      .catch((err: unknown) => setRegionsError(err instanceof Error ? err.message : 'Could not load popular regions.'))
      .finally(() => setRegionsLoading(false));
  }, []);

  const fetchRecent = async () => {
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
  };

  return (
    <div className="dashboard-wrapper" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <section style={{ flex: 1 }}>
        <div className="explore-header">
          <div>
            <h1>Browse the sky</h1>
            <p>Explore real SPHEREx infrared images from well-known regions, or browse recent scans.</p>
          </div>
          {activeTab === 'recent' && (
            <button onClick={fetchRecent} disabled={loading} className="glow-btn" style={{ padding: '10px 24px', borderRadius: '8px' }}>
              {loading ? <Loader2 size={16} className="spin" /> : <Calendar size={16} />} {loading ? 'Loading…' : results.length ? 'Refresh observations' : 'Load observations'}
            </button>
          )}
        </div>

        <div className="browse-tabs" role="tablist" aria-label="Browse options">
          <button type="button" role="tab" aria-selected={activeTab === 'regions'} className={activeTab === 'regions' ? 'browse-tab active' : 'browse-tab'} onClick={() => setActiveTab('regions')}>
            <Sparkles size={17} /> Popular regions <span>{regions.length || '…'}</span>
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'recent'} className={activeTab === 'recent' ? 'browse-tab active' : 'browse-tab'} onClick={() => setActiveTab('recent')}>
            <Calendar size={17} /> Recent observations
          </button>
        </div>

        {activeTab === 'regions' ? (
          <>
            <p className="browse-note">Each thumbnail is generated from a real SPHEREx archive image. Select a region to open its observations and compare wavelength bands.</p>
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
            <p className="browse-note">Sorted newest first · Sample coordinates: RA 304.69°, Dec 42.44°</p>
            {error && <div className="status-message error" role="alert"><AlertCircle size={18} />{error}</div>}
            {!loading && !error && results.length === 0 && <div className="empty-state"><Calendar size={28} /><h2>Start with recent observations</h2><p>Load archive results for this sample region to open and inspect the available SPHEREx images.</p></div>}
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
            {selectedObs && <ObservationViewer observation={selectedObs} onClose={() => setSelectedObs(null)} />}
          </>
        )}
      </section>
    </div>
  );
}
