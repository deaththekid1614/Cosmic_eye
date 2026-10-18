import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchObservations } from '../api/observations';
import type { Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';
import ObservationViewer from '../components/ObservationViewer';
import { Activity, Sparkles, Loader2 } from 'lucide-react';
import { fetchJson } from '../api/client';

export default function ExplorePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasHandledState = useRef(false);
  
  const [query, setQuery] = useState('');
  const [ra, setRa] = useState('304.69');
  const [dec, setDec] = useState('42.44');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Observation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);

  useEffect(() => {
    const state = location.state as any;
    if (!state || hasHandledState.current) return;
    hasHandledState.current = true;

    if (state.ra && state.dec) {
      setRa(state.ra); setDec(state.dec);
      handleSearch(state.ra, state.dec);
    } else if (state.aiQuery) {
      setQuery(state.aiQuery);
      handleAiSearch(state.aiQuery);
    } else if (state.focusAI) {
      inputRef.current?.focus();
    } else if (state.random) {
      handleRandom();
    }
  }, [location.state]);

  const handleRandom = async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchJson<{ ra: number, dec: number }>('/api/v1/observations/random');
      setRa(data.ra.toString()); setDec(data.dec.toString());
      handleSearch(data.ra.toString(), data.dec.toString());
    } catch (err) {
      setError("Failed to generate random coordinates.");
      setLoading(false);
    }
  };

  const handleAiSearch = async (searchQuery: string) => {
    if (!searchQuery) return;
    setAiLoading(true); setError(null);
    try {
      const data = await fetchJson<{ ra: number, dec: number }>(`/api/v1/observations/ai-search?q=${encodeURIComponent(searchQuery)}`);
      setRa(data.ra.toString()); setDec(data.dec.toString());
      await handleSearch(data.ra.toString(), data.dec.toString());
    } catch (err: any) {
      setError(`Simbad could not find "${searchQuery}". Try a valid astronomical object like "Sirius" or "M31".`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearch = async (searchRa: string, searchDec: string) => {
    setLoading(true); setError(null); setResults([]);
    try {
      const data = await searchObservations(Number(searchRa), Number(searchDec), 0.01);
      setResults(data.items);
    } catch (err: any) {
      // Show the actual backend error instead of a generic 502
      setError(err.message || 'Failed to search the NASA archive.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(ra, dec);
  };

  return (
    <div className="dashboard-wrapper" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <section style={{ flex: 1 }}>
        <div className="explore-header">
          <div>
            <h1>Explore NASA SPHEREx</h1>
            <p>Search the IRSA archive or ask the global AI database.</p>
          </div>
          <button onClick={() => navigate('/wavelengths', { state: { ra, dec } })} className="secondary-btn" style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>
            <Activity size={16} /> View Wavelengths
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, display: 'flex', background: 'var(--bg-panel)', border: '1px solid var(--accent-blue)', borderRadius: '8px', padding: '4px 16px', alignItems: 'center', boxShadow: '0 0 15px rgba(79, 140, 255, 0.15)' }}>
            <Sparkles size={18} color="var(--accent-blue)" />
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Search ANY object in the universe (e.g. 'Sirius', 'M31')..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch(query)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px', fontSize: '1rem', outline: 'none' }}
            />
            <button onClick={() => handleAiSearch(query)} disabled={aiLoading} style={{ background: 'var(--accent-blue)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              {aiLoading ? <Loader2 size={16} className="spin" /> : 'AI Search'}
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="search-form" style={{ marginBottom: '24px' }}>
          <div className="input-group"><label>RA (degrees)</label><input type="number" step="any" value={ra} onChange={(e) => setRa(e.target.value)} required /></div>
          <div className="input-group"><label>Dec (degrees)</label><input type="number" step="any" value={dec} onChange={(e) => setDec(e.target.value)} required /></div>
          <div className="form-actions"><button type="submit" className="glow-btn" disabled={loading} style={{ marginTop: 0, padding: '10px 24px', borderRadius: '8px' }}>{loading ? 'Searching...' : 'Search Archive'}</button></div>
        </form>

        {error && <div style={{ color: '#ff8888', padding: '16px', background: 'rgba(255,100,100,0.1)', borderRadius: '8px', border: '1px solid rgba(255,100,100,0.3)', marginBottom: '16px', fontWeight: 500 }}>{error}</div>}

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
