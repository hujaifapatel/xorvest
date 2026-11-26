import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, store } from '../lib/api.js';
import { rupees, cover, memberLabel, PRIORITY } from '../lib/format.js';
import { useWizard } from '../components/Wizard.jsx';
import BankMono from '../components/BankMono.jsx';
import { Check } from '../components/Icons.jsx';
import InterestButton from '../components/InterestButton.jsx';

const MAX = 3;
const SORTS = {
  match: { label: 'Best match', fn: (a, b) => b.match - a.match },
  price: { label: 'Lowest premium', fn: (a, b) => a.premium.monthly - b.premium.monthly },
  claims: { label: 'Best claim record', fn: (a, b) => (b.scores.claims ?? 0) - (a.scores.claims ?? 0) },
};

function PlanCard({ r, best, selected, toggle, assessmentId }) {
  const [open, setOpen] = useState(false);
  const checked = selected.includes(r.slug);
  return (
    <article className={`plan${best ? ' best' : ''}`}>
      {best && <span className="ribbon">Best match for you</span>}
      <div className="plan-main">
        <div className="plan-id">
          <BankMono monogram={r.monogram} tint={r.tint} size="lg" />
          <div>
            <div className="bank">{r.insurer}</div>
            <h3>{r.name}</h3>
            <span className={`match-pill${r.match < 65 ? ' mid' : ''}`}>{r.match}% match</span>
          </div>
        </div>
        <ul className="feats">
          {r.highlights.slice(0, 4).map((h) => (
            <li key={h}><Check />{h}</li>
          ))}
        </ul>
        <div className="price">
          <div className="cover">Cover <b>{cover(r.sumInsured)}</b></div>
          <div className="amount num">{rupees(r.premium.monthly)}<small>/month</small></div>
          <div className="yr num">{rupees(r.premium.annual)} annually incl. GST</div>
          <InterestButton planSlug={r.slug} planName={r.name} assessmentId={assessmentId} block />
        </div>
      </div>
      {open && (
        <div className="plan-why">
          <div className="good">
            <h4>Why it fits</h4>
            <ul>{r.reasons.length ? r.reasons.map((x) => <li key={x}>{x}</li>) : <li>Meets your basic requirements.</li>}</ul>
          </div>
          <div className="bad">
            <h4>Keep in mind</h4>
            <ul>{r.caveats.length ? r.caveats.map((x) => <li key={x}>{x}</li>) : <li>No major drawbacks for your answers.</li>}</ul>
          </div>
        </div>
      )}
      <div className="plan-foot">
        <button className="linkbtn" type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'Hide details' : 'Why this plan?'}
        </button>
        <label className="check">
          <input type="checkbox" aria-label={`Add ${r.name} to compare`} checked={checked} disabled={!checked && selected.length >= MAX} onChange={() => toggle(r.slug)} />
          Add to compare
        </label>
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
  const [banks, setBanks] = useState([]);
  const [inBudget, setInBudget] = useState(false);
  const [selected, setSelected] = useState(() => store.get(`pr.compare.${id}`, []));

  useEffect(() => {
    api.assessment(id).then(setData).catch(() => setError('We couldn’t find this recommendation.'));
  }, [id]);
  useEffect(() => {
    store.set(`pr.compare.${id}`, selected);
  }, [id, selected]);

  const toggle = (slug) => setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length < MAX ? [...s, slug] : s));

  const list = useMemo(() => {
    if (!data) return [];
    return data.results
      .filter((r) => !banks.length || banks.includes(r.bank))
      .filter((r) => !inBudget || r.premium.monthly <= data.profile.budgetMonthly)
      .sort(SORTS[sort].fn);
  }, [data, banks, inBudget, sort]);

  if (error) return <div className="loading">{error} <Link to="/account">See your recommendations</Link></div>;
  if (!data) return <div className="loading">Loading your plans…</div>;

  const { profile: p, results, declined } = data;
  const a = data.answers || {};
  const bankOptions = [...new Map(results.map((r) => [r.bank, r])).values()];
  const members = ['self', 'spouse', 'father', 'mother'].filter((k) => a.members?.[k]).map((k) => `${memberLabel(k, a.gender)} (${a.ages?.[k]})`);
  if (p.children) members.push(`${p.children} child${p.children > 1 ? 'ren' : ''}`);
  const topMatch = results[0]?.slug;
  const chosen = selected.map((s) => results.find((r) => r.slug === s)).filter(Boolean);

  return (
    <>
      <section className="results-top">
        <div className="wrap">
          <div className="summary">
            <div>
              <h1>We recommend a cover of <span>{cover(p.recommendedSumInsured)}</span></h1>
              <p>{results.length} plans available for your family · {declined.length} not eligible</p>
            </div>
            <button className="btn outline" onClick={() => start({ prefill: a, at: 0 })}>Edit answers</button>
          </div>
          <div className="tags">
            {members.map((m) => <span className="tag" key={m}>{m}</span>)}
            <span className="tag">Budget up to {rupees(p.budgetMonthly)}/month</span>
            <span className="tag">Priority: {PRIORITY[p.priority]}</span>
          </div>
          <details className="why-si">
            <summary>How we calculated {cover(p.recommendedSumInsured)}</summary>
            <ul>{p.sumInsuredReasons.map((x) => <li key={x}>{x}</li>)}</ul>
          </details>
        </div>
      </section>

      <div className="wrap results">
        <aside className="filters" aria-label="Filters">
          <h3>Sort by</h3>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort plans">
            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          <div className="group">
            <label className="opt"><input type="checkbox" checked={inBudget} onChange={(e) => setInBudget(e.target.checked)} /> Within my budget</label>
          </div>
          <div className="group">
            <h3>Banks</h3>
            {bankOptions.map((r) => (
              <label className="opt" key={r.bank}>
                <input type="checkbox" checked={banks.includes(r.bank)} onChange={() => setBanks((b) => (b.includes(r.bank) ? b.filter((x) => x !== r.bank) : [...b, r.bank]))} />
                {r.bankShort}
              </label>
            ))}
            {banks.length > 0 && <button className="linkbtn" style={{ marginTop: 8, fontSize: 14 }} onClick={() => setBanks([])}>Clear</button>}
          </div>
        </aside>

        <div>
          <div className="count-line">
            <span>Showing {list.length} of {results.length} plans</span>
            <span>Premiums are estimates</span>
          </div>
          {list.map((r) => (
            <PlanCard key={r.slug} r={r} best={r.slug === topMatch} selected={selected} toggle={toggle} assessmentId={id} />
          ))}
          {!list.length && <div className="empty"><p>No plans match these filters.</p></div>}

          {declined.length > 0 && (
            <div className="declined">
              <h3>Not available for your family</h3>
              {declined.map((d) => <p key={d.slug}><b>{d.bankShort} {d.name}:</b> {d.reasons.join(' ')}</p>)}
            </div>
          )}
          <p className="disclaimer">Sample plans for demonstration. Premiums include 18% GST and are confirmed by the insurer after medical underwriting.</p>
        </div>
      </div>

      <div className={`tray${selected.length ? ' open' : ''}`} aria-hidden={!selected.length}>
        <div className="wrap">
          <div className="slots">
            {chosen.map((r) => (
              <div className="slot" key={r.slug}>
                <BankMono monogram={r.monogram} tint={r.tint} />
                <span>{r.name}</span>
                <button onClick={() => toggle(r.slug)} aria-label={`Remove ${r.name}`}>×</button>
              </div>
            ))}
            {Array.from({ length: MAX - chosen.length }, (_, i) => <div className="slot empty" key={i}>Add a plan</div>)}
          </div>
          <button className="btn" disabled={selected.length < 2} onClick={() => navigate(`/compare?plans=${selected.join(',')}&a=${id}`)}>
            Compare {selected.length > 1 ? selected.length : ''} plans
          </button>
        </div>
      </div>
    </>
  );
}
