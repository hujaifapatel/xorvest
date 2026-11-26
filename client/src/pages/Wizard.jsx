import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, store } from '../lib/api.js';
import { roman, inWords } from '../lib/format.js';

const DEFAULT_ANSWERS = { members: { self: true, spouse: false, children: 0, parents: 0 } };

function isAnswered(q, v) {
  if (q.type === 'members') return true;
  if (q.type === 'number') {
    const n = Number(v);
    return v !== '' && v != null && Number.isInteger(n) && n >= q.min && n <= q.max;
  }
  if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
  return v != null && v !== '';
}

function describe(q, v) {
  if (q.type === 'members') {
    const parts = ['Yourself'];
    if (v.spouse) parts.push('spouse');
    if (v.children) parts.push(`${inWords(v.children)} ${v.children === 1 ? 'child' : 'children'}`);
    if (v.parents) parts.push(`${inWords(v.parents)} ${v.parents === 1 ? 'parent' : 'parents'}`);
    return parts.join(', ').replace(/, ([^,]*)$/, ' and $1');
  }
  if (q.type === 'number') return `${v} years`;
  if (q.type === 'multi') return v.map((x) => q.options.find((o) => o.value === x)?.label).join(', ');
  return q.options.find((o) => o.value === v)?.label ?? '—';
}

function Stepper({ value, min, max, onChange, label }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label}`}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label}`}>+</button>
    </div>
  );
}

function MembersField({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div className="options">
      <div className="member-row">
        <span>Yourself<small>The proposer is always included</small></span>
        <span className="fixed-note">Included</span>
      </div>
      <div className="member-row">
        <span>Spouse or partner</span>
        <Stepper label="spouse" value={value.spouse ? 1 : 0} min={0} max={1} onChange={(n) => set('spouse', n === 1)} />
      </div>
      <div className="member-row">
        <span>Children<small>Dependent children up to the age of 25</small></span>
        <Stepper label="children" value={value.children} min={0} max={4} onChange={(n) => set('children', n)} />
      </div>
      <div className="member-row">
        <span>Parents or parents-in-law</span>
        <Stepper label="parents" value={value.parents} min={0} max={2} onChange={(n) => set('parents', n)} />
      </div>
    </div>
  );
}

function ChoiceField({ q, value, onChange }) {
  const multi = q.type === 'multi';
  const selected = (v) => (multi ? (value || []).includes(v) : value === v);

  const toggle = (v) => {
    if (!multi) return onChange(v);
    let next = new Set(value || []);
    if (next.has(v)) next.delete(v);
    else {
      if (v === q.exclusive) next = new Set();
      else next.delete(q.exclusive);
      next.add(v);
    }
    onChange([...next]);
  };

  return (
    <div className="options" role={multi ? 'group' : 'radiogroup'} aria-label={q.prompt}>
      {q.options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role={multi ? 'checkbox' : 'radio'}
          aria-checked={selected(o.value)}
          className={`option${multi ? ' multi' : ''}`}
          onClick={() => toggle(o.value)}
        >
          <span className="mark" aria-hidden="true" />
          <span className="label">
            {o.label}
            {o.note && <span className="note">{o.note}</span>}
          </span>
          {i < 9 && <span className="key" aria-hidden="true">{i + 1}</span>}
        </button>
      ))}
    </div>
  );
}

function AgeField({ q, value, onChange, onEnter }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="age-field">
      <input
        ref={ref}
        type="number"
        inputMode="numeric"
        min={q.min}
        max={q.max}
        value={value ?? ''}
        placeholder="—"
        aria-label="Age of the eldest member"
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
      />
      <span>years of age</span>
    </div>
  );
}

export default function Wizard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [answers, setAnswers] = useState(() => store.get('xv.answers', DEFAULT_ANSWERS));
  const [step, setStep] = useState(() => store.get('xv.step', 0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [amending, setAmending] = useState(false);
  const advanceTimer = useRef(null);

  useEffect(() => {
    api.questions().then(setData).catch(() => setLoadError('We could not reach the register. Please ensure the server is running.'));
  }, []);

  useEffect(() => {
    store.set('xv.answers', answers);
  }, [answers]);
  useEffect(() => {
    store.set('xv.step', step);
  }, [step]);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const questions = data?.questions ?? [];
  const total = questions.length;
  const onReview = total > 0 && step >= total;
  const q = questions[Math.min(step, total - 1)];
  const value = q ? answers[q.id] : undefined;
  const canContinue = q ? isAnswered(q, value) : false;

  const chapterIndex = useMemo(() => {
    if (!data || !q) return 0;
    if (onReview) return data.chapters.length;
    return data.chapters.findIndex((c) => c.id === q.chapter);
  }, [data, q, onReview]);

  const next = useCallback(() => {
    setError('');
    if (!onReview && !canContinue) {
      setError(q?.type === 'number' ? `Please enter an age between ${q.min} and ${q.max}.` : 'Please make a selection to continue.');
      return;
    }
    if (amending) {
      setAmending(false);
      return setStep(total);
    }
    setStep((s) => Math.min(s + 1, total));
  }, [onReview, canContinue, q, total, amending]);

  const back = () => {
    setError('');
    clearTimeout(advanceTimer.current);
    setStep((s) => Math.max(0, s - 1));
  };

  const setValue = (v) => {
    setError('');
    setAnswers((a) => ({ ...a, [q.id]: v }));
    if (q.type === 'single') {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        if (amending) {
          setAmending(false);
          setStep(total);
        } else setStep((s) => Math.min(s + 1, total));
      }, 280);
    }
  };

  // Keyboard: digits pick an option, Enter continues.
  useEffect(() => {
    const onKey = (e) => {
      if (!q || onReview || e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') return next();
      const idx = Number(e.key) - 1;
      if (q.options && idx >= 0 && idx < q.options.length) {
        const v = q.options[idx].value;
        if (q.type === 'multi') {
          document.querySelectorAll('.option')[idx]?.click();
        } else setValue(v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.assess(answers);
      store.remove('xv.answers');
      store.remove('xv.step');
      navigate(`/recommendation/${res.id}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  if (loadError) return <div className="wrap loading">{loadError}</div>;
  if (!data) return <div className="wrap loading">Opening the register…</div>;

  const progress = ((onReview ? total : step) / total) * 100;

  return (
    <div className="wrap consult">
      <aside className="chapters" aria-label="Chapters">
        <div className="eyebrow">The Consultation</div>
        <ol>
          {data.chapters.map((c, i) => (
            <li key={c.id} className={i === chapterIndex ? 'current' : i < chapterIndex ? 'done' : ''}>
              <span>{roman(i + 1)}.</span>
              <span>{c.title}</span>
            </li>
          ))}
          <li className={onReview ? 'current' : ''}>
            <span>{roman(data.chapters.length + 1)}.</span>
            <span>Your Answers</span>
          </li>
        </ol>
      </aside>

      <section className="question" aria-live="polite">
        <div className="progress" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>

        {onReview ? (
          <>
            <div className="qmeta">
              <span className="eyebrow">Before we advise</span>
              <span className="count">All {total} questions answered</span>
            </div>
            <h1>Please review your answers.</h1>
            <p className="help">Amend anything that is not quite right; our advice will only be as good as these answers.</p>
            <div className="review">
              {questions.map((qq, i) => (
                <div className="review-row" key={qq.id}>
                  <span className="q">{qq.prompt}</span>
                  <span className="a">{describe(qq, answers[qq.id])}</span>
                  <button type="button" className="textlink" onClick={() => { setAmending(true); setStep(i); }}>Amend</button>
                </div>
              ))}
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="qnav">
              <button type="button" className="textlink" onClick={back}>← Previous</button>
              <button type="button" className="btn" onClick={submit} disabled={submitting}>
                {submitting ? 'Preparing…' : 'Prepare my recommendation'} <span className="arrow">→</span>
              </button>
            </div>
          </>
        ) : (
          <div key={q.id}>
            <div className="qmeta">
              <span className="eyebrow">{data.chapters[chapterIndex]?.title}</span>
              <span className="count">Question {roman(step + 1)} of {roman(total)}</span>
            </div>
            <h1>{q.prompt}</h1>
            {q.help ? <p className="help">{q.help}</p> : <div style={{ height: 18 }} />}

            {q.type === 'members' && <MembersField value={value || DEFAULT_ANSWERS.members} onChange={setValue} />}
            {q.type === 'number' && <AgeField q={q} value={value} onChange={setValue} onEnter={next} />}
            {(q.type === 'single' || q.type === 'multi') && <ChoiceField q={q} value={value} onChange={setValue} />}

            {error && <p className="error" role="alert">{error}</p>}
            <div className="qnav">
              <button type="button" className="textlink" onClick={back} disabled={step === 0}>← Previous</button>
              <button type="button" className="btn ghost" onClick={next}>
                Continue <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
