// Every plan in the catalogue, filterable by bank (/all-plans?bank=hdfc).
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { cover, ROOM } from '../lib/format.js';
import { useWizard } from '../components/Wizard.jsx';
import { BankMono, InterestButton } from '../components/ui.jsx';

export default function AllPlans() {
  const navigate = useNavigate();
  const { start } = useWizard();
  const [params, setParams] = useSearchParams();
  const [plans, setPlans] = useState(null);
  const [compare, setCompare] = useState([]);
  const bank = params.get('bank');

  useEffect(() => {
    api.plans().then(setPlans).catch(() => setPlans([]));
  }, []);
  if (!plans) return <div className="loading">Loading plans…</div>;

  const banks = [...new Map(plans.map((p) => [p.bank, p])).values()];
  const shown = plans.filter((p) => !bank || p.bank === bank);
  const toggle = (slug) => setCompare((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : [...c, slug].slice(-3)));

  return (
    <div className="wrap" style={{ paddingBottom: 110 }}>
      <div className="page-head row">
        <div><h1>All health plans</h1><p>{plans.length} plans from {banks.length} banks.</p></div>
        <button className="btn accent" onClick={() => start()}>Get my personalised quote</button>
      </div>
      <div className="chips" style={{ marginBottom: 18 }}>
        <button className={`chip${!bank ? ' on' : ''}`} onClick={() => setParams({})}>All banks</button>
        {banks.map((b) => <button key={b.bank} className={`chip${bank === b.bank ? ' on' : ''}`} onClick={() => setParams({ bank: b.bank })}>{b.bankShort}</button>)}
      </div>
      <div className="table-card">
        <table className="list-table">
          <thead><tr><th>Plan</th><th>Room rent</th><th>Cover</th><th>Claims settled</th><th>Compare</th><th /></tr></thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.slug}>
                <td><div className="plan-head"><BankMono plan={p} /><div><span>{p.bankName}</span><b>{p.name}</b></div></div></td>
                <td>{ROOM[p.roomRent]}</td>
                <td>{cover(Math.min(...p.sumInsuredOptions))} – {cover(Math.max(...p.sumInsuredOptions))}</td>
                <td>{p.claimSettlementRatio}%</td>
                <td><input type="checkbox" aria-label={`Compare ${p.name}`} checked={compare.includes(p.slug)} onChange={() => toggle(p.slug)} /></td>
                <td><InterestButton slug={p.slug} name={p.name} small /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`tray${compare.length ? ' open' : ''}`}>
        <div className="wrap">
          <b>{compare.length} of 3 selected to compare</b>
          <button className="btn" disabled={compare.length < 2} onClick={() => navigate(`/compare?plans=${compare.join(',')}`)}>Compare plans</button>
        </div>
      </div>
    </div>
  );
}
