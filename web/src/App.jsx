import { NavLink, Route, Routes } from 'react-router-dom';
import { Activity, Boxes, RefreshCw, ScanLine } from 'lucide-react';
import { useLab } from './useLab.js';
import { Dashboard } from './pages/Dashboard.jsx';
import { History } from './pages/History.jsx';
import { RunDetail } from './pages/RunDetail.jsx';
import { HowItWorks } from './pages/HowItWorks.jsx';

function Mark() {
  return (
    <svg viewBox="0 0 40 40" className="mark" aria-hidden="true">
      <path d="M3 20h7l3-10 5 20 4-16 3 12 3-6h9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function Shell({ children, run, action, error, notice, onRetry }) {
  return (
    <div className="site-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="PacketAnalyzer home">
          <Mark />
          <div>
            <p className="brand-name">PACKET / LAB</p>
            <p className="brand-sub">deep inspection, visible</p>
          </div>
        </NavLink>

        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>Capture</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/how-it-works">Guide</NavLink>
        </nav>

        <div className="topbar-status">
          <span className={`status-pill ${error ? 'is-bad' : 'is-good'}`}>
            <Activity size={11} />
            {error ? 'API offline' : 'API live'}
          </span>
          <span className="status-meta">
            {action ? `${action}…` : run ? `${run.packetCount} packets loaded` : 'awaiting capture'}
          </span>
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="banner bad" role="alert">
            <span><strong>API error.</strong> {error}</span>
            <button type="button" className="btn secondary small" onClick={onRetry}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}
        {notice && <div className="banner good" role="status">{notice}</div>}
        {children}
      </main>

      <footer className="footer">
        <span><ScanLine size={12} /> Classic PCAP · TLS SNI · flow aggregation</span>
        <span><Boxes size={12} /> Express · MongoDB · React</span>
      </footer>
    </div>
  );
}

export default function App() {
  const data = useLab();
  return (
    <Shell
      run={data.run}
      action={data.action}
      error={data.error}
      notice={data.notice}
      onRetry={data.reload}
    >
      <Routes>
        <Route path="/" element={<Dashboard data={data} />} />
        <Route path="/history" element={<History data={data} />} />
        <Route path="/run/:id" element={<RunDetail data={data} />} />
        <Route path="/how-it-works" element={<HowItWorks data={data} />} />
      </Routes>
    </Shell>
  );
}
