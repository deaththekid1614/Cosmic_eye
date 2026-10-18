import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { searchObservations } from '../api/observations';
import { observationPreviewUrl } from '../api/client';
import type { FeaturedTarget, Observation } from '../types/observation';

export default function PopularRegionCard({ target }: { target: FeaturedTarget }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const started = useRef(false);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const loadPreview = () => {
      if (started.current) return;
      started.current = true;
      setLoading(true);
      searchObservations(target.ra, target.dec, 0.01, 1, 8)
        .then((data) => setObservations(data.items))
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));
    };

    if (!('IntersectionObserver' in window)) {
      loadPreview();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        loadPreview();
      }
    }, { rootMargin: '240px' });

    observer.observe(card);
    return () => observer.disconnect();
  }, [target.ra, target.dec]);

  const preview = observations[previewIndex];
  const hasPreviewFailed = failed || (!loading && observations.length === 0);

  return (
    <Link
      ref={cardRef}
      to="/explore"
      state={{ ra: target.ra.toString(), dec: target.dec.toString(), targetName: target.name }}
      className="browse-region-card"
      aria-label={`Open real SPHEREx observations of ${target.name}`}
    >
      <div className="browse-region-image-wrap">
        {preview ? (
          <img
            key={preview.source_url}
            src={observationPreviewUrl(preview.source_url)}
            alt={`SPHEREx infrared ${preview.band} preview near ${target.name}`}
            className="browse-region-image"
            loading="lazy"
            onError={() => {
              if (previewIndex + 1 >= observations.length) setFailed(true);
              setPreviewIndex((index) => index + 1);
            }}
          />
        ) : (
          <div className="browse-region-image-state">
            {loading ? <Loader2 size={24} className="spin" /> : <span>{hasPreviewFailed ? 'SPHEREx preview unavailable' : 'Loading SPHEREx preview…'}</span>}
          </div>
        )}
        {preview && <span className="browse-region-band">SPHEREx · {preview.band}</span>}
        <span className="browse-region-live">NASA archive image</span>
      </div>
      <div className="browse-region-copy">
        <span className="browse-region-type">{target.type}</span>
        <h2>{target.name}</h2>
        <p>{target.description}</p>
        <span className="browse-region-action">View observations <ArrowRight size={15} /></span>
      </div>
    </Link>
  );
}
