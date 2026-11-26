// Talks to the Express API. The login token lives in localStorage and is sent with every request.
const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };

export const token = {
  get: () => safe(() => localStorage.getItem('token'), null),
  set: (t) => safe(() => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'))),
};

// Questionnaire answers survive a page refresh (sessionStorage).
export const store = {
  get: (key, fallback) => safe(() => JSON.parse(sessionStorage.getItem(key)) ?? fallback, fallback),
  set: (key, value) => safe(() => sessionStorage.setItem(key, JSON.stringify(value))),
};

async function request(path, method = 'GET', body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token.get() && { Authorization: `Bearer ${token.get()}` }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { status: res.status, fields: data.fields });
  return data;
}

export const api = {
  questions: () => request('/questions'),
  banks: () => request('/banks'),
  plans: (slugs) => request(`/plans${slugs ? `?slugs=${slugs.join(',')}` : ''}`),
  register: (form) => request('/auth/register', 'POST', form),
  login: (form) => request('/auth/login', 'POST', form),
  me: () => request('/auth/me'),
  assess: (answers) => request('/assessments', 'POST', { answers }),
  assessments: () => request('/assessments'),
  assessment: (id) => request(`/assessments/${id}`),
  interests: () => request('/interests'),
  addInterest: (planSlug, assessmentId) => request('/interests', 'POST', { planSlug, assessmentId }),
  removeInterest: (slug) => request(`/interests/${slug}`, 'DELETE'),
};
