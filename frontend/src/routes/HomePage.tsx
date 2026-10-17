import { Link } from 'react-router-dom';
import { Search, Activity, ArrowRight, MapPin, Calendar, Shuffle } from 'lucide-react';

export default function HomePage() {
  // A list of famous coordinates for the Random button
  const randomTargets = [
    { ra: '10.68', dec: '41.27' }, // Andromeda
    { ra: '83.82', dec: '-5.39' }, // Orion
    { ra: '337.42', dec: '-20.83' } // Helix Nebula
  ];
  
  const handleRandom = () => {
    const target = randomTargets[Math.floor(Math.random() * randomTargets.length)];
    return target;
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-main">
        <div className="hero-banner">
          <div className="hero-text">
            <h1>Welcome to<br/><span className="gradient-text">Cosmic Eye</span></h1>
            <p>Real SPHEREx data. Simple tools.<br/>Big discoveries.</p>
            <p className="hero-sub">Explore the sky, compare observations across time and wavelengths, and find interesting changes in the universe.</p>
            <Link to="/explore" className="glow-btn">
              Start Exploring <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="feature-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Link to="/explore" className="feature-card">
            <div className="icon-box blue"><Search size={20} /></div>
            <h3>Explore Observations</h3>
            <p>View real SPHEREx infrared observations with simple controls and clear information.</p>
            <span className="link-text">Go to Explore <ArrowRight size={14}/></span>
          </Link>
          
          <Link to="/wavelengths" className="feature-card">
            <div className="icon-box orange"><Activity size={20} /></div>
            <h3>Explore Wavelengths</h3>
            <p>See how different infrared wavelengths reveal different details about the same region of the sky.</p>
            <span className="link-text">Go to Wavelengths <ArrowRight size={14}/></span>
          </Link>
        </div>
      </div>

      <div className="dashboard-right">
        <div className="right-panel">
          <h3>Explore the Universe</h3>
          <p className="subtext">Quick ways to get started</p>
          
          <div className="quick-links">
            {/* Popular Regions */}
            <Link to="/explore" state={{ ra: '10.68', dec: '41.27' }} className="q-link">
              <div className="icon-box purple small"><MapPin size={16} /></div>
              <div>
                <strong>Popular Regions</strong>
                <span>Explore famous sky regions</span>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </Link>
            
            {/* Search by Coordinates */}
            <Link to="/explore" className="q-link">
              <div className="icon-box blue small"><Search size={16} /></div>
              <div>
                <strong>Search by Coordinates</strong>
                <span>Enter RA / Dec or object name</span>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </Link>
            
            {/* Browse by Date */}
            <Link to="/explore" className="q-link">
              <div className="icon-box green small"><Calendar size={16} /></div>
              <div>
                <strong>Browse by Date</strong>
                <span>Find observations over time</span>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </Link>
            
            {/* Random Discovery */}
            <Link to="/explore" state={handleRandom()} className="q-link">
              <div className="icon-box orange small"><Shuffle size={16} /></div>
              <div>
                <strong>Random Discovery</strong>
                <span>Let us pick something interesting</span>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </Link>
          </div>
        </div>

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
