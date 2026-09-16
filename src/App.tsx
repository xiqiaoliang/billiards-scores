import { HashRouter as Router, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TimerPage from './pages/TimerPage';

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
        <Route path="/" element={<HomePage />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showBottomNav && <MobileNav />}
    </Router>
  );
}
