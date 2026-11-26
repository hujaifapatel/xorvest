import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api.me()
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  const accept = useCallback(({ token, user: u }) => {
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      login: async (form) => accept(await api.login(form)),
      register: async (form) => accept(await api.register(form)),
      logout: () => {
        tokenStore.set(null);
        setUser(null);
      },
    }),
    [user, ready, accept]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
