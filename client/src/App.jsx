import { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { WizardProvider, useWizard } from './components/Wizard.jsx';
import { Logo } from './components/Icons.jsx';
import { BRAND, TAGLINE } from './brand.js';
import Home from './pages/Home.jsx';
import Results from './pages/Results.jsx';
import Compare from './pages/Compare.jsx';
import AllPlans from './pages/AllPlans.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Account from './pages/Account.jsx';

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const initials = user.name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="user-menu" ref={ref}>
      <button className="user-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="avatar-circle">{initials}</span>
        {user.name.split(' ')[0]}
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="who">{user.email}</div>
          <Link to="/account" onClick={() => setOpen(false)}>My recommendations</Link>
          <button onClick={() => { logout(); setOpen(false); navigate('/'); }}>Log out</button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user, ready } = useAuth();
  const { start } = useWizard();
  return (
    <header className="header">
      <div className="wrap">
        <Link to="/" className="brand">
          <Logo />
          <span>{BRAND}<small>{TAGLINE}</small></span>
        </Link>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>Health Insurance</NavLink>
          <NavLink to="/all-plans">All Plans</NavLink>
          <a href="/#banks">Partner Banks</a>
          <a href="/#faq">Help</a>
        </nav>
        <div className="header-actions">
          {ready && !user && (
            <>
              <Link className="btn ghost sm" to="/login">Log in</Link>
              <Link className="btn outline sm" to="/register">Register</Link>
            </>
          )}
          {user && <UserMenu />}
          <button className="btn accent sm" onClick={() => start()}>Get quotes</button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <Link to="/" className="brand"><Logo /> {BRAND}</Link>
          <p style={{ marginTop: 14, maxWidth: 320 }}>Compare health insurance plans offered through India’s leading banks, and get a recommendation built around your family.</p>
          <p>Anand, Gujarat, India</p>
        </div>
        <div>
          <h4>Insurance</h4>
          <Link to="/all-plans">All health plans</Link>
          <Link to="/all-plans?category=senior">Senior citizen plans</Link>
          <Link to="/all-plans?category=premier">Premium plans</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/login">Log in</Link>
          <Link to="/register">Create account</Link>
          <Link to="/account">My recommendations</Link>
        </div>
        <div>
          <h4>Help</h4>
          <a href="/#faq">FAQs</a>
          <a href="/#how">How it works</a>
        </div>
        <p className="legal">
          Plan names, premiums and benefits shown are sample data for demonstration and are not offers from the banks named.
          Bank names belong to their respective owners. Final premium and terms are decided by the insurer after underwriting.
        </p>
      </div>
    </footer>
  );
}

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <WizardProvider>
        <ScrollToTop />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/all-plans" element={<AllPlans />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/plans/:id" element={<RequireAuth><Results /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="*" element={<div className="loading">Page not found. <Link to="/">Go home</Link></div>} />
          </Routes>
        </main>
        <Footer />
      </WizardProvider>
    </AuthProvider>
  );
}
