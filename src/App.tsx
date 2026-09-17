import { HashRouter as Router, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import HomePage from './pages/HomePage';
import TimerPage from './pages/TimerPage';

function shouldOpenScorePage() {
  if (typeof window === 'undefined') return false;
  const url = new URL(window.location.href);
  return ['bs', 'm', 'match', 'data'].some((name) => Boolean(url.searchParams.get(name)));
}

function MobileNav() {
  const getClassName = ({ isActive }: { isActive: boolean }) =>
    [
      'rounded-full px-4 py-2 text-sm font-semibold transition',
      isActive
        ? 'bg-sky-500 text-white shadow-sm'
        : 'bg-white text-slate-600 ring-1 ring-slate-200',
    ].join(' ');

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4" data-export-hide>
      <nav className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-100/90 p-2 shadow-md ring-1 ring-slate-200 backdrop-blur">
        <NavLink to="/" className={getClassName} end>
          首页
        </NavLink>
        <NavLink to="/score" className={getClassName}>
          追分
        </NavLink>
        <NavLink to="/timer" className={getClassName}>
          计时器
        </NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  const showBottomNav = false;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={shouldOpenScorePage() ? <Navigate to="/score" replace /> : <EntryPage />}
        />
        <Route path="/score" element={<HomePage />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showBottomNav && <MobileNav />}
    </Router>
  );
}
