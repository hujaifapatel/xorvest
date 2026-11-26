import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

const InterestsContext = createContext(null);

export function InterestsProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null); // slug being saved

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    api.interests().then(setItems).catch(() => setItems([]));
  }, [user]);

  const slugs = useMemo(() => new Set(items.map((i) => i.plan.slug)), [items]);

  const toggle = useCallback(async (planSlug, assessmentId) => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setBusy(planSlug);
    try {
      setItems(slugs.has(planSlug) ? await api.removeInterest(planSlug) : await api.addInterest(planSlug, assessmentId));
    } finally {
      setBusy(null);
    }
  }, [user, slugs, navigate, location]);

  const value = useMemo(() => ({ items, slugs, toggle, busy, count: items.length }), [items, slugs, toggle, busy]);
  return <InterestsContext.Provider value={value}>{children}</InterestsContext.Provider>;
}

export const useInterests = () => useContext(InterestsContext);
