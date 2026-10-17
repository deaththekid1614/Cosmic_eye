import { useState } from 'react';
import { searchObservations } from '../api/observations';
import { Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';

export default function ExplorePage() {
  const [ra, setRa] = useState('304.69');
  const [dec, setDec] = useState('42.44');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Observation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setResults([]); // Clear old results immediately

    try {
      // Force new fetch
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

      {!loading && hasSearched && results.length === 0 && !error && (
        <p>No observations found at this position. Try a different coordinate.</p>
      )}

      <div className="results-grid">
        {results.map((obs) => (
          <ObservationCard key={`${obs.id}-${obs.band}`} observation={obs} />
        ))}
      </div>
    </section>
  );
}