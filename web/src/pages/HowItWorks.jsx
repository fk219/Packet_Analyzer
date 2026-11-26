import { Link } from 'react-router-dom';
import { ArrowRight, Braces, Filter, Layers, ScanSearch, ShieldBan } from 'lucide-react';

const endpoints = [
  ['GET', '/api/health', 'Service heartbeat'],
  ['GET', '/api/apps', 'Classifier catalogue'],
  ['GET', '/api/rules', 'Current blocking rules'],
  ['PUT', '/api/rules', 'Update blocked apps and domains'],
  ['POST', '/api/analyze', 'Upload and parse a PCAP'],
  ['POST', '/api/analyze/demo', 'Parse the built-in demo capture'],
  ['GET', '/api/runs', 'Saved analysis history'],
  ['GET', '/api/runs/:id', 'A full capture with flows and trace']
];

export function HowItWorks({ data }) {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">GUIDE / WHAT THIS IS + HOW TO USE IT</p>
          <h1>
            Read the wire.
            <br />
            <em>Then decide what to block.</em>
          </h1>
          <p className="lede">
            PacketAnalyzer turns a classic PCAP into a readable story: which applications spoke, which
            domains appeared, which flows were refused, and which rules caused the refusal. The guide
            below is the shortest path from a capture file to a decision.
          </p>
        </div>
        <Link to="/" className="back-link">Run a capture <ArrowRight size={13} /></Link>
      </header>

      <section className="quick-guide">
        <div className="quick-guide-head">
          <p className="eyebrow">START HERE / FOUR MOVES</p>
          <h2>How to use PacketAnalyzer.</h2>
          <p>
            No install. The demo capture is synthetic and safe to inspect. Upload your own classic
            <code>.pcap</code> when you want to read real traffic from your own network.
          </p>
        </div>
        <div className="quick-guide-grid">
          <article>
            <span>01</span>
            <h3>Bring a capture</h3>
            <p>Drop a classic <code>.pcap</code> (not pcapng) into the intake panel, or press Analyze demo capture.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Set the rules</h3>
            <p>Choose the apps and domains the wire should refuse. Rules apply to the next analysis.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Read the flows</h3>
            <p>Start with the metric strip, then scan applications, destinations, and the packet trace.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Keep the evidence</h3>
            <p>Every run is stored with the exact rule snapshot. Open History to compare or delete a run.</p>
          </article>
        </div>
        <div className="quick-guide-actions">
          <Link to="/" className="btn primary">Open the capture lab <ArrowRight size={14} /></Link>
          <Link to="/history" className="btn secondary">Browse saved captures</Link>
        </div>
      </section>

      <section className="pipeline">
        <div className="pipeline-step">
          <span className="step-index">01</span>
          <Layers size={19} />
          <h2>Read the capture</h2>
          <p>Classic PCAP global header, per-packet timestamps, lengths, and link type. Ethernet and raw-IP captures are supported.</p>
        </div>
        <div className="pipeline-step">
          <span className="step-index">02</span>
          <Braces size={19} />
          <h2>Walk the headers</h2>
          <p>Ethernet type, IPv4 IHL, protocol number, TCP data offset, or UDP header. Fragmented or IPv6 traffic is skipped.</p>
        </div>
        <div className="pipeline-step">
          <span className="step-index">03</span>
          <ScanSearch size={19} />
          <h2>Name the app</h2>
          <p>TLS ClientHello SNI, DNS question names, and HTTP Host headers are matched against the classifier catalogue.</p>
        </div>
        <div className="pipeline-step">
          <span className="step-index">04</span>
          <Filter size={19} />
          <h2>Aggregate flows</h2>
          <p>Packets are grouped by the five-tuple. The flow tracks bytes, packets, app, domain, and whether the current rules block it.</p>
        </div>
        <div className="pipeline-step">
          <span className="step-index">05</span>
          <ShieldBan size={19} />
          <h2>Apply the rules</h2>
          <p>Blocked apps and domain substrings mark the flow and its packets. The rule snapshot is stored with the run.</p>
        </div>
      </section>

      <div className="method-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">WHAT IS PARSED</p>
              <h2>The supported surface.</h2>
            </div>
          </div>
          <ul className="check-list">
            <li>Classic PCAP, little- or big-endian, microsecond or nanosecond timestamps.</li>
            <li>Ethernet with optional VLAN tags, raw IPv4, and Linux cooked captures.</li>
            <li>IPv4 TCP and UDP; TLS ClientHello SNI; DNS queries; HTTP Host headers.</li>
            <li>Flow aggregation, app classification, domain summaries, and packet traces.</li>
            <li>Rule snapshots stored per analysis so old runs stay explainable.</li>
          </ul>
        </section>

        <section className="panel limits-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">HONEST LIMITS</p>
              <h2>What this parser does not do.</h2>
            </div>
          </div>
          <ul className="check-list limits">
            <li>No pcapng. Convert with <code>editcap -F pcap</code> first.</li>
            <li>No TCP reassembly. A ClientHello split across segments may not yield SNI.</li>
            <li>No IPv6, QUIC, or encrypted ClientHello (ECH) inspection.</li>
            <li>Checksums are not validated; the parser trusts the capture bytes.</li>
            <li>The demo capture is synthetic, generated by the API, and labelled as such.</li>
          </ul>
        </section>
      </div>

      <section className="panel api-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">API SURFACE</p>
            <h2>Seven routes. No hidden service.</h2>
          </div>
          <span className="mono tiny muted">Express · MongoDB</span>
        </div>
        <div className="endpoint-list">
          {endpoints.map(([method, path, note]) => (
            <div key={path} className="endpoint-row">
              <span className={`method method-${method.toLowerCase()}`}>{method}</span>
              <code>{path}</code>
              <span>{note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="apps-strip">
        <p className="eyebrow">CLASSIFIER CATALOGUE</p>
        <div className="app-chips">
          {data.apps.map((app) => (
            <span key={app} className={`app-chip ${data.rules?.blockedApps?.includes(app) ? 'blocked' : ''}`}>
              <i className={`app-dot app-${app.toLowerCase().replace(/[^a-z]/g, '')}`} />
              {app}
            </span>
          ))}
        </div>
        <Link to="/" className="btn primary">Open the capture lab <ArrowRight size={14} /></Link>
      </section>
    </div>
  );
}
