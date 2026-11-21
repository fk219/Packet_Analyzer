import { ArrowRight, Radar, ScanLine } from 'lucide-react';
import { AnalysisView } from '../components/AnalysisView.jsx';
import { RulesPanel } from '../components/RulesPanel.jsx';
import { UploadPanel } from '../components/UploadPanel.jsx';

function TraceVisual() {
  const bars = [28, 44, 18, 62, 36, 78, 52, 22, 70, 42, 84, 58, 30, 66, 48, 74, 38, 56, 88, 46];
  return (
    <div className="trace-visual" aria-hidden="true">
      <div className="trace-top">
        <span className="mono tiny"><i className="live-dot" /> live capture preview</span>
        <span className="mono tiny">eth0 / promiscuous</span>
      </div>
      <div className="trace-bars">
        {bars.map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} className={index % 7 === 0 ? 'is-hot' : ''} />
        ))}
      </div>
      <div className="trace-bottom">
        <span className="mono tiny">TLS ClientHello</span>
        <span className="mono tiny">SNI → app</span>
        <span className="mono tiny">flow table</span>
      </div>
    </div>
  );
}

export function Dashboard({ data }) {
  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">DEEP PACKET INSPECTION / CAPTURE 01</p>
          <h1>
            The wire,
            <br />
            <em>in plain sight.</em>
          </h1>
          <p className="lede">
            Upload a PCAP. The parser walks Ethernet, IP, TCP and UDP, pulls TLS SNI and DNS names,
            classifies the application, and applies the blocking rules you choose.
          </p>
          <div className="hero-notes">
            <span><ScanLine size={12} /> classic PCAP</span>
            <span><Radar size={12} /> SNI + DNS + HTTP host</span>
            <span>no packet payloads stored</span>
          </div>
        </div>
        <TraceVisual />
      </section>

      <div className="intake-grid">
        <UploadPanel data={data} />
        <RulesPanel data={data} />
      </div>

      <section className="run-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">03 / ANALYSIS</p>
            <h2>{data.run ? 'The latest capture, decoded.' : 'Nothing on the table yet.'}</h2>
          </div>
          {data.run && (
            <p className="section-meta">
              {data.run.filename} · {new Date(data.run.createdAt).toLocaleString('en-IN')}
            </p>
          )}
        </div>

        {data.run ? (
          <AnalysisView run={data.run} />
        ) : (
          <div className="panel empty-wire">
            <Radar size={28} />
            <p>Upload a capture or run the demo to see flows, SNI, app classification, and blocked traffic.</p>
            <button type="button" className="btn primary" onClick={data.runDemo} disabled={Boolean(data.action)}>
              Analyze demo capture <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
