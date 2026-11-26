import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { cover, ROOM } from '../lib/format.js';
import { useWizard } from '../components/Wizard.jsx';
import BankMono from '../components/BankMono.jsx';
import InterestButton from '../components/InterestButton.jsx';

export default function AllPlans() {
  const navigate = useNavigate();
  const { start } = useWizard();
  const [params, setParams] = useSearchParams();
  const [plans, setPlans] = useState(null);
  const [banks, setBanks] = useState([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const bank = params.get('bank') || '';
  const category = params.get('category') || '';

  useEffect(() => {
    Promise.all([api.plans(), api.banks()])
      .then(([p, b]) => { setPlans(p); setBanks(b); })
      .catch(() => setError('We couldn’t load plans. Is the server running?'));
  }, []);

  const shown = useMemo(
    () => (plans || []).filter((p) => (!bank || p.bank === bank) && (!category || p.category === category)),
    [plans, bank, category]
  );

  const setFilter = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const toggle = (slug) => setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length < 3 ? [...s, slug] : s));

  if (error) return <div className="loading">{error}</div>;
  if (!plans) return <div className="loading">Loading plans…</div>;

  return (
    <div className="wrap" style={{ paddingBottom: 110 }}>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>All health plans</h1>
          <p>{plans.length} plans from {banks.length} banks. For prices matched to your family, answer a few questions.</p>
        </div>
        <button className="btn accent" onClick={() => start()}>Get my personalised quote</button>
      </div>

      <div className="bank-filter">
        <button className={`chip${!bank ? ' on' : ''}`} onClick={() => setFilter('bank', '')}>All banks</button>
        {banks.map((b) => (
          <button key={b.slug} className={`chip${bank === b.slug ? ' on' : ''}`} onClick={() => setFilter('bank', b.slug)}>{b.shortName}</button>
        ))}
        <select className="select" value={category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Plan type" style={{ height: 38, marginLeft: 'auto' }}>
          <option value="">All plan types</option>
          <option value="essential">Essential</option>
          <option value="comprehensive">Comprehensive</option>
          <option value="premier">Premium</option>
          <option value="senior">Senior citizen</option>
        </select>
      </div>

      <div className="table-card">
        <table className="list-table">
          <thead>
            <tr><th>Plan</th><th>Type</th><th>Room rent</th><th>Cover</th><th>Claims settled</th><th>Compare</th><th /></tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.slug}>
                <td>
                  <div className="plan-head">
                    <BankMono monogram={p.monogram} tint={p.tint} />
                    <div><span>{p.bankName}</span><b>{p.name}</b></div>
                  </div>
                </td>
                <td><span className="badge">{p.category === 'premier' ? 'premium' : p.category}</span></td>
                <td>{ROOM[p.roomRent]}</td>
                <td className="num">{cover(Math.min(...p.sumInsuredOptions))} – {cover(Math.max(...p.sumInsuredOptions))}</td>
                <td className="num">{p.claimSettlementRatio}%</td>
                <td>
                  <label className="check">
                    <input type="checkbox" aria-label={`Compare ${p.name}`} checked={selected.includes(p.slug)} disabled={!selected.includes(p.slug) && selected.length >= 3} onChange={() => toggle(p.slug)} />
                  </label>
                </td>
                <td><InterestButton planSlug={p.slug} planName={p.name} size="sm" /></td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>No plans match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="disclaimer">Sample plans for demonstration; not offers from the banks named.</p>

      <div className={`tray${selected.length ? ' open' : ''}`} aria-hidden={!selected.length}>
        <div className="wrap">
          <div className="slots">
            <span style={{ fontWeight: 700, alignSelf: 'center' }}>{selected.length} of 3 selected</span>
          </div>
          <button className="btn" disabled={selected.length < 2} onClick={() => navigate(`/compare?plans=${selected.join(',')}`)}>Compare plans</button>
        </div>
      </div>
    </div>
  );
}
