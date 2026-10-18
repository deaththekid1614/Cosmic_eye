import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Globe2, Shuffle, Sparkles, Palette } from 'lucide-react';
import { getFeaturedTargets } from '../api/observations';
import type { FeaturedTarget } from '../types/observation';

const FALLBACK_IMAGES: Record<string, string> = {
  orion: "/images/orion-hubble-visible.jpg",
  andromeda: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=800&auto=format&fit=crop",
  ring: "https://science.nasa.gov/wp-content/uploads/2023/04/ring-nebula-full_jpg-jpg.webp",
  carina: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=800&auto=format&fit=crop",
  horsehead: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=800&auto=format&fit=crop"
};

export default function HomePage() {
  const [featured, setFeatured] = useState<FeaturedTarget[]>([]);

  useEffect(() => {
    getFeaturedTargets().then((targets) => setFeatured(targets.slice(0, 5))).catch(console.error);
  }, []);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-main">
        <div className="hero-banner">
          <div className="hero-text">
            <h1>Welcome to<br/><span className="gradient-text">Cosmic Eye</span></h1>
            <p>Real SPHEREx data. Simple tools.<br/>A wider view of the universe.</p>
            <p className="hero-sub">Explore the sky, compare observations across time and wavelengths, and find interesting changes in the universe.</p>
            <div className="hero-actions">
              <Link to="/explore" className="glow-btn">Start Exploring <ArrowRight size={18} /></Link>
              <Link to="/skymap" className="hero-regions-link">Explore Sky Map <Globe2 size={16} /></Link>
            </div>
          </div>
        </div>

        <div className="feature-grid">
          <Link to="/ai-search" className="feature-card">
            <div className="icon-box blue"><Sparkles size={20} /></div>
            <h3>AI Search</h3>
            <p>Look up a known object and find nearby SPHEREx observations.</p>
            <span className="link-text">Go to AI <ArrowRight size={14}/></span>
          </Link>
          <Link to="/browse" className="feature-card">
            <div className="icon-box green"><Calendar size={20} /></div>
            <h3>Browse</h3>
            <p>Explore popular regions and a sample of archive observations.</p>
            <span className="link-text">Go to Browse <ArrowRight size={14}/></span>
          </Link>
          <Link to="/rgb" className="feature-card">
            <div className="icon-box orange"><Palette size={20} /></div>
            <h3>Color Lab</h3>
            <p>Explore infrared bands and change how their signals are colored.</p>
            <span className="link-text">Go to Color Lab <ArrowRight size={14}/></span>
          </Link>
        </div>

        <div>
          <div className="section-heading">
            <div>
              <h2>Popular Regions</h2>
              <p>Choose a destination and explore the archive around it.</p>
            </div>
            <Link to="/popular-regions" className="section-link">View all <ArrowRight size={15} /></Link>
          </div>
          <div className="popular-regions-grid">
            {featured.map((target) => (
              <Link key={target.id} to="/explore" state={{ ra: target.ra.toString(), dec: target.dec.toString(), targetName: target.name }} className="region-card">
                <img src={FALLBACK_IMAGES[target.id] || target.image_url} alt={target.name} className="region-img" loading="lazy" />
                <div className="region-info">
                  <h3>{target.name}</h3>
                  <p>{target.type} • RA {target.ra}°</p>
                  <span className="region-badge">{target.type}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-right">
        <div className="right-panel">
          <h3>Explore the Universe</h3>
          <p className="subtext">Dedicated tools for discovery</p>
          <div className="quick-links">
            <Link to="/ai-search" className="q-link">
              <div className="icon-box purple small"><Sparkles size={16} /></div>
              <div><strong>AI Search</strong><span>Search any object in the universe</span></div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </Link>
            <Link to="/browse" className="q-link">
              <div className="icon-box green small"><Calendar size={16} /></div>
              <div><strong>Browse by Date</strong><span>Find latest observations</span></div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </Link>
            <Link to="/explore" state={{ random: true }} className="q-link">
              <div className="icon-box orange small"><Shuffle size={16} /></div>
              <div><strong>Random Discovery</strong><span>Pick a random sky sector</span></div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </Link>
          </div>
        </div>

        {featured.length > 0 && (
          <div className="right-panel">
            <h3>Featured Observation</h3>
            <Link to="/explore" state={{ ra: featured[0].ra.toString(), dec: featured[0].dec.toString() }} className="featured-observation">
              <img src={FALLBACK_IMAGES[featured[0].id] || featured[0].image_url} alt={featured[0].name} />
              <div className="featured-observation-copy">
                <strong>{featured[0].name}</strong>
                <p>{featured[0].type} <span aria-hidden="true">·</span> RA {featured[0].ra}° <span aria-hidden="true">·</span> Dec {featured[0].dec}°</p>
                <span className="featured-observation-action">View observation <ArrowRight size={14} /></span>
              </div>
            </Link>
          </div>
        )}

        <div className="right-panel">
          <h3>Quick Facts</h3>
          <ul className="facts-list">
            <li><strong>102</strong> Infrared bands</li>
            <li><strong>~ 6 months</strong> Between observations</li>
            <li><strong>Full sky</strong> Coverage (planned)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
