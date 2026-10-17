import type { MouseEvent } from 'react';
import type { Observation } from '../types/observation';
import { useCompare } from '../context/CompareContext';
import { CheckCircle, Circle } from 'lucide-react';

type Props = {
  observation: Observation;
  onClick: () => void;
};

export default function ObservationCard({ observation, onClick }: Props) {
  const { selectedObs, toggleObservation } = useCompare();
  
  const isSelected = selectedObs.some(
    (o) => o.id === observation.id && o.band === observation.band
  );

  const date = new Date(observation.observed_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const previewUrl = `http://localhost:8000/api/v1/observations/preview?url=${encodeURIComponent(observation.source_url)}`;

  const handleCompareClick = (e: MouseEvent) => {
    e.stopPropagation();
    toggleObservation(observation);
  };

  return (
    <div 
      className={`observation-card ${isSelected ? 'selected' : ''}`} 
      onClick={onClick} 
      style={{ cursor: 'pointer' }}
    >
      <div className="obs-image-container">
        <img 
          src={previewUrl} 
          alt={`Observation ${observation.id}`} 
          loading="lazy" 
          className="obs-image"
        />
        
        <button 
          className={`compare-toggle-btn ${isSelected ? 'active' : ''}`}
          onClick={handleCompareClick}
          aria-label="Select for comparison"
          title="Select for Time Machine"
        >
          {isSelected ? <CheckCircle size={20} /> : <Circle size={20} />}
          <span>Compare</span>
        </button>

        <div className="obs-badge">{observation.band}</div>
      </div>

      <div className="obs-content">
        <div className="obs-header">
          <h3>{observation.id}</h3>
          <span className="obs-date">{date}</span>
        </div>
        
        <p className="obs-position">RA {observation.ra.toFixed(2)}°, Dec {observation.dec.toFixed(2)}°</p>

        <div className="obs-footer">
          <span className="source-link">Click to view full image →</span>
        </div>
      </div>
    </div>
  );
}