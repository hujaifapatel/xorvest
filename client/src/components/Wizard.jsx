import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, store } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { memberLabel } from '../lib/format.js';
import Avatar from './Avatar.jsx';
import AuthForm from './AuthForm.jsx';
import { Back, Arrow, Check, Close, Lock } from './Icons.jsx';

const ADULTS = ['self', 'spouse', 'father', 'mother'];
const DEFAULT = { gender: 'male', members: { self: true, spouse: false, son: 0, daughter: 0, father: false, mother: false }, ages: {} };

const WizardContext = createContext(null);
export const useWizard = () => useContext(WizardContext);

export function WizardProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState(() => store.get('pr.answers', DEFAULT));
  const [step, setStep] = useState(() => store.get('pr.step', 0));

  useEffect(() => { store.set('pr.answers', answers); }, [answers]);
  useEffect(() => { store.set('pr.step', step); }, [step]);

  const start = useCallback(({ prefill, at } = {}) => {
    if (prefill) setAnswers((a) => ({ ...a, ...prefill }));
    if (typeof at === 'number') setStep(at);
    setOpen(true);
  }, []);

  const reset = useCallback(() => {
    setAnswers(DEFAULT);
    setStep(0);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ open, start, close, answers, setAnswers, step, setStep, reset }), [open, start, close, answers, step, reset]);
  return (
    <WizardContext.Provider value={value}>
      {children}
      {open && <WizardModal />}
    </WizardContext.Provider>
  );
}

function isAnswered(q, v, answers) {
  if (q.type === 'members') return ADULTS.some((k) => v?.[k]);
  if (q.type === 'ages') {
    return ADULTS.filter((k) => answers.members?.[k]).every((k) => Number(v?.[k]) >= q.min && Number(v?.[k]) <= q.max);
  }
  if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
  return v != null && v !== '';
}

const ERRORS = {
  members: 'Please select at least one adult to insure.',
  ages: 'Please select the age of each member.',
  default: 'Please choose an option to continue.',
};

/* ───────── fields ───────── */

export function MemberTiles({ gender, value, onChange }) {
  const toggle = (k) => onChange({ ...value, [k]: !value[k] });
  const count = (k, d) => {
    const kids = (value.son || 0) + (value.daughter || 0);
    const next = Math.max(0, (value[k] || 0) + d);
    if (d > 0 && kids >= 4) return;
    onChange({ ...value, [k]: next });
  };
  const tile = (k) => {
    const isKid = k === 'son' || k === 'daughter';
    const on = isKid ? value[k] > 0 : !!value[k];
    return (
      <div
        key={k}
        role={isKid ? undefined : 'checkbox'}
        aria-checked={isKid ? undefined : on}
        tabIndex={isKid ? undefined : 0}
        className={`tile${on ? ' on' : ''}`}
        onClick={isKid ? () => value[k] === 0 && count(k, 1) : () => toggle(k)}
        onKeyDown={(e) => !isKid && (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), toggle(k))}
      >
        <Avatar member={k} gender={gender} />
        <span>{memberLabel(k, gender)}</span>
        {isKid && on && (
          <span className="counter" onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label={`Fewer ${k}s`} onClick={() => count(k, -1)}>−</button>
            <span className="num">{value[k]}</span>
            <button type="button" aria-label={`More ${k}s`} onClick={() => count(k, 1)} disabled={(value.son || 0) + (value.daughter || 0) >= 4}>+</button>
          </span>
        )}
        {!isKid && <span className="tick"><Check size={11} /></span>}
      </div>
    );
  };
  return <div className="tiles">{['self', 'spouse', 'son', 'daughter', 'father', 'mother'].map(tile)}</div>;
}

function AgesField({ q, answers, onChange }) {
  const members = ADULTS.filter((k) => answers.members?.[k]);
  const ages = answers.ages || {};
  const range = (k) => {
    const lo = k === 'father' || k === 'mother' ? 36 : q.min;
    return Array.from({ length: q.max - lo + 1 }, (_, i) => lo + i);
  };
  return (
    <div className="age-list">
      {members.map((k) => (
        <div className="age-row" key={k}>
          <Avatar member={k} gender={answers.gender} />
          <b>{memberLabel(k, answers.gender)}</b>
          <select
            className="select"
            aria-label={`Age of ${memberLabel(k, answers.gender)}`}
            value={ages[k] ?? ''}
            onChange={(e) => onChange({ ...ages, [k]: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Select age</option>
            {range(k).map((n) => <option key={n} value={n}>{n} years</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function CityField({ q, value, onChange }) {
  const [query, setQuery] = useState('');
  const shown = q.options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <>
      <input className="city-search" placeholder="Search your city" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search city" />
      <div className="chips" role="radiogroup" aria-label="City">
        {shown.map((o) => (
          <button type="button" role="radio" aria-checked={value === o.value} key={o.value} className={`chip${value === o.value ? ' on' : ''}`} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
        {!shown.length && <button type="button" className="chip" onClick={() => onChange('other')}>Other city / town</button>}
      </div>
    </>
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
  const oneCol = q.options.length <= 3 && q.options.some((o) => o.label.length > 22);
  return (
    <div className={`choices${oneCol ? ' one-col' : ''}`} role={multi ? 'group' : 'radiogroup'} aria-label={q.prompt}>
      {q.options.map((o) => (
        <button key={o.value} type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={selected(o.value)} className={`choice${multi ? ' multi' : ''}`} onClick={() => toggle(o.value)}>
          <span className="dot" />
          <span>{o.label}{o.note && <small>{o.note}</small>}</span>
        </button>
      ))}
    </div>
  );
}

function Ring({ pct }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" aria-hidden="true">
      <svg width="46" height="46">
        <circle cx="23" cy="23" r={r} fill="none" stroke="#e1e7f3" strokeWidth="4" />
        <circle cx="23" cy="23" r={r} fill="none" stroke="#11804a" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .3s' }} />
      </svg>
      <b>{pct}%</b>
    </div>
  );
}

/* ───────── modal ───────── */

function WizardModal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { close, answers, setAnswers, step, setStep, reset } = useWizard();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('questions'); // questions | auth | submitting
  const timer = useRef(null);

  useEffect(() => {
    api.questions().then(setData).catch(() => setLoadError('We couldn’t reach the server. Please make sure it is running.'));
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [close]);

  useEffect(() => () => {
    clearTimeout(timer.current);
  }, []);

  const questions = data?.questions ?? [];
  const total = questions.length;
  const idx = Math.min(step, Math.max(total - 1, 0));
  const q = questions[idx];
  const value = q ? answers[q.id] : undefined;

  const submit = useCallback(async () => {
    setPhase('submitting');
    setError('');
    try {
      const res = await api.assess(answers);
      reset();
      close();
      navigate(`/plans/${res.id}`);
    } catch (e) {
      if (e.status === 401) setPhase('auth');
      else {
        setError(e.message);
        setPhase('questions');
      }
    }
  }, [answers, close, navigate, reset]);

  const finish = useCallback(() => {
    if (!user) setPhase('auth');
    else submit();
  }, [user, submit]);

  const next = useCallback(() => {
    if (!q) return;
    if (!isAnswered(q, value, answers)) {
      setError(ERRORS[q.type] || ERRORS.default);
      return;
    }
    setError('');
    if (idx >= total - 1) finish();
    else setStep(idx + 1);
  }, [q, value, answers, idx, total, finish, setStep]);

  const back = () => {
    setError('');
    clearTimeout(timer.current);
    if (phase === 'auth') return setPhase('questions');
    setStep(Math.max(0, idx - 1));
  };

  const setValue = (v) => {
    setError('');
    setAnswers((a) => ({ ...a, [q.id]: v }));
    if (q.type === 'single' || q.type === 'city') {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (idx >= total - 1) finish();
        else setStep(idx + 1);
      }, 260);
    }
  };

  const chapterIdx = data && q ? data.chapters.findIndex((c) => c.id === q.chapter) : 0;
  const pct = total ? Math.round(((phase === 'questions' ? idx : total) / total) * 100) : 0;

  const chapterProgress = (ci) => {
    if (!data) return 0;
    const inCh = questions.map((qq, i) => [qq, i]).filter(([qq]) => qq.chapter === data.chapters[ci].id);
    const done = inCh.filter(([, i]) => (phase === 'questions' ? i < idx : true)).length;
    return (done / inCh.length) * 100;
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="wz-title">
        <div className="modal-head">
          <Ring pct={pct} />
          <div className="title">
            <b>Find the right health plan</b>
            <span>{phase === 'auth' ? 'Last step: save your results' : total ? `Question ${idx + 1} of ${total}` : 'Loading…'}</span>
          </div>
          <button className="close" onClick={close} aria-label="Close"><Close /></button>
        </div>

        {data && (
          <div className="chapter-bar" aria-hidden="true">
            {data.chapters.map((c, i) => (
              <div key={c.id} className={i === chapterIdx && phase === 'questions' ? 'cur' : ''}>
                <i><em style={{ width: `${chapterProgress(i)}%` }} /></i>
                <span>{c.title}</span>
              </div>
            ))}
          </div>
        )}

        <div className="modal-body">
          {loadError && <p className="err">{loadError}</p>}
          {!data && !loadError && <div className="analysing"><div className="spinner" /></div>}

          {data && phase === 'questions' && q && (
            <div key={q.id}>
              <h2 id="wz-title">{q.prompt}</h2>
              {q.help ? <p className="help">{q.help}</p> : <div style={{ height: 18 }} />}
              {q.type === 'members' && <MemberTiles gender={answers.gender} value={value || DEFAULT.members} onChange={setValue} />}
              {q.type === 'ages' && <AgesField q={q} answers={answers} onChange={setValue} />}
              {q.type === 'city' && <CityField q={q} value={value} onChange={setValue} />}
              {(q.type === 'single' || q.type === 'multi') && <ChoiceField q={q} value={value} onChange={setValue} />}
              {error && <p className="err" role="alert">{error}</p>}
            </div>
          )}

          {phase === 'auth' && (
            <div>
              <h2 id="wz-title">Your plans are ready</h2>
              <p className="help">Create a free account to see and save your personalised plan comparison.</p>
              <div className="notice"><Lock /> We never share your details with banks without your consent.</div>
              <AuthForm compact onDone={() => submit()} />
            </div>
          )}

          {phase === 'submitting' && (
            <div className="analysing">
              <div className="spinner" />
              <h2 id="wz-title">Comparing plans for your family…</h2>
              <p className="help">Checking eligibility, pricing and benefits across all banks.</p>
            </div>
          )}
        </div>

        {phase !== 'submitting' && data && (
          <div className="modal-foot">
            <button className="btn ghost" onClick={back} disabled={phase === 'questions' && idx === 0}>
              <Back /> Back
            </button>
            {phase === 'questions' && (
              <button className="btn" onClick={next}>
                {idx >= total - 1 ? 'View plans' : 'Continue'} <Arrow />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
