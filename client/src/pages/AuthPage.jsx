// /login and /register pages.
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useSession } from '../lib/session.jsx';

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const { user } = useSession();
  const next = useSearchParams()[0].get('next');
  const target = next?.startsWith('/') && !next.startsWith('//') ? next : '/account'; // only same-site redirects

  useEffect(() => {
    if (user) navigate(target, { replace: true });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="auth-page">
      <div className="auth-card"><AuthForm key={mode} initialMode={mode} /></div>
    </div>
  );
}
