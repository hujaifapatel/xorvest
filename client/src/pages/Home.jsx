// Landing page: hero with quote card, why buy insurance, partner banks, FAQ.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useWizard, MemberTiles } from '../components/Wizard.jsx';
import { BankMono, Shield, Hospital, Clock, Wallet, Arrow } from '../components/ui.jsx';

const ADULTS = ['self', 'spouse', 'father', 'mother'];

function QuoteCard() {
  const { start, answers } = useWizard();
  const [gender, setGender] = useState(answers.gender || 'male');
  const [members, setMembers] = useState(answers.members);
  const [error, setError] = useState('');

  const go = () => {
    if (!ADULTS.some((k) => members[k])) return setError('Select at least one adult to continue.');
    start({ gender, members }, 2); // jump straight to the ages question
  };

  return (
    <div className="quote-card">
      <h2>Your health matters. <em>Get insured today.</em></h2>
      <p className="lead">Answer a few quick questions and compare plans from 8 banks.</p>
      <div className="gender-row" role="radiogroup" aria-label="Your gender">
        {['male', 'female'].map((g) => (
          <label className="radio" key={g}>
            <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} />
            {g === 'male' ? 'Male' : 'Female'}
          </label>
        ))}
      </div>
      <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 10px' }}>Select members you want to insure</p>
      <MemberTiles gender={gender} value={members} onChange={(m) => { setMembers(m); setError(''); }} />
      {error && <p className="err">{error}</p>}
      <button className="btn accent block" style={{ marginTop: 18, height: 52, fontSize: 16 }} onClick={go}>
        View plans <Arrow />
      </button>
      <p className="fineprint-sm">Takes about 2 minutes · No spam calls</p>
    </div>
  );
}

const FAQ = [
  ['How do you choose which plans to recommend?', 'We check which plans your family is eligible for, estimate the premium for your ages and city, and score each plan on price, coverage, claim record, hospital network and the things you told us matter most. Every recommendation shows its reasons and its drawbacks.'],
  ['What sum insured do I need?', 'It depends on your city, family size, ages and health. We suggest a figure at the top of your results and explain how we arrived at it. Metro families usually need at least ₹10 lakh.'],
  ['Will my existing illness be covered?', 'Yes, after a waiting period, usually 1 to 4 years depending on the plan. Tell us about existing conditions and we will favour plans with shorter waiting periods.'],
  ['Why do I need to register?', 'Your account keeps your recommendations so you can come back, compare plans again, or share them with family. We never sell your details.'],
  ['Is my employer’s cover enough?', 'Office cover ends when you change or leave your job, and is often too small for a family. A personal plan keeps you covered either way.'],
];

export default function Home() {
  const { start } = useWizard();
  const [banks, setBanks] = useState([]);
  useEffect(() => {
    api.banks().then(setBanks).catch(() => setBanks([]));
  }, []);
  const planCount = banks.reduce((n, b) => n + b.plans, 0);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div>
            <span className="pill"><Shield size={16} /> Compare plans from India’s leading banks</span>
            <h1>Health insurance that fits <span>your family</span>, not a sales script.</h1>
            <p className="sub">Tell us about your family in 15 quick questions. We compare every eligible plan and show you the best fits, with honest pros and cons.</p>
            <ul className="benefits">
              <li><span className="ico"><Hospital /></span><span>Cashless treatment<small>at thousands of network hospitals</small></span></li>
              <li><span className="ico"><Clock /></span><span>Shorter waiting periods<small>for existing illnesses</small></span></li>
              <li><span className="ico"><Wallet /></span><span>Monthly premium view<small>matched to your budget</small></span></li>
              <li><span className="ico"><Shield /></span><span>Claim records shown<small>before you choose</small></span></li>
            </ul>
            <div className="facts">
              <div><b className="num">{banks.length || 8}</b><span>Partner banks</span></div>
              <div><b className="num">{planCount || 16}</b><span>Plans compared</span></div>
              <div><b>15</b><span>Quick questions</span></div>
            </div>
          </div>
          <QuoteCard />
        </div>
      </section>

      <section className="section" id="banks">
        <div className="wrap">
          <div className="section-title">
            <div className="eyebrow">Partner banks</div>
            <h2>Plans from banks you already trust</h2>
            <p>Compare health plans distributed by India’s largest public and private sector banks.</p>
          </div>
          <div className="bank-grid">
            {banks.map((b) => (
              <Link className="bank-card" key={b.slug} to={`/all-plans?bank=${b.slug}`}>
                <BankMono plan={b} />
                <span>
                  <b>{b.name}</b>
                  <span>{b.plans} plan{b.plans === 1 ? '' : 's'} · {b.claimSettlementRatio}% claims settled</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="why">
        <div className="wrap">
          <div className="section-title">
            <div className="eyebrow">Why buy health insurance</div>
            <h2>One hospital stay can undo years of savings</h2>
            <p>Medical costs in India rise faster than most salaries. A health plan keeps treatment decisions about health, not money.</p>
          </div>
          <div className="why-grid">
            <div className="why-card"><span className="ico"><Wallet /></span><h3>Protect your savings</h3><p>Surgery, ICU stays and long treatments are paid by the insurer, not from your emergency fund or loans.</p></div>
            <div className="why-card"><span className="ico"><Hospital /></span><h3>Cashless treatment</h3><p>At network hospitals the bill is settled directly with the insurer, so you don’t arrange money during an emergency.</p></div>
            <div className="why-card"><span className="ico"><Clock /></span><h3>Waiting periods start early</h3><p>Cover for existing illnesses and maternity begins only after a waiting period. Buying sooner means you’re covered sooner.</p></div>
            <div className="why-card"><span className="ico"><Shield /></span><h3>Beyond your office cover</h3><p>Employer cover ends when you change jobs or retire, and is often too small for parents. Your own plan stays with you.</p></div>
            <div className="why-card"><span className="ico"><Wallet /></span><h3>Tax benefit under 80D</h3><p>Premiums for yourself, family and parents can be deducted from taxable income under Section 80D, within the limits set by law.</p></div>
            <div className="why-card"><span className="ico"><Shield /></span><h3>Lower premium when young</h3><p>Premiums depend on age and health at purchase. Starting young locks in a lower price and fewer exclusions.</p></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <button className="btn accent" onClick={() => start()}>Find my plan <Arrow /></button>
          </div>
        </div>
      </section>


      <section className="section" id="faq">
        <div className="wrap">
          <div className="section-title">
            <div className="eyebrow">Questions</div>
            <h2>Frequently asked questions</h2>
          </div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Ready to find your plan?</h2>
              <p>Get a personalised comparison in about two minutes.</p>
            </div>
            <button className="btn accent" onClick={() => start()} style={{ height: 52 }}>Start now <Arrow /></button>
          </div>
        </div>
      </section>
    </>
  );
}
