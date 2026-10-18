import { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { X, ZoomIn, ZoomOut, Maximize, Info } from 'lucide-react';
import type { Observation } from '../types/observation';
import { observationPreviewUrl } from '../api/client';

type Props = {
  observation: Observation;
  onClose: () => void;
};

export default function ObservationViewer({ observation, onClose }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const previewUrl = observationPreviewUrl(observation.source_url);

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
            {!imageFailed && <div className="viewer-background-blur" style={{ backgroundImage: `url(${previewUrl})` }} />}
            
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={10} centerOnInit={true}>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="zoom-controls">
                    <button onClick={() => zoomIn()} aria-label="Zoom in"><ZoomIn size={18}/></button>
                    <button onClick={() => zoomOut()} aria-label="Zoom out"><ZoomOut size={18}/></button>
                    <button onClick={() => resetTransform()} aria-label="Reset zoom"><Maximize size={18}/></button>
                  </div>
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    {!imageFailed ? (
                      <img src={previewUrl} alt={`Infrared preview of observation ${observation.id}`} className="viewer-image" onError={() => setImageFailed(true)} />
                    ) : (
                      <div className="viewer-preview-fallback">
                        <Info size={24} />
                        <strong>Preview could not be generated</strong>
                        <span>The NASA source file is still available in the observation details.</span>
                      </div>
                    )}
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>

          <div className="viewer-sidebar">
            <div className="help-box">
              <h3><Info size={16} /> What am I seeing?</h3>
              <p>SPHEREx measures infrared light, which human eyes cannot see. This preview maps signal strength to visible colors; the colors are not the object’s true visible-light colors. Brightness and structure can change between wavelength bands.</p>
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
                Open NASA source data (.fits) ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
