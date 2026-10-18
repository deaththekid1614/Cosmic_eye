import { Route, Routes, Navigate } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';
import HomePage from './routes/HomePage';
import ExplorePage from './routes/ExplorePage';
import WavelengthsPage from './routes/WavelengthsPage';
import LearnPage from './routes/LearnPage';
import AISearchPage from './routes/AISearchPage';
import BrowsePage from './routes/BrowsePage';

export default function App() {
  return (
    <div className="app-layout">
      <AppHeader />
      <div className="body-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/wavelengths" element={<WavelengthsPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/ai-search" element={<AISearchPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
