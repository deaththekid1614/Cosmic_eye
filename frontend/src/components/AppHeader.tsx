import { Link } from 'react-router-dom';

export default function AppHeader() {
  return (
    <header className="top-nav">
      <Link to="/" className="top-nav-brand" aria-label="Cosmic Eye home">
        <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
          <defs>
            <linearGradient id="cosmic-mark-gradient" x1="5" y1="6" x2="35" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#75c7ff" />
              <stop offset="1" stopColor="#9a72ff" />
            </linearGradient>
            <radialGradient id="cosmic-mark-core">
              <stop stopColor="#ffffff" />
              <stop offset=".35" stopColor="#a8d8ff" />
              <stop offset="1" stopColor="#548dff" />
            </radialGradient>
          </defs>
          <circle className="brand-mark-orbit" cx="20" cy="20" r="17.2" />
          <path className="brand-mark-eye" d="M4.8 20s5.4-8.2 15.2-8.2S35.2 20 35.2 20 29.8 28.2 20 28.2 4.8 20 4.8 20Z" />
          <circle className="brand-mark-core" cx="20" cy="20" r="4.4" />
          <path className="brand-mark-spark" d="M30.7 5.2v5.1m-2.55-2.55h5.1" />
        </svg>
        <span>Cosmic Eye</span>
      </Link>
      <div className="top-nav-right">
        <span className="nasa-text">Powered by<br/><strong>NASA SPHEREx</strong></span>
      </div>
    </header>
  );
}
