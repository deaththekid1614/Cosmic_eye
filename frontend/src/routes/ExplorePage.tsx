import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { searchObservations } from '../api/observations';
import type { Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';
import ObservationViewer from '../components/ObservationViewer';

export default function ExplorePage() {
  const location = useLocation();
  
  // Default coordinates
  const [ra, setRa] = useState('304.69');
  const [dec, setDec] = useState('42.44');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Observation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);

  // If the user came from the Home page, pre-fill the coordinates!
  useEffect(() => {
    if (location.state?.ra && location.state?.dec) {
      setRa(location.state.ra);
      setDec(location.state.dec);
    }
  }, [location.state]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);

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
    <section>
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
    </section>
  );
}