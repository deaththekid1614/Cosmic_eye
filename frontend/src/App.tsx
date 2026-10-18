import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useLayoutEffect } from 'react';
import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';
import HomePage from './routes/HomePage';
import ExplorePage from './routes/ExplorePage';
import LearnPage from './routes/LearnPage';
import AISearchPage from './routes/AISearchPage';
import BrowsePage from './routes/BrowsePage';
import RGBExplorerPage from './routes/RGBExplorerPage'; // <-- IMPORTED

const SkyMapPage = lazy(() => import('./routes/SkyMapPage'));

function ResetMainScroll() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    document.querySelector<HTMLElement>('.main-content')?.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="app-layout">
      <ResetMainScroll />
      <AppHeader />
      <div className="body-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/wavelengths" element={<Navigate to="/rgb" replace />} />
            <Route path="/rgb" element={<RGBExplorerPage />} /> {/* <-- NEW ROUTE */}
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/ai-search" element={<AISearchPage />} />
            <Route path="/browse" element={<BrowsePage mode="recent" />} />
            <Route path="/popular-regions" element={<BrowsePage mode="regions" />} />
            <Route path="/skymap" element={<Suspense fallback={<div className="dashboard-wrapper">Loading 3D sky map…</div>}><SkyMapPage /></Suspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
