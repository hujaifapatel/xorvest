// Page layout (header + footer) and the list of pages (routes).
import { useEffect } from 'react';
import { Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom';
import { SessionProvider, useSession } from './lib/session.jsx';
import { WizardProvider, useWizard } from './components/Wizard.jsx';
import { Logo } from './components/ui.jsx';
import { BRAND, TAGLINE } from './brand.js';
import Home from './pages/Home.jsx';
import Results from './pages/Results.jsx';
import Compare from './pages/Compare.jsx';
import AllPlans from './pages/AllPlans.jsx';
import Account from './pages/Account.jsx';
import AuthPage from './pages/AuthPage.jsx';

function Header() {
  const { user, ready, interests, logout } = useSession();
  const { start } = useWizard();
  return (
    <header className="header">
      <div className="wrap">
        <Link to="/" className="brand"><Logo /><span>{BRAND}<small>{TAGLINE}</small></span></Link>
        <nav className="nav">
          <NavLink to="/all-plans">All Plans</NavLink>
          <Link to="/#why">Why Insurance</Link>
          <Link to="/#banks">Partner Banks</Link>
          <Link to="/#faq">Help</Link>
        </nav>
        <div className="header-actions">
          {ready && !user && <><Link className="btn ghost sm" to="/login">Log in</Link><Link className="btn outline sm hide-sm" to="/register">Register</Link></>}
          {user && (
            <>
              <Link className="btn ghost sm" to="/account">My account{interests.length > 0 && <span className="nav-count">{interests.length}</span>}</Link>
              <button className="btn ghost sm hide-sm" onClick={logout}>Log out</button>
            </>
          )}
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
          <p>Compare health plans from India’s leading banks, matched to your family.</p>
          <p>Anand, Gujarat, India</p>
        </div>
        <div><h4>Plans</h4><Link to="/all-plans">All health plans</Link><Link to="/#banks">Partner banks</Link></div>
        <div><h4>Account</h4><Link to="/login">Log in</Link><Link to="/register">Register</Link><Link to="/account">My account</Link></div>
        <div><h4>Help</h4><Link to="/#why">Why buy insurance</Link><Link to="/#faq">FAQs</Link></div>
        <p className="legal">Plan names, prices and figures are sample data for demonstration, not offers from the banks named. Final premium and terms are set by the insurer.</p>
      </div>
    </footer>
  );
}

// Pages that need a logged-in user send visitors to /login first.
function Private({ children }) {
  const { user, ready } = useSession();
  const { pathname } = useLocation();
  if (!ready) return <div className="loading">Loading…</div>;
  return user ? children : <Navigate to={`/login?next=${pathname}`} replace />;
}

// Scroll to top on page change, or to #section for links like /#faq.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const timers = [50, 400, 900].map((ms) => setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), ms)); // re-align after content loads
    return () => timers.forEach(clearTimeout);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <SessionProvider>
      <WizardProvider>
        <ScrollManager />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/all-plans" element={<AllPlans />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/plans/:id" element={<Private><Results /></Private>} />
            <Route path="/account" element={<Private><Account /></Private>} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="*" element={<div className="loading">Page not found. <Link to="/">Go home</Link></div>} />
          </Routes>
        </main>
        <Footer />
      </WizardProvider>
    </SessionProvider>
  );
}
