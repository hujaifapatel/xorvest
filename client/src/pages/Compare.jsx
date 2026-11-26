import { Fragment, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { rupees, cover, ROOM, RESTORE } from '../lib/format.js';
import BankMono from '../components/BankMono.jsx';
import InterestButton from '../components/InterestButton.jsx';

const ROOM_RANK = { 'no-limit': 4, 'single-private': 3, shared: 2, '1pct': 1 };
const RESTORE_RANK = { unlimited: 2, once: 1, none: 0 };

// [label, display, rank (higher is better, optional)]
const groups = (est) => [
  {
    title: 'Price',
    rows: est
      ? [
          ['Monthly premium', (p) => rupees(est[p.slug].premium.monthly), (p) => -est[p.slug].premium.monthly],
          ['Yearly premium', (p) => rupees(est[p.slug].premium.annual), (p) => -est[p.slug].premium.annual],
          ['Cover', (p) => cover(est[p.slug].sumInsured)],
          ['Match for you', (p) => `${est[p.slug].match}%`, (p) => est[p.slug].match],
        ]
      : [['Cover options', (p) => p.sumInsuredOptions.map(cover).join(', ')]],
  },
  {
    title: 'Hospitalisation',
    rows: [
      ['Room rent', (p) => ROOM[p.roomRent], (p) => ROOM_RANK[p.roomRent]],
      ['Co-payment', (p) => (p.copayPct ? `${p.copayPct}%${p.copayFromAge ? ` from age ${p.copayFromAge}` : ''}` : 'None'), (p) => -p.copayPct],
      ['Pre-hospitalisation', (p) => `${p.preHospDays} days`, (p) => p.preHospDays],
      ['Post-hospitalisation', (p) => `${p.postHospDays} days`, (p) => p.postHospDays],
      ['Consumables', (p) => (p.consumables ? 'Covered' : 'Not covered'), (p) => (p.consumables ? 1 : 0)],
    ],
  },
  {
    title: 'Waiting periods',
    rows: [
      ['Existing illness', (p) => `${p.pedWaitingYears} year${p.pedWaitingYears > 1 ? 's' : ''}${p.pedReductionRider ? ' (can be reduced)' : ''}`, (p) => -p.pedWaitingYears],
      ['Maternity', (p) => (p.maternity?.covered ? `${rupees(p.maternity.limit)} after ${p.maternity.waitingYears} yrs` : 'Not covered'), (p) => (p.maternity?.covered ? 10 - p.maternity.waitingYears : 0)],
    ],
  },
  {
    title: 'Benefits',
    rows: [
      ['Restore benefit', (p) => RESTORE[p.restore], (p) => RESTORE_RANK[p.restore]],
      ['No-claim bonus', (p) => (p.ncb?.max ? `${p.ncb.perYear}%/yr up to ${p.ncb.max}%` : 'None'), (p) => p.ncb?.max || 0],
      ['OPD / consultations', (p) => (p.opd?.covered ? `Up to ${rupees(p.opd.limit)}` : 'Not covered'), (p) => p.opd?.limit || 0],
      ['Annual health check-up', (p) => (p.healthCheckup ? 'Included' : '–'), (p) => (p.healthCheckup ? 1 : 0)],
      ['AYUSH treatment', (p) => (p.ayush ? 'Covered' : '–'), (p) => (p.ayush ? 1 : 0)],
    ],
  },
  {
    title: 'Bank & claims',
    rows: [
      ['Claims settled', (p) => `${p.claimSettlementRatio}%`, (p) => p.claimSettlementRatio],
      ['Average claim time', (p) => `${p.claimTatDays} days`, (p) => -p.claimTatDays],
      ['Cashless hospitals', (p) => p.networkHospitals.toLocaleString('en-IN'), (p) => p.networkHospitals],
      ['Max entry age', (p) => `${p.maxEntryAge} years`, (p) => p.maxEntryAge],
    ],
  },
];

export default function Compare() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const slugs = (params.get('plans') || '').split(',').filter(Boolean).slice(0, 3);
  const assessmentId = params.get('a');
  const [plans, setPlans] = useState(null);
  const [est, setEst] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slugs.length < 2) {
      setError('Choose two or three plans to compare.');
      return;
    }
    const withEst = assessmentId && user ? api.assessment(assessmentId).catch(() => null) : Promise.resolve(null);
    Promise.all([api.plans({ slugs }), withEst])
      .then(([ps, a]) => {
        setPlans(slugs.map((s) => ps.find((p) => p.slug === s)).filter(Boolean));
        if (a) setEst(Object.fromEntries(a.results.map((r) => [r.slug, r])));
      })
      .catch(() => setError('We couldn’t load those plans.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString(), user]);

  if (error) return <div className="loading">{error} <Link to="/all-plans">Browse all plans</Link></div>;
  if (!plans) return <div className="loading">Loading comparison…</div>;
  const usable = est && plans.every((p) => est[p.slug]) ? est : null;

  return (
    <div className="wrap" style={{ paddingBottom: 72 }}>
      <div className="page-head">
        <h1>Compare plans</h1>
        <p>★ marks the best value in each row.</p>
      </div>
      <div className="table-card">
        <table className="ctable">
          <thead>
            <tr>
              <th />
              {plans.map((p) => (
                <th key={p.slug}>
                  <div className="plan-head">
                    <BankMono monogram={p.monogram} tint={p.tint} />
                    <div><span>{p.bankName}</span><b>{p.name}</b></div>
                  </div>
                  <div style={{ marginTop: 12 }}><InterestButton planSlug={p.slug} planName={p.name} assessmentId={assessmentId} size="sm" /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups(usable).map((g) => (
              <Fragment key={g.title}>
                <tr className="grp"><th colSpan={plans.length + 1}>{g.title}</th></tr>
                {g.rows.map(([label, show, rank]) => {
                  let best = null;
                  if (rank) {
                    const vals = plans.map(rank);
                    const max = Math.max(...vals);
                    if (vals.some((v) => v !== max)) best = max;
                  }
                  return (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      {plans.map((p) => (
                        <td key={p.slug} className={best !== null && rank(p) === best ? 'best' : ''}>{show(p)}</td>
                      ))}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 24 }}>
        {assessmentId ? <Link to={`/plans/${assessmentId}`}>← Back to your plans</Link> : <Link to="/all-plans">← Back to all plans</Link>}
      </p>
    </div>
  );
}
