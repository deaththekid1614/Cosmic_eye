import { useState } from 'react';
import type { FormEvent } from 'react';
import { getWavelengthSets } from '../api/observations';
import type { WavelengthSet, BandDetail } from '../types/observation';
import { Activity, AlertCircle, Search } from 'lucide-react';

export default function WavelengthsPage() {
  const [ra, setRa] = useState('304.69');
  const [dec, setDec] = useState('42.44');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sets, setSets] = useState<WavelengthSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<WavelengthSet | null>(null);
  const [selectedBand, setSelectedBand] = useState<BandDetail | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSets([]);
    setSelectedSet(null);
    setSelectedBand(null);

    try {
      const data = await getWavelengthSets(Number(ra), Number(dec), 0.01);
      setSets(data.sets);
      
      // Auto-select the first set and its first band
      if (data.sets.length > 0) {
        setSelectedSet(data.sets[0]);
        setSelectedBand(data.sets[0].bands[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wavelength data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetSelect = (set: WavelengthSet) => {
    setSelectedSet(set);
    setSelectedBand(set.bands[0]);
  };

  const imageUrl = selectedBand 
    ? `http://localhost:8000/api/v1/observations/preview?url=${encodeURIComponent(selectedBand.source_url)}`
    : '';

  return (
    <section>
      <div className="explore-header">
        <h1>Wavelength Explorer</h1>
        <p>See how the same region of space looks in different infrared bands.</p>
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
            {loading ? 'Searching...' : 'Find Wavelengths'}
          </button>
        </div>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {!loading && hasSearched && sets.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 16px' }} />
          <h3>No multi-band observations found.</h3>
          <p>Try a different coordinate or a larger search radius.</p>
        </div>
      )}

      {selectedSet && selectedBand && (
        <div className="wavelength-layout">
          
          {/* Main Image Viewer */}
          <div className="wavelength-viewer">
            <img src={imageUrl} alt={`Band ${selectedBand.band_name}`} />
            <div className="wavelength-badge">
              {selectedBand.band_name} (Center: {selectedBand.wavelength_um} µm)
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="wavelength-sidebar">
            
            <div className="wavelength-card">
              <h3><Activity size={18} /> Select an Observation</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                We found {sets.length} observations with multiple bands. Choose one:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {sets.map((set) => (
                  <button
                    key={set.obs_id}
                    onClick={() => handleSetSelect(set)}
                    style={{
                      padding: '12px', textAlign: 'left', borderRadius: '8px', border: '1px solid',
                      borderColor: selectedSet.obs_id === set.obs_id ? 'var(--accent-blue)' : 'var(--border-color)',
                      background: selectedSet.obs_id === set.obs_id ? 'rgba(79, 140, 255, 0.1)' : 'var(--bg-card)',
                      color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{set.obs_id}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {set.bands.length} bands available
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="wavelength-card">
              <h3>Available Bands</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {selectedSet.bands.map((band) => (
                  <button
                    key={band.band_name}
                    onClick={() => setSelectedBand(band)}
                    style={{
                      padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                      borderColor: selectedBand.band_name === band.band_name ? 'var(--accent-blue)' : 'var(--border-color)',
                      background: selectedBand.band_name === band.band_name ? 'var(--accent-blue)' : 'var(--bg-card)',
                      color: selectedBand.band_name === band.band_name ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
                    }}
                  >
                    {band.wavelength_um} µm
                  </button>
                ))}
              </div>
            </div>

            <div className="wavelength-card info">
              <h3>What am I seeing?</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                SPHEREx observes the sky in 102 different colors of infrared light. Short wavelengths (like 1.1 µm) reveal mostly starlight, while longer wavelengths (like 4.4 µm) reveal warm dust and glowing gas. Use the buttons above to explore how the image changes!
              </p>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}