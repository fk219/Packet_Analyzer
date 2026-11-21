import { useEffect, useState } from 'react';
import { Save, ShieldBan } from 'lucide-react';

export function RulesPanel({ data }) {
  const [blockedApps, setBlockedApps] = useState(data.rules?.blockedApps || []);
  const [blockedDomains, setBlockedDomains] = useState((data.rules?.blockedDomains || []).join(', '));
  const busy = Boolean(data.action);

  useEffect(() => {
    setBlockedApps(data.rules?.blockedApps || []);
    setBlockedDomains((data.rules?.blockedDomains || []).join(', '));
  }, [data.rules]);

  const toggle = (app) => {
    setBlockedApps((current) =>
      current.includes(app) ? current.filter((item) => item !== app) : [...current, app]
    );
  };

  const save = () => {
    void data.saveRules({
      blockedApps,
      blockedDomains: blockedDomains
        .split(',')
        .map((domain) => domain.trim())
        .filter(Boolean)
    });
  };

  return (
    <section className="panel rules-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">02 / BLOCKING RULES</p>
          <h2>What should the wire refuse?</h2>
        </div>
        <ShieldBan size={20} className="panel-icon" />
      </div>

      <div className="rules-apps">
        {data.apps.map((app) => (
          <label key={app} className={`rule-toggle ${blockedApps.includes(app) ? 'is-blocked' : ''}`}>
            <input
              type="checkbox"
              checked={blockedApps.includes(app)}
              onChange={() => toggle(app)}
              disabled={busy}
            />
            <span>{app}</span>
          </label>
        ))}
      </div>

      <label className="domain-rule">
        <span>Blocked domains</span>
        <input
          type="text"
          value={blockedDomains}
          onChange={(event) => setBlockedDomains(event.target.value)}
          placeholder="example.com, ads.example.net"
          disabled={busy}
        />
      </label>

      <div className="rules-foot">
        <p>Rules apply to the next capture. Existing runs keep their rule snapshot.</p>
        <button type="button" className="btn primary small" onClick={save} disabled={busy}>
          <Save size={13} />
          {data.action === 'rules' ? 'Saving…' : 'Save rules'}
        </button>
      </div>
    </section>
  );
}
