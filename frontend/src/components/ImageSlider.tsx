import { useState } from 'react';

type Props = {
  baseUrl: string;
  overlayUrl: string;
  onImageLoad?: () => void;
};

export default function ImageSlider({ baseUrl, overlayUrl, onImageLoad }: Props) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      
      {/* Base Image (Magma) */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img 
          src={baseUrl} 
          alt="Original" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          onError={onImageLoad}
        />
        <div style={{
          position: 'absolute', bottom: '20px', left: '20px',
          background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '8px',
          color: 'white', fontSize: '0.9rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)'
        }}>
          Original (Single Band)
        </div>
      </div>

      {/* Overlay Image (RGB) */}
      <div style={{ 
        position: 'absolute', inset: 0,
        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` 
      }}>
        <img 
          src={overlayUrl} 
          alt="RGB Composite" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          onLoad={onImageLoad}
        />
        <div style={{
          position: 'absolute', bottom: '20px', right: '20px',
          background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '8px',
          color: 'white', fontSize: '0.9rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)'
        }}>
          True Color (RGB Composite)
        </div>
      </div>

      {/* Slider Line & Handle */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, width: '2px', background: 'white',
        left: `${sliderPosition}%`, zIndex: 10, transform: 'translateX(-50%)',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '44px', height: '44px', background: 'var(--accent-blue)',
          border: '3px solid white', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)', cursor: 'ew-resize'
        }}>
          <div style={{ display: 'flex', gap: '4px', color: 'white', fontSize: '12px' }}>
            <span>◀</span><span>▶</span>
          </div>
        </div>
      </div>

      {/* Invisible Range Input */}
      <input 
        type="range" 
        aria-label="Compare original and true-color images"
        min="0" max="100" 
        value={sliderPosition} 
        onChange={(e) => setSliderPosition(Number(e.target.value))} 
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', opacity: 0, cursor: 'ew-resize', zIndex: 20, margin: 0
        }}
      />
    </div>
  );
}
