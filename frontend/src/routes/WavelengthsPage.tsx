import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { getWavelengthSets } from '../api/observations';
import type { WavelengthSet, BandDetail } from '../types/observation';
import { Activity, AlertCircle, Loader2 } from 'lucide-react';

export default function WavelengthsPage() {
  const location = useLocation();
  const [ra, setRa] = useState('304.69');
  const [dec, setDec] = useState('42.44');
  
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sets, setSets] = useState<WavelengthSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<WavelengthSet | null>(null);
  const [selectedBand, setSelectedBand] = useState<BandDetail | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchRa: string, searchDec: string) => {
    setLoading(true); setError(null); setHasSearched(true);
    setSets([]); setSelectedSet(null); setSelectedBand(null);

    try {
      const data = await getWavelengthSets(Number(searchRa), Number(searchDec), 0.01);
      setSets(data.sets);
      if (data.sets.length > 0) {
        setSelectedSet(data.sets[0]);
        setSelectedBand(data.sets[0].bands[0]);
        setImageLoading(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wavelength data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.ra && location.state?.dec) {
      setRa(location.state.ra);
      setDec(location.state.dec);
      handleSearch(location.state.ra, location.state.dec);
    }
  }, [location.state]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(ra, dec);
  };

  // Removed &wavelength= parameter
  const imageUrl = selectedBand 
    ? `http://localhost:8000/api/v1/observations/preview?url=${encodeURIComponent(selectedBand.source_url)}`
    : '';

  const handleBandChange = (band: BandDetail) => {
    if (band.wavelength_um !== selectedBand?.wavelength_um) {
      setImageLoading(true);
      setSelectedBand(band);
    }
  };

  const handleSetChange = (set: WavelengthSet) => {
    setSelectedSet(set);
    handleBandChange(set.bands[0]);
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      <div className="explore-header">
        <h1>Wavelength Explorer</h1>
        <p>Compare different wavelengths of the same region.</p>
      </div>

      <form onSubmit={onSubmit} className="search-form" style={{ marginBottom: '24px' }}>
        <div className="input-group"><label>RA (degrees)</label><input type="number" step="any" value={ra} onChange={(e) => setRa(e.target.value)} required /></div>
        <div className="input-group"><label>Dec (degrees)</label><input type="number" step="any" value={dec} onChange={(e) => setDec(e.target.value)} required /></div>
        <div className="form-actions"><button type="submit" className="glow-btn" disabled={loading} style={{ marginTop: 0, padding: '10px 24px', borderRadius: '8px' }}>{loading ? 'Searching...' : 'Find Wavelengths'}</button></div>
      </form>

      {error && <div style={{ color: '#ff8888', padding: '16px', background: 'rgba(255,100,100,0.1)', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      {!loading && hasSearched && sets.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 16px' }} />
          <h3>No multi-band observations found.</h3>
        </div>
      )}

      {selectedSet && selectedBand && (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', flex: 1, minHeight: 0 }}>
          
          {/* LEFT SIDE: BIG IMAGE + SLIDER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: 0 }}>
            
            <div style={{ flex: 1, position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {imageLoading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <Loader2 size={40} className="spin" color="var(--accent-blue)" />
                  <div style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: '0.9rem' }}>DOWNLOADING FROM NASA...</div>
                </div>
              )}
              <img 
                src={imageUrl} 
                alt={`Band ${selectedBand.band_name}`} 
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: imageLoading ? 0 : 1, transition: 'opacity 0.3s' }}
              />
              {!imageLoading && (
                <div className="wavelength-badge" style={{ display: 'flex', flexDirection: 'column', gap: '4px', bottom: '20px', left: '20px' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{selectedBand.wavelength_um} µm</span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>🧠 {selectedBand.classification}</span>
                </div>
              )}
            </div>

            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
              <input 
                type="range" 
                min="0" 
                max={selectedSet.bands.length - 1} 
                value={selectedSet.bands.findIndex(b => b.wavelength_um === selectedBand.wavelength_um)}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  handleBandChange(selectedSet.bands[idx]);
                }}
                style={{ width: '100%', cursor: 'ew-resize', height: '6px', borderRadius: '3px', appearance: 'auto', accentColor: 'var(--accent-blue)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>Shorter Wavelength (Stars)</span>
                <span>Longer Wavelength (Dust)</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: SIDEBAR WITH BANDS & OTHER OBSERVATIONS */}
          <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="wavelength-card" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', marginBottom: '8px' }}><Activity size={18} /> Available Bands</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Observation: {selectedSet.obs_id}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedSet.bands.map((band) => (
                  <button
                    key={band.wavelength_um}
                    onClick={() => handleBandChange(band)}
                    style={{
                      padding: '10px 16px', borderRadius: '8px', border: '1px solid',
                      borderColor: selectedBand.wavelength_um === band.wavelength_um ? 'var(--accent-blue)' : 'var(--border-color)',
                      background: selectedBand.wavelength_um === band.wavelength_um ? 'var(--accent-blue)' : 'var(--bg-card)',
                      color: selectedBand.wavelength_um === band.wavelength_um ? 'white' : 'var(--text-main)',
                      cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s'
                    }}
                  >
                    {band.wavelength_um} µm
                  </button>
                ))}
              </div>
            </div>

            <div className="wavelength-card" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Other Observations</h3>
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {sets.map((set) => (
                  <button
                    key={set.obs_id}
                    onClick={() => handleSetChange(set)}
                    style={{
                      padding: '12px', textAlign: 'left', borderRadius: '8px', border: '1px solid',
                      borderColor: selectedSet.obs_id === set.obs_id ? 'var(--accent-blue)' : 'var(--border-color)',
                      background: selectedSet.obs_id === set.obs_id ? 'rgba(79, 140, 255, 0.1)' : 'var(--bg-card)',
                      color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: selectedSet.obs_id === set.obs_id ? 'var(--accent-blue)' : 'var(--text-main)', fontSize: '0.9rem' }}>
                      {set.obs_id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {set.bands.length} bands available
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
