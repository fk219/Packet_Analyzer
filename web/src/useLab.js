import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export function useLab() {
  const [runs, setRuns] = useState([]);
  const [run, setRun] = useState(null);
  const [rules, setRules] = useState({ blockedApps: [], blockedDomains: [], blockedIps: [] });
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshRuns = useCallback(async () => {
    const response = await api.runs(20);
    setRuns(response.items);
    return response.items;
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.runs(20), api.rules(), api.apps()])
      .then(async ([runsResponse, rulesResponse, appsResponse]) => {
        if (!active) return;
        setRuns(runsResponse.items);
        setRules(rulesResponse.rules);
        setApps(appsResponse.apps);
        if (runsResponse.items[0]) {
          const detail = await api.run(runsResponse.items[0].id);
          if (active) setRun(detail.run);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const withAction = async (name, task) => {
    setAction(name);
    setError('');
    setNotice('');
    try {
      return await task();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setAction('');
    }
  };

  const analyzeFile = (file) =>
    withAction('analyze', async () => {
      const response = await api.analyze(file);
      setRun(response.run);
      await refreshRuns();
      setNotice(`Analyzed ${response.run.filename}.`);
      return response.run;
    });

  const runDemo = () =>
    withAction('demo', async () => {
      const response = await api.demo();
      setRun(response.run);
      await refreshRuns();
      setNotice('Demo capture analyzed.');
      return response.run;
    });

  const loadRun = (id) =>
    withAction('load', async () => {
      const response = await api.run(id);
      setRun(response.run);
      return response.run;
    });

  const saveRules = (next) =>
    withAction('rules', async () => {
      const response = await api.updateRules(next);
      setRules(response.rules);
      setApps(response.apps);
      setNotice('Rules saved. Run a capture to apply them.');
      return response.rules;
    });

  const removeRun = (id) =>
    withAction('delete', async () => {
      await api.deleteRun(id);
      const nextRuns = await refreshRuns();
      if (run?.id === id) {
        if (nextRuns[0]) {
          const detail = await api.run(nextRuns[0].id);
          setRun(detail.run);
        } else {
          setRun(null);
        }
      }
      setNotice('Capture removed from history.');
    });

  return {
    runs,
    run,
    rules,
    apps,
    loading,
    action,
    error,
    notice,
    setNotice,
    setError,
    analyzeFile,
    runDemo,
    loadRun,
    saveRules,
    removeRun,
    refreshRuns
  };
}
