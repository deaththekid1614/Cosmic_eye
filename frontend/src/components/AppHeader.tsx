import { NavLink } from 'react-router-dom';
import { Home, Search, Clock, Sparkles, Activity, BookOpen } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/explore', label: 'Explore', icon: Search },
  { to: '/compare', label: 'Time Machine', icon: Clock },
  { to: '/changes', label: 'Find Changes', icon: Sparkles },
  { to: '/wavelengths', label: 'Wavelengths', icon: Activity },
  { to: '/learn', label: 'Learn', icon: BookOpen },
];

export default function AppHeader() {
  return (
    <header className="top-nav">
      <div className="top-nav-brand">
        <div className="logo-circle">
          <div className="orbit"></div>
        </div>
        <span>Cosic Eye</span>
      </div>
      <nav className="top-nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="top-nav-right">
        <span className="nasa-text">Powered by<br/><strong>NASA SPHEREx</strong></span>
      </div>
    </header>
  );
}
