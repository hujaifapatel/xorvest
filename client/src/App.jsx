import { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { WizardProvider, useWizard } from './components/Wizard.jsx';
import { InterestsProvider, useInterests } from './lib/interests.jsx';
import Interested from './pages/Interested.jsx';
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
          <Link to="/interested" onClick={() => setOpen(false)}>Interested plans</Link>
          <button onClick={() => { logout(); setOpen(false); navigate('/'); }}>Log out</button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user, ready } = useAuth();
  const { start } = useWizard();
  const { count } = useInterests();
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
          <Link to="/#why">Why Insurance</Link>
          <Link to="/#banks">Partner Banks</Link>
          <Link to="/#faq">Help</Link>
          {user && <NavLink to="/interested">Interested{count > 0 && <span className="nav-count">{count}</span>}</NavLink>}
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
          <Link to="/interested">Interested plans</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link to="/#why">Why buy insurance</Link>
          <Link to="/#faq">FAQs</Link>
          <Link to="/#how">How it works</Link>
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
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    // Sections above the anchor (e.g. bank cards) can load late and push it
    // down, so keep it aligned for the first second.
    let ticks = 0;
    const id = setInterval(() => {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        const offset = el.getBoundingClientRect().top - 76;
        if (Math.abs(offset) > 2) window.scrollTo(0, window.scrollY + offset);
      }
      if (++ticks > 20) clearInterval(id);
    }, 50);
    const stop = () => clearInterval(id);
    window.addEventListener('wheel', stop, { once: true });
    window.addEventListener('touchstart', stop, { once: true });
    return () => {
      stop();
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
    };
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <InterestsProvider>
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
            <Route path="/interested" element={<RequireAuth><Interested /></RequireAuth>} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="*" element={<div className="loading">Page not found. <Link to="/">Go home</Link></div>} />
          </Routes>
        </main>
        <Footer />
      </WizardProvider>
      </InterestsProvider>
    </AuthProvider>
  );
}
