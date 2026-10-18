import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { getWavelengthSets } from '../api/observations';
import type { BandDetail, WavelengthSet } from '../types/observation';
import { Loader2, AlertCircle, Sparkles, Activity } from 'lucide-react';
import ImageSlider from '../components/ImageSlider';

export default function RGBExplorerPage() {
  const location = useLocation();
  const [ra, setRa] = useState('10.68');
  const [dec, setDec] = useState('41.27');
  
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [allBands, setAllBands] = useState<BandDetail[]>([]);
  const [sets, setSets] = useState<WavelengthSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<WavelengthSet | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchRa: string, searchDec: string) => {
    setLoading(true); setError(null); setHasSearched(true);
    setAllBands([]); setSets([]); setSelectedSet(null);

    try {
      const data = await getWavelengthSets(Number(searchRa), Number(searchDec), 0.01);
      setAllBands(data.all_bands);
      setSets(data.sets);
      
      if (data.all_bands.length >= 3) {
        setImageLoading(true);
      }
      if (data.sets.length > 0) {
        setSelectedSet(data.sets[0]);
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

  const hasEnoughBands = allBands.length >= 3;

  // Base image uses the selected observation's first band, falling back to the global first band
  const currentBaseUrl = selectedSet?.bands[0]?.source_url || allBands[0]?.source_url;
  
  const singleUrl = currentBaseUrl
    ? `http://localhost:8000/api/v1/observations/preview?url=${encodeURIComponent(currentBaseUrl)}`
    : '';

  const rgbUrl = hasEnoughBands
    ? `http://localhost:8000/api/v1/observations/preview/rgb?url1=${encodeURIComponent(allBands[0].source_url)}&url2=${encodeURIComponent(allBands[Math.floor(allBands.length/2)].source_url)}&url3=${encodeURIComponent(allBands[allBands.length-1].source_url)}`
    : '';

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      <div className="explore-header">
        <h1>True-Color Reveal</h1>
        <p>Drag the slider to reveal the hidden RGB colors of the universe.</p>
      </div>

      <form onSubmit={onSubmit} className="search-form" style={{ marginBottom: '24px' }}>
        <div className="input-group"><label>RA (degrees)</label><input type="number" step="any" value={ra} onChange={(e) => setRa(e.target.value)} required /></div>
        <div className="input-group"><label>Dec (degrees)</label><input type="number" step="any" value={dec} onChange={(e) => setDec(e.target.value)} required /></div>
        <div className="form-actions"><button type="submit" className="glow-btn" disabled={loading} style={{ marginTop: 0, padding: '10px 24px', borderRadius: '8px' }}>{loading ? 'Searching...' : 'Generate RGB'}</button></div>
      </form>

      {error && <div style={{ color: '#ff8888', padding: '16px', background: 'rgba(255,100,100,0.1)', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      {!loading && hasSearched && !hasEnoughBands && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 16px' }} />
          <h3>Not enough bands to create a True-Color image.</h3>
          <p>We need at least 3 different wavelengths from NASA to map to Red, Green, and Blue.</p>
        </div>
      )}

      {hasEnoughBands && (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', flex: 1, minHeight: 0 }}>
          
          {/* LEFT SIDE: SLIDER & INFO */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
            
            <div style={{ flex: 1, position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imageLoading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <Loader2 size={40} className="spin" color="var(--accent-blue)" />
                  <div style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: '0.9rem', textAlign: 'center' }}>
                    DOWNLOADING 3 FILES FROM NASA...<br/>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Takes ~1 min the first time, instant after)</span>
                  </div>
                </div>
              )}
              
              <div style={{ width: '100%', height: '100%', maxWidth: '800px', maxHeight: '600px', margin: '0 auto' }}>
                <ImageSlider 
                  baseUrl={singleUrl} 
                  overlayUrl={rgbUrl} 
                  onImageLoad={() => setImageLoading(false)}
                />
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-main)' }}>
                  <Sparkles size={18} color="var(--accent-blue)" /> True-Color Composite
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Combining shortest (Blue), middle (Green), and longest (Red) wavelengths.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[allBands[0], allBands[Math.floor(allBands.length/2)], allBands[allBands.length-1]].map((b, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {b.wavelength_um} µm
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: OBSERVATION QUEUE */}
          <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="wavelength-card" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', marginBottom: '12px' }}>
                <Activity size={18} /> Observation Queue
              </h3>
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {sets.map((set) => (
                  <button
                    key={set.obs_id}
                    onClick={() => {
                      setSelectedSet(set);
                      setImageLoading(true);
                    }}
                    style={{
                      padding: '12px', textAlign: 'left', borderRadius: '8px', border: '1px solid',
                      borderColor: selectedSet?.obs_id === set.obs_id ? 'var(--accent-blue)' : 'var(--border-color)',
                      background: selectedSet?.obs_id === set.obs_id ? 'rgba(79, 140, 255, 0.1)' : 'var(--bg-card)',
                      color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: selectedSet?.obs_id === set.obs_id ? 'var(--accent-blue)' : 'var(--text-main)', fontSize: '0.9rem' }}>
                      {set.obs_id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {set.bands.length} bands in this scan
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