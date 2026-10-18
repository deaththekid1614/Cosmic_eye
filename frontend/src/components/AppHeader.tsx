import { NavLink } from 'react-router-dom';
import { Home, Search, Activity, BookOpen, Sparkles, Calendar } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/ai-search', label: 'AI Search', icon: Sparkles },
  { to: '/browse', label: 'Browse', icon: Calendar },
  { to: '/explore', label: 'Manual', icon: Search },
  { to: '/wavelengths', label: 'Wavelengths', icon: Activity },
  { to: '/learn', label: 'Learn', icon: BookOpen },
];

export default function AppHeader() {
  return (
    <header className="top-nav">
      <div className="top-nav-brand">
        <div className="logo-circle"><div className="orbit"></div></div>
        <span>Cosmic Eye</span>
      </div>
      <nav className="top-nav-links">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <item.icon size={16} /> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="top-nav-right">
        <span className="nasa-text">Powered by<br/><strong style={{ color: 'var(--text-main)' }}>NASA SPHEREx</strong></span>
      </div>
    </header>
  );
}
