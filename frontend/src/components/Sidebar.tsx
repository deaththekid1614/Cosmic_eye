import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, Sparkles, Calendar, Palette, Star, Globe2 } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/ai-search', label: 'AI Search', icon: Sparkles },
  { to: '/browse', label: 'Browse', icon: Calendar },
  { to: '/popular-regions', label: 'Popular Regions', icon: Star },
  { to: '/skymap', label: 'Sky Map', icon: Globe2 },
  { to: '/explore', label: 'Manual Search', icon: Search },
  { to: '/rgb', label: 'Color Lab', icon: Palette },
  { to: '/learn', label: 'Learn', icon: BookOpen },
];

export default function Sidebar() {
  const [missionOpen, setMissionOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMissionOpen(false), [pathname]);

  return (
    <aside className="sidebar">
      <nav className="side-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'side-link active' : 'side-link')}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-card">
        <div className="telescope-img">🔭</div>
        <h3>NASA SPHEREx</h3>
        <p>Mapping the entire sky in 102 infrared bands to explore the history of the universe.</p>
        <button type="button" className="secondary-btn" aria-expanded={missionOpen} onClick={() => setMissionOpen((open) => !open)}>
          {missionOpen ? 'Show Less' : 'Learn More'}
        </button>
        {missionOpen && (
          <div className="sidebar-learn-more">
            <p>SPHEREx scans the whole sky in infrared light. Each band records a different slice of light, helping scientists study stars, dust, and galaxies.</p>
            <Link to="/rgb">Open Color Lab →</Link>
          </div>
        )}
      </div>
    </aside>
  );
}
