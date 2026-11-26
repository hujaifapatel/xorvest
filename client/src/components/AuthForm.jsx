// Register / log in form, used on its own pages and inside the questionnaire pop-up.
import { useState } from 'react';
import { useSession } from '../lib/session.jsx';

export default function AuthForm({ initialMode = 'register', compact, onDone }) {
  const session = useSession();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await (isRegister ? session.register(form) : session.login(form));
      onDone?.();
    } catch (err) {
      setMessage(err.message);
      setErrors(err.fields || {});
      if (err.status === 409) setMode('login'); // already registered → switch to login
    } finally {
      setBusy(false);
    }
  };

  const field = (key, label, props = {}) => (
    <label className={`field${errors[key] ? ' bad' : ''}`}>
      <span>{label}</span>
      <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
      {errors[key] && <em>{errors[key]}</em>}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate>
      {!compact && <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>}
      {message && <div className="alert" role="alert">{message}</div>}
      {isRegister && field('name', 'Full name', { autoComplete: 'name' })}
      {field('email', 'Email address', { type: 'email', autoComplete: 'email' })}
      {isRegister && field('mobile', 'Mobile number (optional)', { inputMode: 'numeric', maxLength: 10, placeholder: '10-digit mobile' })}
      {field('password', 'Password', { type: 'password', autoComplete: isRegister ? 'new-password' : 'current-password', placeholder: isRegister ? 'At least 8 characters' : '' })}
      <button className="btn accent block" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button>
      <p className="form-alt">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <button type="button" className="linkbtn" onClick={() => { setMode(isRegister ? 'login' : 'register'); setMessage(''); setErrors({}); }}>
          {isRegister ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </form>
  );
}
