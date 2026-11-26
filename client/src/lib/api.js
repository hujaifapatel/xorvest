const TOKEN_KEY = 'pr.token';

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(t) {
    try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  },
};

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.fields = body?.fields;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.errors?.join('; ') || data.error || `Request failed (${res.status})`, res.status, data);
  return data;
}

export const api = {
  questions: () => request('/questions'),
  banks: () => request('/banks'),
  plans: ({ slugs, bank } = {}) => {
    const q = new URLSearchParams();
    if (slugs) q.set('slugs', slugs.join(','));
    if (bank) q.set('bank', bank);
    return request(`/plans${q.size ? `?${q}` : ''}`);
  },
  assess: (answers) => request('/assessments', { method: 'POST', body: { answers } }),
  assessments: () => request('/assessments'),
  assessment: (id) => request(`/assessments/${id}`),
  register: (form) => request('/auth/register', { method: 'POST', body: form }),
  login: (form) => request('/auth/login', { method: 'POST', body: form }),
  me: () => request('/auth/me'),
};

export const store = {
  get(key, fallback) {
    try {
      const v = sessionStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
  remove(key) {
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
  },
};
