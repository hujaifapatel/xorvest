import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const next = params.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';

  useEffect(() => {
    if (user) navigate(safeNext, { replace: true });
  }, [user, navigate, safeNext]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthForm key={mode} initialMode={mode} onDone={() => navigate(safeNext, { replace: true })} />
      </div>
    </div>
  );
}
