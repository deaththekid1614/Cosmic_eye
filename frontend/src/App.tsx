import { Route, Routes } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';
import HomePage from './routes/HomePage';
import ExplorePage from './routes/ExplorePage';
import ComparePage from './routes/ComparePage';
import ChangesPage from './routes/ChangesPage';
import WavelengthsPage from './routes/WavelengthsPage';
import LearnPage from './routes/LearnPage';

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
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/changes" element={<ChangesPage />} />
            <Route path="/wavelengths" element={<WavelengthsPage />} />
            <Route path="/learn" element={<LearnPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}