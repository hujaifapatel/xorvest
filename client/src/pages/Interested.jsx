import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInterests } from '../lib/interests.jsx';
import { useWizard } from '../components/Wizard.jsx';
import BankMono from '../components/BankMono.jsx';
import InterestButton from '../components/InterestButton.jsx';
import { rupees, cover, ROOM } from '../lib/format.js';

export default function Interested() {
  const { items } = useInterests();
  const { start } = useWizard();
  const navigate = useNavigate();
  const [picked, setPicked] = useState([]);
  const togglePick = (slug) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : p.length < 3 ? [...p, slug] : p));

  return (
    <div className="wrap" style={{ paddingBottom: 110, maxWidth: 960 }}>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Interested plans</h1>
          <p>Plans you’ve shortlisted. Tick two or three to compare them side by side.</p>
        </div>
        {picked.length >= 2 && (
          <button className="btn" onClick={() => navigate(`/compare?plans=${picked.join(',')}`)}>Compare {picked.length} plans</button>
        )}
      </div>

      {!items.length && (
        <div className="empty">
          <h3>Nothing here yet</h3>
          <p>Tap “I’m interested” on any plan to save it to this list.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn" onClick={() => start()}>Get recommendations</button>
            <Link className="btn outline" to="/all-plans">Browse all plans</Link>
          </div>
        </div>
      )}

      <div className="history">
        {items.map(({ plan: p, monthly, annual, sumInsured, match, assessment, createdAt }) => (
          <div className="interest-card" key={p.slug}>
            <label className="check pick" title="Select to compare">
              <input type="checkbox" aria-label={`Select ${p.name} to compare`} checked={picked.includes(p.slug)} disabled={!picked.includes(p.slug) && picked.length >= 3} onChange={() => togglePick(p.slug)} />
            </label>
            <BankMono monogram={p.monogram} tint={p.tint} size="lg" />
            <div className="ic-main">
              <span className="bank">{p.bankName}</span>
              <h3>{p.name}</h3>
              <p>
                {ROOM[p.roomRent]} · Existing illness after {p.pedWaitingYears} yr{p.pedWaitingYears > 1 ? 's' : ''} · {p.claimSettlementRatio}% claims settled
              </p>
              <small>
                Added {new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {assessment && <> · <Link to={`/plans/${assessment}`}>from your recommendation</Link></>}
              </small>
            </div>
            <div className="ic-price">
              {monthly ? (
                <>
                  <b className="num">{rupees(monthly)}<small>/month</small></b>
                  <span className="num">{cover(sumInsured)} cover · {match}% match</span>
                  <span className="num">{rupees(annual)} a year</span>
                </>
              ) : (
                <span>Get a quote for your family to see the price</span>
              )}
              <InterestButton planSlug={p.slug} planName={p.name} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
