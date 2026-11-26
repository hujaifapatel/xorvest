import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { cover, ROOM } from '../lib/format.js';

const CATEGORY = { essential: 'Essential', comprehensive: 'Comprehensive', premier: 'Premier', senior: 'Senior citizens' };

export default function Register() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    api.plans().then(setPlans).catch(() => setError('We could not reach the register.'));
  }, []);

  const toggle = (slug) =>
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length < 3 ? [...s, slug] : s));

  if (error) return <div className="wrap loading">{error}</div>;
  if (!plans) return <div className="wrap loading">Opening the register…</div>;

  return (
    <div className="wrap compare-wrap" style={{ paddingBottom: 120 }}>
      <div className="eyebrow">The Register</div>
      <h1>Every Policy We Keep on File</h1>
      <p>
        For advice fitted to your household, <Link to="/consultation">begin a consultation</Link>. Otherwise, browse at
        leisure and choose up to three to compare.
      </p>

      <table className="ledger">
        <thead>
          <tr>
            <th>Policy</th>
            <th className="hide-sm">Class</th>
            <th className="hide-sm">Room</th>
            <th className="num">Cover</th>
            <th className="num">Claims settled</th>
            <th className="num" />
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.slug}>
              <td>
                <div className="plan-insurer">{p.insurer}</div>
                <div className="plan-name">{p.name}</div>
              </td>
              <td className="hide-sm" style={{ fontStyle: 'italic' }}>{CATEGORY[p.category]}</td>
              <td className="hide-sm">{ROOM[p.roomRent]}</td>
              <td className="num">
                {cover(Math.min(...p.sumInsuredOptions))} – {cover(Math.max(...p.sumInsuredOptions))}
              </td>
              <td className="num">{p.claimSettlementRatio}%</td>
              <td className="num">
                <label className="check">
                  <input
                    type="checkbox"
                    aria-label={`Compare ${p.name}`}
                    checked={selected.includes(p.slug)}
                    disabled={!selected.includes(p.slug) && selected.length >= 3}
                    onChange={() => toggle(p.slug)}
                  />
                  <span className="hide-sm">Compare</span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`tray${selected.length ? ' open' : ''}`} aria-hidden={!selected.length}>
        <div className="wrap">
          <span className="smallcaps">{selected.length} of 3 chosen for comparison</span>
          <button type="button" className="btn" disabled={selected.length < 2} onClick={() => navigate(`/compare?plans=${selected.join(',')}`)}>
            Compare side by side <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
