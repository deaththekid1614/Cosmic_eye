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

export default function Sidebar() {
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
        <button className="secondary-btn">Learn More</button>
      </div>
    </aside>
  );
}