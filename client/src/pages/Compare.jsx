// Side-by-side table of 2–3 plans (/compare?plans=a,b,c).
import { Fragment, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useSession } from '../lib/session.jsx';
import { rupees, cover, ROOM, RESTORE } from '../lib/format.js';
import { BankMono, InterestButton } from '../components/ui.jsx';

// Each row: [label, what to show, score where higher is better (optional, used for ★)]
const ROWS = {
  'In hospital': [
    ['Room rent', (p) => ROOM[p.roomRent], (p) => ['1pct', 'shared', 'single-private', 'no-limit'].indexOf(p.roomRent)],
    ['Co-payment', (p) => (p.copayPct ? `${p.copayPct}%` : 'None'), (p) => -p.copayPct],
    ['Before / after admission', (p) => `${p.preHospDays} / ${p.postHospDays} days`, (p) => p.preHospDays + p.postHospDays],
    ['Consumables', (p) => (p.consumables ? 'Covered' : 'Not covered'), (p) => +!!p.consumables],
  ],
  'Waiting periods': [
    ['Existing illness', (p) => `${p.pedWaitingYears} year(s)`, (p) => -p.pedWaitingYears],
    ['Maternity', (p) => (p.maternity?.covered ? `${rupees(p.maternity.limit)} after ${p.maternity.waitingYears} yrs` : 'Not covered'), (p) => (p.maternity?.covered ? 10 - p.maternity.waitingYears : 0)],
  ],
  Benefits: [
    ['Restore benefit', (p) => RESTORE[p.restore], (p) => ['none', 'once', 'unlimited'].indexOf(p.restore)],
    ['No-claim bonus', (p) => (p.ncb?.max ? `up to ${p.ncb.max}%` : 'None'), (p) => p.ncb?.max || 0],
    ['OPD / consultations', (p) => (p.opd?.covered ? `Up to ${rupees(p.opd.limit)}` : 'Not covered'), (p) => p.opd?.limit || 0],
    ['Health check-up', (p) => (p.healthCheckup ? 'Included' : '–'), (p) => +!!p.healthCheckup],
  ],
  'Bank & claims': [
    ['Claims settled', (p) => `${p.claimSettlementRatio}%`, (p) => p.claimSettlementRatio],
    ['Average claim time', (p) => `${p.claimTatDays} days`, (p) => -p.claimTatDays],
    ['Cashless hospitals', (p) => p.networkHospitals.toLocaleString('en-IN'), (p) => p.networkHospitals],
    ['Max entry age', (p) => `${p.maxEntryAge} years`, (p) => p.maxEntryAge],
  ],
};

export default function Compare() {
  const [params] = useSearchParams();
  const { user } = useSession();
  const slugs = (params.get('plans') || '').split(',').filter(Boolean).slice(0, 3);
  const assessmentId = params.get('a');
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    // If we came from a recommendation, add the user's price and match % as extra rows.
    const priced = assessmentId && user ? api.assessment(assessmentId).catch(() => null) : null;
    Promise.all([api.plans(slugs), priced]).then(([list, a]) => {
      setPlans(slugs.map((s) => ({ ...list.find((p) => p.slug === s), quote: a?.results.find((r) => r.slug === s) })).filter((p) => p.name));
    });
  }, [params.toString(), user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!plans) return <div className="loading">Loading comparison…</div>;
  if (plans.length < 2) return <div className="loading">Choose two or three plans to compare. <Link to="/all-plans">Browse plans</Link></div>;

  const rows = { ...(plans.every((p) => p.quote) && {
    'Your price': [
      ['Monthly premium', (p) => rupees(p.quote.premium.monthly), (p) => -p.quote.premium.monthly],
      ['Cover', (p) => cover(p.quote.sumInsured)],
      ['Match for you', (p) => `${p.quote.match}%`, (p) => p.quote.match],
    ],
  }), ...ROWS };

  return (
    <div className="wrap" style={{ paddingBottom: 72 }}>
      <div className="page-head"><h1>Compare plans</h1><p>★ marks the best value in each row.</p></div>
      <div className="table-card">
        <table className="ctable">
          <thead>
            <tr>
              <th />
              {plans.map((p) => (
                <th key={p.slug}>
                  <div className="plan-head"><BankMono plan={p} /><div><span>{p.bankName}</span><b>{p.name}</b></div></div>
                  <div style={{ marginTop: 12 }}><InterestButton slug={p.slug} name={p.name} assessmentId={assessmentId} small /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(rows).map(([group, list]) => (
              <Fragment key={group}>
                <tr className="grp"><th colSpan={plans.length + 1}>{group}</th></tr>
                {list.map(([label, show, score]) => {
                  const best = score && Math.max(...plans.map(score));
                  const allSame = score && plans.every((p) => score(p) === best);
                  return (
                    <tr key={label}>
                      <th>{label}</th>
                      {plans.map((p) => <td key={p.slug} className={score && !allSame && score(p) === best ? 'best' : ''}>{show(p)}</td>)}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 24 }}>{assessmentId ? <Link to={`/plans/${assessmentId}`}>← Back to your plans</Link> : <Link to="/all-plans">← All plans</Link>}</p>
    </div>
  );
}
