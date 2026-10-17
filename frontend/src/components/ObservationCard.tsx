import type { Observation } from '../types/observation';

type Props = {
  observation: Observation;
  onClick: () => void;
};

export default function ObservationCard({ observation, onClick }: Props) {
  const date = new Date(observation.observed_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const previewUrl = `http://localhost:8000/api/v1/observations/preview?url=${encodeURIComponent(observation.source_url)}`;

  return (
    <div className="observation-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="obs-image-container">
        <img 
          src={previewUrl} 
          alt={`Observation ${observation.id}`} 
          loading="lazy" 
          className="obs-image"
        />
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
