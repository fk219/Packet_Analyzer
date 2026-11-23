const base = import.meta.env.VITE_API_URL || '';
const operatorToken = import.meta.env.VITE_DEMO_ADMIN_TOKEN || 'demo-operator-key';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, options = {}) {
  const headers = options.body instanceof FormData
    ? { 'x-demo-admin-token': operatorToken, ...(options.headers || {}) }
    : {
        'content-type': 'application/json',
        'x-demo-admin-token': operatorToken,
        ...(options.headers || {})
      };
  const method = String(options.method || 'GET').toUpperCase();
  const maxAttempts = method === 'GET' ? 3 : 2;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${base}${path}`, { ...options, headers });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data;

      lastError = new Error(data?.error?.message || `Request failed (${response.status})`);
      const retryable = [502, 503, 504].includes(response.status);
      if (!retryable || attempt === maxAttempts) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) throw error;
    }
    await wait(1200 * attempt);
  }

  throw lastError;
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
