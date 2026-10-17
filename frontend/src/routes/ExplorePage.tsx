import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchObservations } from '../api/observations';
import type { Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';
import ObservationViewer from '../components/ObservationViewer';
import { useCompare } from '../context/CompareContext';
import { ArrowRight, X } from 'lucide-react';

export default function ExplorePage() {
  const [ra, setRa] = useState('304.69');
  const [dec, setDec] = useState('42.44');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Observation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const { selectedObs: compareList, clearSelection } = useCompare();
  const navigate = useNavigate();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    clearSelection();

    try {
      const data = await searchObservations(Number(ra), Number(dec), 0.01);
      setResults(data.items);
    } catch (err: any) {
      setError(err.message || 'Failed to search the NASA archive.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ paddingBottom: compareList.length > 0 ? '80px' : '0' }}>
      <div className="explore-header">
        <h1>Explore NASA SPHEREx</h1>
        <p>Search the IRSA archive for real infrared observations.</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="input-group">
          <label>RA (degrees)</label>
          <input type="number" step="any" value={ra} onChange={(e) => setRa(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Dec (degrees)</label>
          <input type="number" step="any" value={dec} onChange={(e) => setDec(e.target.value)} required />
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-action glow-btn" disabled={loading} style={{ marginTop: 0 }}>
            {loading ? 'Searching...' : 'Search Archive'}
          </button>
        </div>
      </form>

      {error && <div className="error-banner">{error}</div>}

      <div className="results-grid">
        {results.map((obs) => (
          <ObservationCard 
            key={`${obs.id}-${obs.band}`} 
            observation={obs} 
            onClick={() => setSelectedObs(obs)} 
          />
        ))}
      </div>

      {selectedObs && (
        <ObservationViewer 
          observation={selectedObs} 
          onClose={() => setSelectedObs(null)} 
        />
      )}

      {compareList.length > 0 && (
        <div className="floating-compare-bar">
          <div className="compare-info">
            <span>{compareList.length} observation{compareList.length > 1 ? 's' : ''} selected</span>
            {compareList.length === 1 && <span className="text-muted">Select one more to compare</span>}
          </div>
          <div className="compare-actions">
            <button className="secondary-btn" onClick={clearSelection}>
              <X size={16} /> Clear
            </button>
            <button 
              className="primary-action glow-btn" 
              disabled={compareList.length < 2}
              onClick={() => navigate('/compare')}
              style={{ marginTop: 0 }}
            >
              Go to Time Machine <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}