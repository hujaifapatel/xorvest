import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, store } from '../lib/api.js';
import { rupees, cover, roman, inWords } from '../lib/format.js';

const MAX_COMPARE = 3;
const PRIORITY = {
  premium: 'a modest premium',
  coverage: 'breadth of cover',
  claims: 'a dependable claims record',
  network: 'a wide cashless network',
};

function householdPhrase(p) {
  if (p.lives === 1) return 'yourself alone';
  const bits = [];
  if (p.adults > 1) bits.push(`${inWords(p.adults)} adults`);
  if (p.children) bits.push(`${inWords(p.children)} ${p.children === 1 ? 'child' : 'children'}`);
  return bits.join(' and ');
}

function CompareBox({ slug, name, selected, toggle }) {
  const checked = selected.includes(slug);
  return (
    <label className="check">
      <input type="checkbox" aria-label={`Compare ${name}`} checked={checked} disabled={!checked && selected.length >= MAX_COMPARE} onChange={() => toggle(slug)} />
      Compare
    </label>
  );
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(() => store.get(`xv.compare.${id}`, []));

  useEffect(() => {
    api.assessment(id).then(setData).catch(() => setError('We could not find that recommendation.'));
  }, [id]);

  useEffect(() => {
    store.set(`xv.compare.${id}`, selected);
  }, [id, selected]);

  const toggle = (slug) =>
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length < MAX_COMPARE ? [...s, slug] : s));

  if (error) return <div className="wrap loading">{error} <Link to="/consultation">Begin a new consultation.</Link></div>;
  if (!data) return <div className="wrap loading">Preparing your recommendation…</div>;

  const { profile: p, results, declined } = data;
  const top = results.slice(0, 3);
  const rest = results.slice(3);
  const names = selected.map((s) => results.find((r) => r.slug === s)?.name).filter(Boolean);

  return (
    <div className="wrap" style={{ paddingBottom: 110 }}>
      <section className="verdict">
        <div>
          <div className="eyebrow">Our recommendation</div>
          <h1>
            A cover of <em>{cover(p.recommendedSumInsured)}</em>, {p.lives > 1 ? 'on a single family floater' : 'on an individual policy'}.
          </h1>
          <p>
            For {householdPhrase(p)}, the eldest aged {p.eldestAge}, with your preference for {PRIORITY[p.priority]}, we have
            weighed {results.length + declined.length} policies. {results.length} are open to you; the three we would
            place before you first are set out below, each with its reasons and its limits.
          </p>
        </div>
        <aside className="margin-note">
          <h3>How we arrived at this figure</h3>
          <ul>
            {p.sumInsuredReasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </aside>
      </section>

      <div className="section-head">
        <h2>The Shortlist</h2>
        <hr className="rule" />
      </div>

      <div className="shortlist">
        {top.map((r) => (
          <article className="entry" key={r.slug}>
            <div className="rank">{roman(r.rank)}</div>
            <div>
              <div className="insurer">{r.insurer}</div>
              <h3>{r.name}</h3>
              <ul>
                {r.reasons.map((x) => <li key={x}>{x}</li>)}
                {r.caveats.map((x) => <li key={x} className="caveat">{x}</li>)}
              </ul>
            </div>
            <div className="figures">
              <div className="big">{rupees(r.premium.monthly)}</div>
              <div className="per">a month, estimated</div>
              <dl>
                <dt>Cover</dt><dd>{cover(r.sumInsured)}</dd>
                <dt>Annually</dt><dd>{rupees(r.premium.annual)}</dd>
              </dl>
            </div>
            <div className="actions">
              <div className="match">{r.match}<small> / 100 suitability</small></div>
              <CompareBox slug={r.slug} name={r.name} selected={selected} toggle={toggle} />
            </div>
          </article>
        ))}
      </div>

      {rest.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 64 }}>
            <h2>The Remainder of the Register</h2>
            <hr className="rule" />
          </div>
          <table className="ledger">
            <thead>
              <tr>
                <th>No.</th>
                <th>Policy</th>
                <th className="hide-sm">Principal note</th>
                <th className="num">Cover</th>
                <th className="num">Monthly</th>
                <th className="num">Suitability</th>
                <th className="num"><span className="hide-sm">Compare</span></th>
              </tr>
            </thead>
            <tbody>
              {rest.map((r) => (
                <tr key={r.slug}>
                  <td className="rank-cell">{roman(r.rank)}</td>
                  <td>
                    <div className="plan-insurer">{r.insurer}</div>
                    <div className="plan-name">{r.name}</div>
                  </td>
                  <td className="hide-sm" style={{ color: r.caveats[0] ? 'var(--oxblood)' : 'var(--ink-soft)', maxWidth: 300 }}>
                    {r.caveats[0] || r.reasons[0]}
                  </td>
                  <td className="num">{cover(r.sumInsured)}</td>
                  <td className="num">{rupees(r.premium.monthly)}</td>
                  <td className="num">{r.match}</td>
                  <td className="num"><CompareBox slug={r.slug} name={r.name} selected={selected} toggle={toggle} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {declined.length > 0 && (
        <section className="declined">
          <h3>Policies not open to your household</h3>
          {declined.map((d) => (
            <p key={d.slug}>
              <em>{d.insurer}, {d.name}.</em> {d.reasons.join(' ')}
            </p>
          ))}
        </section>
      )}

      <p className="footnote" style={{ marginTop: 40 }}>
        Premiums are estimates inclusive of 18% GST and will be confirmed by the insurer after medical underwriting.{' '}
        <Link to="/consultation">Begin a fresh consultation</Link>.
      </p>

      <div className={`tray${selected.length ? ' open' : ''}`} aria-hidden={!selected.length}>
        <div className="wrap">
          <span className="smallcaps">{selected.length} of {MAX_COMPARE} chosen for comparison</span>
          <span className="names">{names.join(' · ')}</span>
          <button
            type="button"
            className="btn"
            disabled={selected.length < 2}
            onClick={() => navigate(`/compare?plans=${selected.join(',')}&a=${id}`)}
          >
            Compare side by side <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
