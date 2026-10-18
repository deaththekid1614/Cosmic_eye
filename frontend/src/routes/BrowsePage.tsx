import { useState } from 'react';
import { searchObservations } from '../api/observations';
import type { Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';
import ObservationViewer from '../components/ObservationViewer';
import { Calendar } from 'lucide-react';

export default function BrowsePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Observation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);

  const fetchRecent = async () => {
    setLoading(true);
    try {
      // Fetch a large chunk of the sky to find recent observations
      const data = await searchObservations(304.69, 42.44, 0.5, 1, 20);
      // Sort by date descending
      const sorted = data.items.sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime());
      setResults(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <section style={{ flex: 1 }}>
        <div className="explore-header">
          <div>
            <h1>Browse by Date</h1>
            <p>Find the most recent observations from the SPHEREx mission.</p>
          </div>
          <button onClick={fetchRecent} disabled={loading} className="glow-btn" style={{ padding: '10px 24px', borderRadius: '8px' }}>
            <Calendar size={16} style={{ marginRight: '8px' }} /> {loading ? 'Fetching...' : 'Load Recent Observations'}
          </button>
        </div>
        <div className="results-grid">
          {results.map((obs) => (
            <div key={`${obs.id}-${obs.band}`} onClick={() => setSelectedObs(obs)} style={{ cursor: 'pointer', position: 'relative' }}>
              <ObservationCard observation={obs} onClick={() => {}} />
              {obs.classification && (
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(168, 85, 247, 0.9)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(4px)', zIndex: 10 }}>
                  🧠 {obs.classification}
                </div>
              )}
            </div>
          ))}
        </div>
        {selectedObs && <ObservationViewer observation={selectedObs} onClose={() => setSelectedObs(null)} />}
      </section>
    </div>
  );
}
