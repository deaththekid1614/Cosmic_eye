import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchObservations } from '../api/observations';
import type { Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';
import ObservationViewer from '../components/ObservationViewer';
import { Calendar, Palette } from 'lucide-react';

export default function BrowsePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Observation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const data = await searchObservations(304.69, 42.44, 0.5, 1, 20);
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
            <div key={`${obs.id}-${obs.band}`} style={{ position: 'relative' }}>
              <div onClick={() => setSelectedObs(obs)} style={{ cursor: 'pointer' }}>
                <ObservationCard observation={obs} onClick={() => {}} />
              </div>
              {/* True Color Button Overlay */}
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/rgb', { state: { ra: obs.ra, dec: obs.dec } }); }}
                style={{
                  position: 'absolute', bottom: '16px', right: '16px',
                  background: 'rgba(168, 85, 247, 0.9)', color: 'white',
                  padding: '6px 12px', borderRadius: '6px', border: 'none',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', zIndex: 20
                }}
              >
                <Palette size={14} /> True Color
              </button>
              
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