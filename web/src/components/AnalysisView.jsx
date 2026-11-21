import { Clock3, FileText, Network, ShieldBan, Waypoints } from 'lucide-react';
import { FlowTable } from './FlowTable.jsx';

const bytes = (value) => {
  if (!value) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
};

const duration = (ms) => {
  if (!ms) return '0s';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const time = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function AppBars({ apps = [] }) {
  const max = Math.max(1, ...apps.map((app) => app.packets));
  const visible = apps.slice(0, 10);
  return (
    <div className="app-bars">
      {visible.map((app) => (
        <div key={app.app} className="app-row">
          <div className="app-row-head">
            <span className="app-name">
              <i className={`app-dot app-${app.app.toLowerCase().replace(/[^a-z]/g, '')}`} />
              {app.app}
            </span>
            <span className="mono small muted">{app.packets} packets · {bytes(app.bytes)}</span>
          </div>
          <div className="app-track">
            <div
              className={`app-fill ${app.blockedFlows ? 'has-block' : ''}`}
              style={{ width: `${Math.max(4, (app.packets / max) * 100)}%` }}
            />
          </div>
          <div className="app-row-foot">
            <span>{app.flows} flows</span>
            {app.blockedFlows > 0 && <span className="blocked-label">{app.blockedFlows} blocked</span>}
          </div>
        </div>
      ))}
      {apps.length > visible.length && (
        <p className="app-more">+{apps.length - visible.length} more apps in the flow table</p>
      )}
    </div>
  );
}

function ProtocolSplit({ protocols = {} }) {
  const entries = Object.entries(protocols);
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
  return (
    <div className="protocol-split">
      <div className="protocol-bar">
        {entries.map(([name, value], index) => (
          <span
            key={name}
            className={`protocol-${name.toLowerCase()}`}
            style={{ width: `${(value / total) * 100}%` }}
            title={`${name}: ${value}`}
          />
        ))}
      </div>
      <div className="protocol-legend">
        {entries.map(([name, value], index) => (
          <div key={name}>
            <i className={`protocol-dot protocol-${name.toLowerCase()}`} />
            <span>{name}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalysisView({ run }) {
  if (!run) return null;

  return (
    <div className="analysis">
      <div className="metric-strip">
        <div className="metric">
          <span>Packets</span>
          <strong>{run.packetCount}</strong>
          <small>{run.parsedPackets} parsed</small>
        </div>
        <div className="metric">
          <span>Flows</span>
          <strong>{run.flowCount}</strong>
          <small>{run.protocols?.TCP || 0} TCP · {run.protocols?.UDP || 0} UDP</small>
        </div>
        <div className="metric">
          <span>Blocked</span>
          <strong className="accent-red">{run.blockedFlowCount}</strong>
          <small>{run.blockedPacketCount} packets refused</small>
        </div>
        <div className="metric">
          <span>Apps identified</span>
          <strong>{run.appCount}</strong>
          <small>{run.topDomains?.length || 0} domains surfaced</small>
        </div>
        <div className="metric">
          <span>Capture span</span>
          <strong>{duration(run.durationMs)}</strong>
          <small>{bytes(run.fileSize)} file</small>
        </div>
      </div>

      <div className="analysis-grid">
        <section className="panel app-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">APPLICATION BREAKDOWN</p>
              <h2>Who owns the packets.</h2>
            </div>
            <Waypoints size={19} className="panel-icon" />
          </div>
          <AppBars apps={run.apps || []} />
        </section>

        <section className="panel facts-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">CAPTURE FACTS</p>
              <h2>The file, decoded.</h2>
            </div>
            <FileText size={19} className="panel-icon" />
          </div>
          <dl className="facts">
            <div><dt>Capture</dt><dd>{run.filename}</dd></div>
            <div><dt>Source</dt><dd><span className="chip">{run.source}</span></dd></div>
            <div><dt>Link type</dt><dd className="mono">{run.linkType === 1 ? 'Ethernet' : run.linkType}</dd></div>
            <div><dt>Size</dt><dd>{bytes(run.fileSize)}</dd></div>
            <div><dt>Rules</dt><dd className="mono small">{(run.rules?.blockedApps || []).join(', ') || 'none'}</dd></div>
          </dl>
          <div className="protocol-block">
            <p className="eyebrow">TRANSPORT MIX</p>
            <ProtocolSplit protocols={run.protocols || {}} />
          </div>
          <div className="blocked-summary">
            <p className="eyebrow">REFUSED BY RULES</p>
            {(run.flows || []).filter((flow) => flow.blocked).slice(0, 4).map((flow) => (
              <div key={flow.id} className="blocked-row">
                <span className="app-dot app-unknown" />
                <div>
                  <p>{flow.app} · {flow.domain || 'no domain'}</p>
                  <span className="mono tiny muted">{flow.srcIp} → {flow.dstIp}</span>
                </div>
                <span className="verdict blocked">blocked</span>
              </div>
            ))}
            {(run.flows || []).filter((flow) => flow.blocked).length === 0 && (
              <p className="no-blocks">No flows were refused in this run.</p>
            )}
          </div>
        </section>
      </div>

      <FlowTable run={run} />

      <div className="analysis-grid lower">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">TOP DOMAINS</p>
              <h2>Names on the wire.</h2>
            </div>
            <Network size={19} className="panel-icon" />
          </div>
          <div className="domain-list">
            {(run.topDomains || []).map((domain) => (
              <div key={domain.domain} className="domain-row">
                <div>
                  <p>{domain.domain}</p>
                  <span>{domain.app}</span>
                </div>
                <div className="domain-tail">
                  <span className="mono">{domain.packets} pkt</span>
                  <span className="mono muted">{bytes(domain.bytes)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">PACKET TRACE</p>
              <h2>The first packets, in order.</h2>
            </div>
            <Clock3 size={19} className="panel-icon" />
          </div>
          <div className="trace-list">
            {(run.packetTrace || []).slice(0, 16).map((packet, index) => (
              <div key={`${packet.ts}-${index}`} className={`trace-row ${packet.blocked ? 'is-blocked' : ''}`}>
                <span className="mono tiny muted">{time(packet.ts)}</span>
                <span className="mono trace-route">
                  {packet.srcIp}:{packet.srcPort} → {packet.dstIp}:{packet.dstPort}
                </span>
                <span className="trace-app">{packet.app}</span>
                <span className="mono tiny muted">{packet.bytes} B</span>
                <span className={`verdict ${packet.blocked ? 'blocked' : 'allowed'}`}>
                  {packet.blocked ? 'blocked' : 'pass'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="run-footnote">
        <ShieldBan size={13} />
        <span>
          Rules snapshot: {run.rules?.blockedApps?.length || 0} blocked apps, {run.rules?.blockedDomains?.length || 0} blocked domains.
          {run.blockedFlowCount > 0 ? ` ${run.blockedFlowCount} flows would be refused.` : ' No flows were refused in this run.'}
        </span>
      </div>
    </div>
  );
}
