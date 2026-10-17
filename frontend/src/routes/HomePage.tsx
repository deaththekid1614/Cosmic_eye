import { Link } from 'react-router-dom';
import { Search, Clock, Sparkles, Activity, ArrowRight, MapPin, Calendar, Shuffle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="dashboard-layout">
      <div className="dashboard-main">
        {/* Hero Section */}
        <div className="hero-banner">
          <div className="hero-text">
            <h1>Welcome to<br/><span className="gradient-text">Cosic Eye</span></h1>
            <p>Real SPHEREx data. Simple tools.<br/>Big discoveries.</p>
            <p className="hero-sub">Explore the sky, compare observations across time and wavelengths, and find interesting changes in the universe.</p>
            <Link to="/explore" className="primary-action glow-btn">
              Start Exploring <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="feature-grid">
          <Link to="/explore" className="feature-card">
            <div className="icon-box blue"><Search size={20} /></div>
            <h3>Explore</h3>
            <p>View real SPHEREx observations with simple controls and clear information.</p>
            <span className="link-text">Go to Explore <ArrowRight size={14}/></span>
          </Link>
          <Link to="/compare" className="feature-card">
            <div className="icon-box purple"><Clock size={20} /></div>
            <h3>Compare Over Time</h3>
            <p>See how the same region looks at different dates.</p>
            <span className="link-text">Go to Time Machine <ArrowRight size={14}/></span>
          </Link>
          <Link to="/changes" className="feature-card">
            <div className="icon-box green"><Sparkles size={20} /></div>
            <h3>Find Changes</h3>
            <p>Discover possible changes in position or brightness.</p>
            <span className="link-text">Go to Find Changes <ArrowRight size={14}/></span>
          </Link>
          <Link to="/wavelengths" className="feature-card">
            <div className="icon-box orange"><Activity size={20} /></div>
            <h3>Explore Wavelengths</h3>
            <p>See how different infrared wavelengths reveal different details.</p>
            <span className="link-text">Go to Wavelengths <ArrowRight size={14}/></span>
          </Link>
        </div>
      </div>

      {/* Right Panel */}
      <div className="dashboard-right">
        <div className="right-panel">
          <h3>Explore the Universe</h3>
          <p className="subtext">Quick ways to get started</p>
          
          <div className="quick-links">
            <div className="q-link">
              <div className="icon-box purple small"><MapPin size={16} /></div>
              <div>
                <strong>Popular Regions</strong>
                <span>Explore famous sky regions</span>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </div>
            <div className="q-link">
              <div className="icon-box blue small"><Search size={16} /></div>
              <div>
                <strong>Search by Coordinates</strong>
                <span>Enter RA / Dec or object name</span>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </div>
            <div className="q-link">
              <div className="icon-box green small"><Calendar size={16} /></div>
              <div>
                <strong>Browse by Date</strong>
                <span>Find observations over time</span>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </div>
            <div className="q-link">
              <div className="icon-box orange small"><Shuffle size={16} /></div>
              <div>
                <strong>Random Discovery</strong>
                <span>Let us pick something interesting</span>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted"/>
            </div>
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
