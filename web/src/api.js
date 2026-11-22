const base = import.meta.env.VITE_API_URL || '';
const operatorToken = import.meta.env.VITE_DEMO_ADMIN_TOKEN || 'demo-operator-key';

async function request(path, options = {}) {
  const headers = options.body instanceof FormData
    ? { 'x-demo-admin-token': operatorToken, ...(options.headers || {}) }
    : {
        'content-type': 'application/json',
        'x-demo-admin-token': operatorToken,
        ...(options.headers || {})
      };
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Request failed (${response.status})`);
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  apps: () => request('/api/apps'),
  rules: () => request('/api/rules'),
  updateRules: (rules) =>
    request('/api/rules', { method: 'PUT', body: JSON.stringify(rules) }),
  runs: (limit = 20) => request(`/api/runs?limit=${limit}`),
  run: (id) => request(`/api/runs/${id}`),
  deleteRun: (id) => request(`/api/runs/${id}`, { method: 'DELETE' }),
  analyze: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/api/analyze', { method: 'POST', body: form });
  },
  demo: () => request('/api/analyze/demo', { method: 'POST', body: '{}' })
};
