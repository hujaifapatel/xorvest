import { useEffect } from 'react';
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Wizard from './pages/Wizard.jsx';
import Results from './pages/Results.jsx';
import Compare from './pages/Compare.jsx';
import Register from './pages/Register.jsx';

function Masthead() {
  return (
    <header>
      <div className="wrap">
        <div className="topline">
          <span>Est. MMXXVI · Bombay</span>
          <span>Independent counsel · No fee to the client</span>
        </div>
        <div className="masthead">
          <Link to="/" className="wordmark">XORVEST</Link>
          <div className="tagline">Counsel on the assurance of health</div>
        </div>
        <hr className="double-rule" />
        <nav className="nav" aria-label="Primary">
          <NavLink to="/consultation">The Consultation</NavLink>
          <NavLink to="/register">The Register</NavLink>
          <a href="/#method">Our Method</a>
        </nav>
        <hr className="rule" />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <div className="wordmark">XORVEST</div>
          <p style={{ marginTop: 14, maxWidth: '24em' }}>
            A private register of health assurance, kept for Indian households who prefer a considered answer to a
            hurried one.
          </p>
        </div>
        <div>
          <h4>The House</h4>
          <p><Link to="/consultation">Begin a consultation</Link></p>
          <p><Link to="/register">Consult the register</Link></p>
          <p><a href="/#method">How we arrive at advice</a></p>
        </div>
        <div>
          <h4>Correspondence</h4>
          <p>By appointment only</p>
          <p>Weekdays, ten until six</p>
          <p>counsel@xorvest.example</p>
        </div>
      </div>
      <div className="fineprint">
        <div className="wrap">
          The insurers and figures shown are illustrative and do not represent offers from any real insurer. Premiums
          are estimates inclusive of GST; final terms are set by the insurer after underwriting. Xorvest is not a
          licensed insurance intermediary.
        </div>
      </div>
    </footer>
  );
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
    <>
      <ScrollToTop />
      <Masthead />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/consultation" element={<Wizard />} />
          <Route path="/recommendation/:id" element={<Results />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<div className="wrap loading">This page is not in our register. <Link to="/">Return home.</Link></div>} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
