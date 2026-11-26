// Who is logged in, plus their "interested" plans. Any component can read it with useSession().
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, token } from './api.js';

const Session = createContext(null);
export const useSession = () => useContext(Session);

export function SessionProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!token.get());
  const [interests, setInterests] = useState([]);

  // On page load, turn a saved token back into a user.
  useEffect(() => {
    if (token.get()) api.me().then((r) => setUser(r.user)).catch(() => token.set(null)).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (user) api.interests().then(setInterests).catch(() => {});
    else setInterests([]);
  }, [user]);

  const signIn = ({ token: t, user: u }) => {
    token.set(t);
    setUser(u);
  };
  const isInterested = (slug) => interests.some((i) => i.plan.slug === slug);

  const value = {
    user,
    ready,
    interests,
    isInterested,
    login: async (form) => signIn(await api.login(form)),
    register: async (form) => signIn(await api.register(form)),
    logout: () => {
      token.set(null);
      setUser(null);
    },
    toggleInterest: async (slug, assessmentId) => {
      if (!user) return navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      setInterests(isInterested(slug) ? await api.removeInterest(slug) : await api.addInterest(slug, assessmentId));
    },
  };
  return <Session.Provider value={value}>{children}</Session.Provider>;
}
