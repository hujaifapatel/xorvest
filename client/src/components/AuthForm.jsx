import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';

function Field({ label, error, children }) {
  return (
    <label className={`field${error ? ' bad' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <em>{error}</em>}
    </label>
  );
}

export default function AuthForm({ initialMode = 'register', onDone, compact = false }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setErrors({});
    try {
      const user = mode === 'register'
        ? await register({ ...form, email: form.email.trim(), mobile: form.mobile.trim() })
        : await login({ email: form.email.trim(), password: form.password });
      onDone?.(user);
    } catch (err) {
      setMessage(err.message);
      if (err.fields) setErrors(err.fields);
      if (err.status === 409) setMode('login');
    } finally {
      setBusy(false);
    }
  };

  const isReg = mode === 'register';

  return (
    <form onSubmit={submit} noValidate>
      {!compact && (
        <>
          <h1>{isReg ? 'Create your account' : 'Welcome back'}</h1>
          <p className="lead">{isReg ? 'Save your recommendations and compare plans any time.' : 'Log in to see your saved plans.'}</p>
        </>
      )}
      {message && <div className="alert" role="alert">{message}</div>}

      {isReg && (
        <Field label="Full name" error={errors.name}>
          <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="As on your ID" />
        </Field>
      )}
      <Field label="Email address" error={errors.email}>
        <input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" />
      </Field>
      {isReg && (
        <Field label="Mobile number (optional)" error={errors.mobile}>
          <div className="prefix">
            <b>+91</b>
            <input inputMode="numeric" maxLength={10} value={form.mobile} onChange={set('mobile')} autoComplete="tel-national" placeholder="10-digit mobile" />
          </div>
        </Field>
      )}
      <Field label="Password" error={errors.password}>
        <input type="password" value={form.password} onChange={set('password')} autoComplete={isReg ? 'new-password' : 'current-password'} placeholder={isReg ? 'At least 8 characters' : ''} />
      </Field>

      <button className="btn accent block" type="submit" disabled={busy}>
        {busy ? 'Please wait…' : isReg ? 'Create account' : 'Log in'}
      </button>

      <p className="form-alt">
        {isReg ? 'Already have an account? ' : 'New here? '}
        <button type="button" className="linkbtn" onClick={() => { setMode(isReg ? 'login' : 'register'); setMessage(''); setErrors({}); }}>
          {isReg ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </form>
  );
}
