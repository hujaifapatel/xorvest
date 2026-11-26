async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.errors?.join('; ') || body.error || `Request failed (${res.status})`);
  return body;
}

export const api = {
  questions: () => request('/questions'),
  plans: (slugs) => request(`/plans${slugs ? `?slugs=${encodeURIComponent(slugs.join(','))}` : ''}`),
  assess: (answers) => request('/assessments', { method: 'POST', body: JSON.stringify({ answers }) }),
  assessment: (id) => request(`/assessments/${id}`),
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
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable; progress simply won't survive a reload */
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
