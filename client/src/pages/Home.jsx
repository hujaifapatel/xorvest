import { Link } from 'react-router-dom';

export function Ornament() {
  return (
    <svg className="ornament" viewBox="0 0 120 14" aria-hidden="true">
      <line x1="0" y1="7" x2="48" y2="7" stroke="currentColor" strokeWidth="0.8" />
      <line x1="72" y1="7" x2="120" y2="7" stroke="currentColor" strokeWidth="0.8" />
      <path d="M60 1 L66 7 L60 13 L54 7 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="60" cy="7" r="1.4" fill="currentColor" />
      <circle cx="51" cy="7" r="0.9" fill="currentColor" />
      <circle cx="69" cy="7" r="0.9" fill="currentColor" />
    </svg>
  );
}

function Seal() {
  return (
    <svg className="seal" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="33" fill="#6a1f22" />
      <circle cx="36" cy="36" r="27" fill="none" stroke="#e7cfb8" strokeWidth="0.6" strokeDasharray="1.5 2.2" />
      <circle cx="36" cy="36" r="22" fill="none" stroke="#e7cfb8" strokeWidth="0.6" />
      <text x="36" y="44" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="24" fill="#f0dcc4" fontStyle="italic">X</text>
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <section className="wrap hero">
        <div>
          <div className="eyebrow">Health assurance, considered</div>
          <h1 style={{ marginTop: 14 }}>
            Sound counsel on the matter of your family’s <em>health</em>.
          </h1>
          <p className="lede">
            Most people choose health insurance in a hurry, often from whoever calls first. We would rather you chose it once,
            and chose it well. Answer fourteen questions about your household and we will set out which policies suit
            you, which do not, and why, in plain terms.
          </p>
          <div className="hero-cta">
            <Link className="btn" to="/consultation">
              Begin the consultation <span className="arrow">→</span>
            </Link>
            <span className="aside">About six minutes. No telephone number required.</span>
          </div>
        </div>

        <aside className="letter">
          <Seal />
          <div className="eyebrow">What you will receive</div>
          <h2>A written recommendation, prepared for your household alone.</h2>
          <ol>
            <li><span>The sum insured we judge prudent, and how we arrived at it.</span></li>
            <li><span>A shortlist of policies ranked against your own priorities.</span></li>
            <li><span>An honest note of each policy’s limits, waiting periods and co-payments.</span></li>
            <li><span>A side-by-side comparison of any three you care to examine.</span></li>
          </ol>
          <div className="sign">— with our compliments</div>
        </aside>
      </section>

      <section className="wrap method" id="method">
        <div className="section-head">
          <h2>Our Method</h2>
          <hr className="rule" />
        </div>
        <div className="three">
          <div>
            <div className="numeral">I.</div>
            <h3>We ask, and we listen</h3>
            <p>
              Fourteen questions, in four short chapters: the household, its health, its means and its preferences.
              Nothing is asked that does not bear on the advice.
            </p>
          </div>
          <div>
            <div className="numeral">II.</div>
            <h3>We weigh every policy</h3>
            <p>
              Each plan in our register is tested for eligibility, priced for your household and city, and scored on
              cost, breadth of cover, claims record and hospital network, weighted as you would weigh them.
            </p>
          </div>
          <div>
            <div className="numeral">III.</div>
            <h3>We say so plainly</h3>
            <p>
              Each recommendation comes with its reasons and its drawbacks. Where a policy falls short of what you
              asked, we say so.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap maxim">
        <Ornament />
        <blockquote>Prudence is never so inexpensive as when it is purchased early.</blockquote>
        <cite className="smallcaps">A maxim of the house</cite>
      </section>
    </>
  );
}
