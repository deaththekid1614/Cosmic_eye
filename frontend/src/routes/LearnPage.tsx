import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const demoBands = [
  { id: 'short', value: '0.93', name: 'Shorter infrared' },
  { id: 'middle', value: '3.12', name: 'Middle infrared' },
  { id: 'long', value: '4.71', name: 'Longer infrared' },
] as const;

const demoPalettes = ['inferno', 'viridis', 'plasma', 'cividis'] as const;

export default function LearnPage() {
  const [band, setBand] = useState<(typeof demoBands)[number]['id']>('middle');
  const [palette, setPalette] = useState<(typeof demoPalettes)[number]>('inferno');
  const selectedBand = demoBands.find((item) => item.id === band)!;

  return (
    <section className="learn-page">
      <div className="explore-header"><div><span className="eyebrow">THE BASICS</span><h1>Read the infrared sky</h1><p>A quick guide to what Cosmic Eye shows and how to explore it.</p></div></div>
      <section className="learn-demo" aria-labelledby="learn-demo-title">
        <div className="learn-demo-copy">
          <span className="eyebrow">INTERACTIVE MODEL</span>
          <h2 id="learn-demo-title">See how a display changes</h2>
          <p>Choose a sample wavelength and palette. The illustration changes so you can see how the same signal can be displayed in different colors.</p>
          <div className="demo-control-group">
            <span className="demo-label">Sample wavelength</span>
            <div className="demo-choice-row">
              {demoBands.map((item) => <button key={item.id} type="button" className={`demo-choice${band === item.id ? ' selected' : ''}`} aria-pressed={band === item.id} onClick={() => setBand(item.id)}><strong>{item.value} µm</strong><small>{item.name}</small></button>)}
            </div>
          </div>
          <div className="demo-control-group">
            <span className="demo-label">Display palette</span>
            <div className="demo-palette-row">
              {demoPalettes.map((item) => <button key={item} type="button" className={`demo-palette palette-${item}${palette === item ? ' selected' : ''}`} aria-label={`${item} palette`} aria-pressed={palette === item} onClick={() => setPalette(item)}><span className="palette-swatch" /></button>)}
            </div>
          </div>
          <p className="demo-reading"><strong>{selectedBand.value} µm · {selectedBand.name}</strong><br />Dark means a weaker signal; bright means a stronger signal. The palette changes the display, not the measurement.</p>
        </div>
        <div className={`signal-demo band-${band} map-${palette}`} role="img" aria-label={`Illustration of a signal map for ${selectedBand.name} using the ${palette} palette`}>
          <span className="demo-star star-one" /><span className="demo-star star-two" /><span className="demo-star star-three" /><span className="demo-star star-four" />
          <div className="demo-illustration-label">Illustration · not an observation</div>
          <div className="demo-signal-key"><span>LOW SIGNAL</span><i /><span>HIGH SIGNAL</span></div>
        </div>
      </section>
      <div className="learn-grid">
        <article className="learn-card"><span className="learn-number">01</span><h2>Light beyond red</h2><p>Infrared light has longer wavelengths than visible red light. It can reveal cool objects and pass through some clouds of cosmic dust that hide visible light.</p><Link to="/rgb" className="learn-action">See infrared data <ArrowRight size={15} /></Link></article>
        <article className="learn-card"><span className="learn-number">02</span><h2>One sky, many wavelengths</h2><p>Each wavelength highlights different material and temperatures. Compare bands for the same region in Color Lab.</p><Link to="/rgb" className="learn-action">Compare bands in Color Lab <ArrowRight size={15} /></Link></article>
        <article className="learn-card"><span className="learn-number">03</span><h2>What the colors mean</h2><p>Color Lab assigns display colors to infrared signal strength. The palette helps reveal structure; it does not show an object’s actual visible-light colors.</p><Link to="/rgb" className="learn-action">Try the color palettes <ArrowRight size={15} /></Link></article>
        <article className="learn-card"><span className="learn-number">04</span><h2>Explore an observation</h2><p>Search by object name or sky coordinates. Open an observation to zoom in, inspect its metadata, and visit the original archive file.</p><Link to="/ai-search" className="learn-action">Find an object <ArrowRight size={15} /></Link></article>
      </div>
    </section>
  );
}
