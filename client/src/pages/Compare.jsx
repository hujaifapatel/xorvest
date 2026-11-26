import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { rupees, cover, ROOM, RESTORE } from '../lib/format.js';

// Each row: label, how to display, and optionally how to rank (higher is better).
const ROOM_RANK = { 'no-limit': 4, 'single-private': 3, shared: 2, '1pct': 1 };
const RESTORE_RANK = { unlimited: 2, once: 1, none: 0 };

const GROUPS = (est) => [
  {
    title: 'Cost',
    rows: est
      ? [
          ['Estimated premium, monthly', (p) => rupees(est[p.slug].premium.monthly), (p) => -est[p.slug].premium.monthly],
          ['Estimated premium, annual', (p) => rupees(est[p.slug].premium.annual), (p) => -est[p.slug].premium.annual],
          ['Cover quoted', (p) => cover(est[p.slug].sumInsured)],
          ['Suitability for you', (p) => `${est[p.slug].match} / 100`, (p) => est[p.slug].match],
        ]
      : [['Cover available', (p) => p.sumInsuredOptions.map(cover).join(', ')]],
  },
  {
    title: 'In hospital',
    rows: [
      ['Room', (p) => ROOM[p.roomRent], (p) => ROOM_RANK[p.roomRent]],
      ['Co-payment', (p) => (p.copayPct ? `${p.copayPct}%${p.copayFromAge ? ` from age ${p.copayFromAge}` : ''}` : 'None'), (p) => -p.copayPct],
      ['Before admission', (p) => `${p.preHospDays} days`, (p) => p.preHospDays],
      ['After discharge', (p) => `${p.postHospDays} days`, (p) => p.postHospDays],
      ['Consumables', (p) => (p.consumables ? 'Covered' : 'Not covered'), (p) => (p.consumables ? 1 : 0)],
    ],
  },
  {
    title: 'Waiting periods',
    rows: [
      ['Pre-existing conditions', (p) => `${p.pedWaitingYears} ${p.pedWaitingYears === 1 ? 'year' : 'years'}${p.pedReductionRider ? ', reducible' : ''}`, (p) => -p.pedWaitingYears],
      ['Maternity', (p) => (p.maternity?.covered ? `${rupees(p.maternity.limit)} after ${p.maternity.waitingYears} years` : 'Not covered'), (p) => (p.maternity?.covered ? 10 - p.maternity.waitingYears : 0)],
    ],
  },
  {
    title: 'Benefits',
    rows: [
      ['Restoration of cover', (p) => RESTORE[p.restore], (p) => RESTORE_RANK[p.restore]],
      ['No-claim bonus', (p) => (p.ncb?.max ? `${p.ncb.perYear}% a year, to ${p.ncb.max}%` : 'None'), (p) => p.ncb?.max || 0],
      ['Outpatient care', (p) => (p.opd?.covered ? `Up to ${rupees(p.opd.limit)}` : 'Not covered'), (p) => p.opd?.limit || 0],
      ['Annual health check', (p) => (p.healthCheckup ? 'Included' : '—'), (p) => (p.healthCheckup ? 1 : 0)],
      ['AYUSH treatment', (p) => (p.ayush ? 'Covered' : '—'), (p) => (p.ayush ? 1 : 0)],
    ],
  },
  {
    title: 'The insurer',
    rows: [
      ['Claims settled', (p) => `${p.claimSettlementRatio}%`, (p) => p.claimSettlementRatio],
      ['Average settlement', (p) => `${p.claimTatDays} days`, (p) => -p.claimTatDays],
      ['Cashless hospitals', (p) => p.networkHospitals.toLocaleString('en-IN'), (p) => p.networkHospitals],
      ['Entry age, up to', (p) => `${p.maxEntryAge} years`, (p) => p.maxEntryAge],
    ],
  },
];

export default function Compare() {
  const [params] = useSearchParams();
  const slugs = (params.get('plans') || '').split(',').filter(Boolean).slice(0, 3);
  const assessmentId = params.get('a');
  const [plans, setPlans] = useState(null);
  const [est, setEst] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slugs.length < 2) {
      setError('Choose two or three policies to compare.');
      return;
    }
    Promise.all([api.plans(slugs), assessmentId ? api.assessment(assessmentId) : Promise.resolve(null)])
      .then(([ps, a]) => {
        setPlans(slugs.map((s) => ps.find((p) => p.slug === s)).filter(Boolean));
        if (a) setEst(Object.fromEntries(a.results.map((r) => [r.slug, r])));
      })
      .catch(() => setError('We could not retrieve those policies.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  if (error) return <div className="wrap loading">{error} <Link to="/register">Consult the register.</Link></div>;
  if (!plans) return <div className="wrap loading">Laying out the comparison…</div>;

  const usableEst = est && plans.every((p) => est[p.slug]) ? est : null;

  return (
    <div className="wrap compare-wrap">
      <div className="eyebrow">Side by side</div>
      <h1>A Comparison of {plans.length === 2 ? 'Two' : 'Three'} Policies</h1>
      <p>Read across each row; the dagger marks the most favourable terms.</p>

      <div className="scroll-x">
        <table className="ledger compare">
          <thead>
            <tr>
              <th />
              {plans.map((p) => (
                <th key={p.slug}>
                  {p.insurer}
                  <span className="plan-name">{p.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS(usableEst).map((g) => (
              <FragmentGroup key={g.title} group={g} plans={plans} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="footnote">† Most favourable in its row. Where all policies are equal, none is marked.</p>
      <p style={{ marginTop: 30 }}>
        {assessmentId ? <Link to={`/recommendation/${assessmentId}`}>← Return to your recommendation</Link> : <Link to="/register">← Return to the register</Link>}
      </p>
    </div>
  );
}

function FragmentGroup({ group, plans }) {
  return (
    <>
      <tr className="group">
        <th colSpan={plans.length + 1}>{group.title}</th>
      </tr>
      {group.rows.map(([label, show, rank]) => {
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
    </>
  );
}
