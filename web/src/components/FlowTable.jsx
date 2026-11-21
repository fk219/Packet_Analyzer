import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

const bytes = (value) => {
  if (!value) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
};

export function FlowTable({ run }) {
  const [search, setSearch] = useState('');
  const [appFilter, setAppFilter] = useState('ALL');
  const [blockedOnly, setBlockedOnly] = useState(false);

  const apps = useMemo(
    () => ['ALL', ...Array.from(new Set((run?.flows || []).map((flow) => flow.app))).sort()],
    [run]
  );

  const flows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (run?.flows || []).filter((flow) => {
      if (appFilter !== 'ALL' && flow.app !== appFilter) return false;
      if (blockedOnly && !flow.blocked) return false;
      if (!term) return true;
      return [flow.srcIp, flow.dstIp, flow.domain, flow.app, String(flow.srcPort), String(flow.dstPort)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [run, search, appFilter, blockedOnly]);

  return (
    <section className="panel flows-panel">
      <div className="panel-head flows-head">
        <div>
          <p className="eyebrow">FLOW TABLE</p>
          <h2>What the capture holds.</h2>
        </div>
        <div className="flow-controls">
          <label className="search-box">
            <Search size={13} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="IP, port, domain, app"
            />
          </label>
          <select value={appFilter} onChange={(event) => setAppFilter(event.target.value)}>
            {apps.map((app) => (
              <option key={app} value={app}>{app === 'ALL' ? 'All apps' : app}</option>
            ))}
          </select>
          <button
            type="button"
            className={`filter-button ${blockedOnly ? 'is-active' : ''}`}
            onClick={() => setBlockedOnly((value) => !value)}
          >
            Blocked only
          </button>
        </div>
      </div>

      <div className="table-meta">
        <span>{flows.length} of {run?.flows?.length || 0} flows shown</span>
        <span>{run?.flowCount || 0} unique flows in the capture</span>
      </div>

      <div className="table-wrap">
        <table className="flow-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>App / domain</th>
              <th>Packets</th>
              <th>Bytes</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {flows.map((flow) => (
              <tr key={flow.id} className={flow.blocked ? 'is-blocked' : ''}>
                <td>
                  <span className="mono">{flow.srcIp}:{flow.srcPort}</span>
                  <span className="sub">{flow.protocol}</span>
                </td>
                <td>
                  <span className="mono">{flow.dstIp}:{flow.dstPort}</span>
                  <span className="sub">flow {String(flow.id).padStart(3, '0')}</span>
                </td>
                <td>
                  <span className={`app-dot app-${flow.app.toLowerCase().replace(/[^a-z]/g, '')}`} />
                  <strong>{flow.app}</strong>
                  <span className="sub">{flow.domain || 'no SNI / host'}</span>
                </td>
                <td className="mono">{flow.packets}</td>
                <td className="mono">{bytes(flow.bytes)}</td>
                <td>
                  <span className={`verdict ${flow.blocked ? 'blocked' : 'allowed'}`}>
                    {flow.blocked ? 'blocked' : 'allowed'}
                  </span>
                </td>
              </tr>
            ))}
            {flows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">No flows match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
