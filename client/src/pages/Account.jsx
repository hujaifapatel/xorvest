// "My account": saved recommendations and the interested plans bucket.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useSession } from '../lib/session.jsx';
import { useWizard } from '../components/Wizard.jsx';
import { BankMono, InterestButton } from '../components/ui.jsx';
import { rupees, cover, ROOM } from '../lib/format.js';

const date = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Account() {
  const { user, interests, logout } = useSession();
  const { start } = useWizard();
  const [history, setHistory] = useState(null);

  useEffect(() => {
    api.assessments().then(setHistory).catch(() => setHistory([]));
  }, []);

  return (
    <div className="wrap" style={{ paddingBottom: 72, maxWidth: 960 }}>
      <div className="page-head row">
        <div><h1>Hi {user.name.split(' ')[0]}</h1><p>Your saved recommendations and shortlisted plans.</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn outline" onClick={logout}>Log out</button>
          <button className="btn accent" onClick={() => start()}>New recommendation</button>
        </div>
      </div>

      <h2 className="sub-head" id="interested">Interested plans ({interests.length})</h2>
      {!interests.length && <div className="empty"><p>Tap “I’m interested” on any plan to save it here.</p></div>}
      <div className="history">
        {interests.map(({ plan: p, monthly, sumInsured, match, assessment }) => (
          <div className="interest-card" key={p.slug}>
            <BankMono plan={p} large />
            <div className="ic-main">
              <span className="bank">{p.bankName}</span>
              <h3>{p.name}</h3>
              <p>{ROOM[p.roomRent]} · Existing illness after {p.pedWaitingYears} yr(s) · {p.claimSettlementRatio}% claims settled</p>
              {assessment && <Link to={`/plans/${assessment}`}>From your recommendation</Link>}
            </div>
            <div className="ic-price">
              {monthly ? <><b>{rupees(monthly)}<small>/month</small></b><span>{cover(sumInsured)} cover · {match}% match</span></> : <span>Get a quote to see your price</span>}
              <InterestButton slug={p.slug} name={p.name} small />
            </div>
          </div>
        ))}
      </div>
      {interests.length >= 2 && (
        <Link className="btn outline" style={{ marginTop: 14 }} to={`/compare?plans=${interests.slice(0, 3).map((i) => i.plan.slug).join(',')}`}>
          Compare my interested plans
        </Link>
      )}

      <h2 className="sub-head">Past recommendations</h2>
      {history && !history.length && <div className="empty"><p>No recommendations yet.</p><button className="btn" onClick={() => start()}>Get started</button></div>}
      <div className="history">
        {history?.map((h) => (
          <div className="history-item" key={h.id}>
            <div>
              <h3>{cover(h.profile.recommendedSumInsured)} cover for {h.profile.lives} member{h.profile.lives > 1 ? 's' : ''}</h3>
              <p>{date(h.createdAt)}{h.top && ` · Top pick: ${h.top.insurer} ${h.top.name} at ${rupees(h.top.premium.monthly)}/month`}</p>
            </div>
            <Link className="btn outline sm" to={`/plans/${h.id}`}>View plans</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
