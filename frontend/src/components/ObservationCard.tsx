import { Observation } from '../types/observation';

type Props = {
  observation: Observation;
};

export default function ObservationCard({ observation }: Props) {
  const date = new Date(observation.observed_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  // Construct the backend preview URL
  const previewUrl = `http://localhost:8000/api/v1/observations/preview?url=${encodeURIComponent(observation.source_url)}`;

  return (
    <div className="observation-card">
      {/* The new image section */}
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
          <a 
            href={observation.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="source-link"
          >
            View Raw Data on NASA ↗
          </a>
        </div>
      </div>
    </div>
  );
}
