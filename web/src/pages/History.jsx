import { Link } from 'react-router-dom';
import { ArrowUpRight, History as HistoryIcon, Trash2 } from 'lucide-react';

const bytes = (value) => {
  if (!value) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
};

export function History({ data }) {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">HISTORY / SAVED CAPTURES</p>
          <h1>
            Every capture,
            <br />
            <em>kept to account.</em>
          </h1>
          <p className="lede">
            Each row is a parsed capture stored in MongoDB. Open one to inspect its flows, domains,
            packet trace, and the rules that were active at the time.
          </p>
        </div>
        <Link to="/" className="back-link">Back to capture <ArrowUpRight size={13} /></Link>
      </header>

      {data.runs.length === 0 ? (
        <div className="panel empty-wire">
          <HistoryIcon size={28} />
          <p>No captures yet. Analyze a PCAP and it will appear here.</p>
          <Link to="/" className="btn primary">Open the capture lab</Link>
        </div>
      ) : (
        <div className="history-list">
          {data.runs.map((run) => (
            <div key={run.id} className="history-row">
              <div className="history-main">
                <div className="history-title">
                  <span className={`source-chip ${run.source}`}>{run.source}</span>
                  <h2>{run.filename}</h2>
                </div>
                <p className="history-time">{new Date(run.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="history-metrics">
                <div><strong>{run.packetCount}</strong><span>packets</span></div>
                <div><strong>{run.flowCount}</strong><span>flows</span></div>
                <div><strong className={run.blockedFlowCount ? 'accent-red' : ''}>{run.blockedFlowCount}</strong><span>blocked</span></div>
                <div><strong>{bytes(run.fileSize)}</strong><span>file</span></div>
              </div>
              <div className="history-actions">
                <Link to={`/run/${run.id}`} className="btn secondary small">
                  Open <ArrowUpRight size={13} />
                </Link>
                <button
                  type="button"
                  className="icon-button danger"
                  aria-label={`Delete ${run.filename}`}
                  onClick={() => {
                    if (window.confirm(`Delete ${run.filename}?`)) void data.removeRun(run.id);
                  }}
                  disabled={Boolean(data.action)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
