import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import BottomNav from './components/BottomNav';
import Today from './pages/Today';
import Week from './pages/Week';
import ActiveSession from './pages/ActiveSession';
import History from './pages/History';
import SessionDetail from './pages/SessionDetail';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Library from './pages/Library';
import CardioForm from './pages/CardioForm';
import ExerciseDetail from './pages/ExerciseDetail';
import DataTransfer from './pages/DataTransfer';

export default function App() {
  const init = useStore(s => s.init);
  const ready = useStore(s => s.ready);
  const location = useLocation();

  useEffect(() => { init(); }, [init]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-accent-500 animate-spin" />
          <span className="text-sm">Lade …</span>
        </div>
      </div>
    );
  }

  const hideNav = location.pathname.startsWith('/session');

  return (
    <div className="min-h-screen bg-ink-950">
      <main className={`mx-auto max-w-xl ${hideNav ? '' : 'pb-24'}`}>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/week" element={<Week />} />
          <Route path="/session" element={<ActiveSession />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<SessionDetail />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/stats/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/data" element={<DataTransfer />} />
          <Route path="/library" element={<Library />} />
          <Route path="/cardio/new" element={<CardioForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
