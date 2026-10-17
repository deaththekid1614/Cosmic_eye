import { useEffect } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { X, ZoomIn, ZoomOut, Maximize, Info } from 'lucide-react';
import type { Observation } from '../types/observation';

type Props = {
  observation: Observation;
  onClose: () => void;
};

export default function ObservationViewer({ observation, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const previewUrl = `http://localhost:8000/api/v1/observations/preview?url=${encodeURIComponent(observation.source_url)}`;

  return (
    <div className="viewer-overlay">
      <div className="viewer-modal">
        <div className="viewer-header">
          <div>
            <h2>{observation.id}</h2>
            <span className="viewer-band">{observation.band}</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close viewer">
            <X size={24} />
          </button>
        </div>

        <div className="viewer-body">
          <div className="viewer-image-container">
            <div 
              className="viewer-background-blur" 
              style={{ backgroundImage: `url(${previewUrl})` }}
            />
            
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={10} centerOnInit={true}>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="zoom-controls">
                    <button onClick={() => zoomIn()} aria-label="Zoom in"><ZoomIn size={18}/></button>
                    <button onClick={() => zoomOut()} aria-label="Zoom out"><ZoomOut size={18}/></button>
                    <button onClick={() => resetTransform()} aria-label="Reset zoom"><Maximize size={18}/></button>
                  </div>
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <img src={previewUrl} alt={`Observation ${observation.id}`} className="viewer-image" />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>

          <div className="viewer-sidebar">
            <div className="help-box">
              <h3><Info size={16} /> What am I seeing?</h3>
              <p>This is an infrared image taken by the SPHEREx telescope. The bright spots are stars or galaxies. The dark areas are empty space. We have artificially colored the image so your eyes can see the differences in brightness.</p>
            </div>

            <div className="metadata-box">
              <h3>Technical Details</h3>
              <ul>
                <li><strong>Date:</strong> {observation.observed_at}</li>
                <li><strong>RA / Dec:</strong> {observation.ra.toFixed(3)}°, {observation.dec.toFixed(3)}°</li>
                <li><strong>Calibration:</strong> Level {observation.calib_level}</li>
                <li><strong>Collection:</strong> {observation.collection}</li>
              </ul>
              <a href={observation.source_url} target="_blank" rel="noreferrer" className="raw-data-link">
                Download Raw NASA Data (.fits) ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}