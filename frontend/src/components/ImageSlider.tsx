import { useState } from 'react';
import type { Observation } from '../types/observation';

type Props = {
  obsA: Observation;
  obsB: Observation;
};

export default function ImageSlider({ obsA, obsB }: Props) {
  const [sliderPosition, setSliderPosition] = useState(50);

  const urlA = `http://localhost:8000/api/v1/observations/preview?url=${encodeURIComponent(obsA.source_url)}`;
  const urlB = `http://localhost:8000/api/v1/observations/preview?url=${encodeURIComponent(obsB.source_url)}`;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '900px',
      height: '65vh',
      margin: '0 auto',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      background: '#000'
    }}>
      
      {/* Image A (Background) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <img src={urlA} alt="Observation A" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', bottom: '20px', left: '20px',
          background: 'rgba(0,0,0,0.75)', padding: '12px 16px', borderRadius: '8px',
          color: 'white', fontSize: '0.85rem', lineHeight: '1.4',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <strong>{obsA.id}</strong>
          <br/>{obsA.band} • {new Date(obsA.observed_at).toLocaleDateString()}
        </div>
      </div>

      {/* Image B (Foreground, clipped) */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` 
      }}>
        <img src={urlB} alt="Observation B" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', bottom: '20px', right: '20px',
          background: 'rgba(0,0,0,0.75)', padding: '12px 16px', borderRadius: '8px',
          color: 'white', fontSize: '0.85rem', lineHeight: '1.4', textAlign: 'right',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <strong>{obsB.id}</strong>
          <br/>{obsB.band} • {new Date(obsB.observed_at).toLocaleDateString()}
        </div>
      </div>

      {/* The Slider Line & Handle */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, width: '2px', background: 'white',
        left: `${sliderPosition}%`, zIndex: 10, transform: 'translateX(-50%)',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '44px', height: '44px', background: 'var(--accent-blue)',
          border: '4px solid white', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)', cursor: 'ew-resize'
        }}>
          {/* Simple arrows inside the handle */}
          <div style={{ display: 'flex', gap: '4px', color: 'white' }}>
            <span>◀</span><span>▶</span>
          </div>
        </div>
      </div>

      {/* Invisible Range Input for Interaction */}
      <input 
        type="range" 
        min="0" max="100" 
        value={sliderPosition} 
        onChange={(e) => setSliderPosition(Number(e.target.value))} 
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          width: '100%', height: '100%', opacity: 0, cursor: 'ew-resize', zIndex: 20, margin: 0
        }}
      />
    </div>
  );
}