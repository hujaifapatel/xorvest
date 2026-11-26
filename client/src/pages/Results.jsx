// Ranked plans for one questionnaire (/plans/:id).
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { rupees, cover, memberLabel, PRIORITY } from '../lib/format.js';
import { useWizard } from '../components/Wizard.jsx';
import { BankMono, Check, InterestButton } from '../components/ui.jsx';

const SORTS = {
  match: (a, b) => b.match - a.match,
  price: (a, b) => a.premium.monthly - b.premium.monthly,
  claims: (a, b) => b.claimSettlementRatio - a.claimSettlementRatio,
};

function PlanCard({ r, best, compared, onCompare, assessmentId }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`plan${best ? ' best' : ''}`}>
      {best && <span className="ribbon">Best match for you</span>}
      <div className="plan-main">
        <div className="plan-id">
          <BankMono plan={r} large />
          <div>
            <div className="bank">{r.insurer}</div>
            <h3>{r.name}</h3>
            <span className={`match-pill${r.match < 65 ? ' mid' : ''}`}>{r.match}% match</span>
          </div>
        </div>
        <ul className="feats">{r.highlights.map((h) => <li key={h}><Check />{h}</li>)}</ul>
        <div className="price">
          <div className="cover">Cover <b>{cover(r.sumInsured)}</b></div>
          <div className="amount">{rupees(r.premium.monthly)}<small>/month</small></div>
          <div className="yr">{rupees(r.premium.annual)} a year incl. GST</div>
          <InterestButton slug={r.slug} name={r.name} assessmentId={assessmentId} block />
        </div>
      </div>
      {open && (
        <div className="plan-why">
          <div className="good"><h4>Why it fits</h4><ul>{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="bad"><h4>Keep in mind</h4><ul>{r.caveats.length ? r.caveats.map((x) => <li key={x}>{x}</li>) : <li>No major drawbacks for your answers.</li>}</ul></div>
        </div>
      )}
      <div className="plan-foot">
        <button className="linkbtn" onClick={() => setOpen(!open)}>{open ? 'Hide details' : 'Why this plan?'}</button>
        <label className="check"><input type="checkbox" checked={compared} onChange={onCompare} /> Add to compare</label>
      </div>
    </article>
  );
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { start } = useWizard();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('match');
  const [inBudget, setInBudget] = useState(false);
  const [compare, setCompare] = useState([]);

  useEffect(() => {
    api.assessment(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="loading">{error} <Link to="/account">My account</Link></div>;
  if (!data) return <div className="loading">Loading your plans…</div>;

  const { profile: p, results, declined, answers: a } = data;
  const shown = results.filter((r) => !inBudget || r.premium.monthly <= p.budgetMonthly).sort(SORTS[sort]);
  const toggleCompare = (slug) => setCompare((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : [...c, slug].slice(-3)));
  const members = ['self', 'spouse', 'father', 'mother'].filter((k) => a.members[k]).map((k) => `${memberLabel(k, a.gender)} (${a.ages[k]})`);

  return (
    <>
      <section className="results-top">
        <div className="wrap">
          <div className="summary">
            <div>
              <h1>We recommend a cover of <span>{cover(p.recommendedSumInsured)}</span></h1>
              <p>{results.length} plans available for your family · {declined.length} not eligible</p>
            </div>
            <button className="btn outline" onClick={() => start(a, 99)}>Edit answers</button>
          </div>
          <div className="tags">
            {members.map((m) => <span className="tag" key={m}>{m}</span>)}
            {p.children > 0 && <span className="tag">{p.children} child{p.children > 1 ? 'ren' : ''}</span>}
            <span className="tag">Budget {rupees(p.budgetMonthly)}/month</span>
            <span className="tag">Priority: {PRIORITY[p.priority]}</span>
          </div>
          <details className="why-si">
            <summary>How we calculated {cover(p.recommendedSumInsured)}</summary>
            <ul>{p.sumInsuredReasons.map((x) => <li key={x}>{x}</li>)}</ul>
          </details>
        </div>
      </section>

      <div className="wrap results">
        <aside className="filters">
          <h3>Sort by</h3>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="match">Best match</option>
            <option value="price">Lowest premium</option>
            <option value="claims">Best claim record</option>
          </select>
          <label className="opt"><input type="checkbox" checked={inBudget} onChange={(e) => setInBudget(e.target.checked)} /> Within my budget</label>
        </aside>

        <div>
          {shown.map((r) => (
            <PlanCard key={r.slug} r={r} best={r.slug === results[0].slug} assessmentId={id} compared={compare.includes(r.slug)} onCompare={() => toggleCompare(r.slug)} />
          ))}
          {!shown.length && <div className="empty"><p>No plans within your budget. Untick the filter to see all.</p></div>}
          {declined.length > 0 && (
            <div className="declined">
              <h3>Not available for your family</h3>
              {declined.map((d) => <p key={d.slug}><b>{d.bankShort} {d.name}:</b> {d.reasons.join(' ')}</p>)}
            </div>
          )}
          <p className="disclaimer">Sample plans for demonstration. Premiums are estimates incl. 18% GST.</p>
        </div>
      </div>

      <div className={`tray${compare.length ? ' open' : ''}`}>
        <div className="wrap">
          <b>{compare.length} of 3 selected to compare</b>
          <button className="btn" disabled={compare.length < 2} onClick={() => navigate(`/compare?plans=${compare.join(',')}&a=${id}`)}>Compare plans</button>
        </div>
      </div>
    </>
  );
}
