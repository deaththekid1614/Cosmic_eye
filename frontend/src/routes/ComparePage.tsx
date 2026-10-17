import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import ImageSlider from '../components/ImageSlider';
import { fetchJson } from '../api/client';
import type { CompareResponse } from '../types/analysis';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function ComparePage() {
  const { selectedObs } = useCompare();
  const [validation, setValidation] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedObs.length === 2) {
      setLoading(true);
      fetchJson<CompareResponse>('/api/v1/analysis/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observation_a: selectedObs[0],
          observation_b: selectedObs[1],
        }),
      })
        .then((data) => setValidation(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [selectedObs]);

  if (selectedObs.length < 2) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1>Time Machine</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          You need to select exactly two observations to compare.
        </p>
        <Link to="/explore" className="primary-action glow-btn">
          <ArrowLeft size={18} style={{ marginRight: '8px' }}/> Go back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="explore-header">
        <h1>Time Machine</h1>
        <p>Drag the slider left and right to compare the two observations.</p>
      </div>

      {loading && <p style={{ color: 'var(--accent-blue)' }}>Validating data compatibility...</p>}

      {validation && validation.warnings.length > 0 && (
        <div style={{ 
          display: 'inline-flex', alignItems: 'flex-start', gap: '10px',
          background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)',
          padding: '12px 16px', borderRadius: '8px', color: '#f97316',
          marginBottom: '24px', maxWidth: '800px'
        }}>
          <AlertCircle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem' }}>
            <strong>Heads up:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
              {validation.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      <ImageSlider obsA={selectedObs[0]} obsB={selectedObs[1]} />
    </div>
  );
}