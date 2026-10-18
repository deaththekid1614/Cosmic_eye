import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchObservations } from '../api/observations';
import type { Observation } from '../types/observation';
import ObservationCard from '../components/ObservationCard';
import ObservationViewer from '../components/ObservationViewer';
import { Sparkles, Loader2, Activity } from 'lucide-react';
import { fetchJson } from '../api/client';

export default function AISearchPage() {
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Observation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [searchedObject, setSearchedObject] = useState<string | null>(null);
  
  // Store the coords found by the AI so we can pass them to Wavelengths
  const [resolvedCoords, setResolvedCoords] = useState<{ ra: number, dec: number } | null>(null);

  const handleAiSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSearchedObject(null);
    setResolvedCoords(null);
    
    try {
      // 1. AI resolves the name to coordinates
      const coords = await fetchJson<{ ra: number, dec: number, matched_query: string }>(`/api/v1/observations/ai-search?q=${encodeURIComponent(query)}`);
      setSearchedObject(coords.matched_query);
      setResolvedCoords({ ra: coords.ra, dec: coords.dec });
      
      // 2. Fetch the actual SPHEREx data for those coordinates
      const data = await searchObservations(coords.ra, coords.dec, 0.01);
      setResults(data.items);
    } catch (err: any) {
      setError(`Simbad AI could not find "${query}". Try "Andromeda" or "Orion".`);
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
            <p>Type the name of any object in the known universe.</p>
          </div>
          
          {/* New Wavelength Button (Only shows if AI found coordinates) */}
          {resolvedCoords && (
            <button 
              onClick={() => navigate('/wavelengths', { state: { ra: resolvedCoords.ra, dec: resolvedCoords.dec } })}
              className="secondary-btn" 
              style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Activity size={16} /> View Wavelengths for this Object
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <div style={{ flex: 1, display: 'flex', background: 'var(--bg-panel)', border: '1px solid var(--accent-blue)', borderRadius: '8px', padding: '4px 16px', alignItems: 'center', boxShadow: '0 0 15px rgba(79, 140, 255, 0.15)' }}>
            <Sparkles size={18} color="var(--accent-blue)" />
            <input 
              type="text" 
              placeholder="E.g., 'Sirius', 'Whirlpool Galaxy', 'M87'..." 
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
        
        {error && <div style={{ color: '#ff8888', padding: '16px', background: 'rgba(255,100,100,0.1)', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
        
        {searchedObject && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Observations for: {searchedObject}</h2>
            {resolvedCoords && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>RA: {resolvedCoords.ra.toFixed(3)}° Dec: {resolvedCoords.dec.toFixed(3)}°</span>}
          </div>
        )}
        
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
