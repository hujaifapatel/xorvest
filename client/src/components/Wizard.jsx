// The questionnaire pop-up. Steps: questions (each with a follow-up) → summary → login/register (if needed) → results page.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, store } from '../lib/api.js';
import { useSession } from '../lib/session.jsx';
import { memberLabel } from '../lib/format.js';
import { Avatar, Close, Arrow } from './ui.jsx';
import AuthForm from './AuthForm.jsx';

const ADULTS = ['self', 'spouse', 'father', 'mother'];
const MEMBERS = ['self', 'spouse', 'son', 'daughter', 'father', 'mother'];
const AGES = Array.from({ length: 73 }, (_, i) => i + 18);
const START = { gender: 'male', members: { self: true }, ages: {} };

const Wizard = createContext(null);
export const useWizard = () => useContext(Wizard);

// Wrap the app with this so any button can call start() to open the pop-up.
export function WizardProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => store.get('answers', START));
  useEffect(() => {
    store.set('answers', answers);
  }, [answers]);

  const start = (prefill = {}, at = 0) => {
    setAnswers((a) => ({ ...a, ...prefill }));
    setStep(at);
    setOpen(true);
  };
  const value = { answers, setAnswers, step, setStep, start, close: () => setOpen(false), reset: () => setAnswers(START) };
  return <Wizard.Provider value={value}>{children}{open && <WizardModal />}</Wizard.Provider>;
}

// Family member tiles, also used on the home page.
export function MemberTiles({ gender, value, onChange }) {
  const kids = (value.son || 0) + (value.daughter || 0);
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div className="tiles">
      {MEMBERS.map((k) => {
        const isKid = k === 'son' || k === 'daughter';
        const on = isKid ? value[k] > 0 : !!value[k];
        const click = () => (isKid ? !on && kids < 4 && set(k, 1) : set(k, !on));
        return (
          <div key={k} className={`tile${on ? ' on' : ''}`} role="button" tabIndex={0} aria-pressed={on} onClick={click} onKeyDown={(e) => e.key === 'Enter' && click()}>
            <Avatar member={k} gender={gender} />
            {memberLabel(k, gender)}
            {isKid && on && (
              <span className="counter" onClick={(e) => e.stopPropagation()}>
                <button type="button" aria-label={`Fewer ${k}s`} onClick={() => set(k, value[k] - 1)}>−</button>
                {value[k]}
                <button type="button" aria-label={`More ${k}s`} disabled={kids >= 4} onClick={() => set(k, value[k] + 1)}>+</button>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// The input for one question.
function Field({ q, answers, onPick }) {
  const v = answers[q.id];
  if (q.type === 'members') return <MemberTiles gender={answers.gender} value={v || {}} onChange={onPick} />;
  if (q.type === 'ages') {
    return ADULTS.filter((k) => answers.members?.[k]).map((k) => (
      <label className="age-row" key={k}>
        <Avatar member={k} gender={answers.gender} />
        <b>{memberLabel(k, answers.gender)}</b>
        <select className="select" value={v?.[k] ?? ''} onChange={(e) => onPick({ ...v, [k]: Number(e.target.value) || undefined })}>
          <option value="">Select age</option>
          {AGES.map((n) => <option key={n} value={n}>{n} years</option>)}
        </select>
      </label>
    ));
  }
  const multi = q.type === 'multi';
  const isOn = (o) => (multi ? (v || []).includes(o) : v === o);
  const toggle = (o) => {
    if (!multi) return onPick(o);
    if (isOn(o)) return onPick(v.filter((x) => x !== o));
    onPick(o === q.exclusive ? [o] : [...(v || []).filter((x) => x !== q.exclusive), o]); // "none" can't be combined
  };
  const city = q.type === 'city';
  return (
    <div className={city ? 'chips' : 'choices'}>
      {q.options.map((o) => (
        <button key={o.value} type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={isOn(o.value)} onClick={() => toggle(o.value)}
          className={city ? `chip${isOn(o.value) ? ' on' : ''}` : `choice${multi ? ' multi' : ''}`}>
          {!city && <span className="dot" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Which follow-up (sub question) applies to the current answer. Same rule as the server's followUpFor().
function followUpFor(q, a) {
  const v = a[q.id];
  if (!q.followUp || v == null || (Array.isArray(v) && !v.length)) return null;
  const key = Array.isArray(v) ? (v.includes('none') ? 'none' : '*') : typeof v === 'object' ? '*' : v;
  return q.followUp[key] ?? q.followUp['*'] ?? null;
}

const mainAnswered = (q, a) => {
  const v = a[q.id];
  if (q.type === 'members') return ADULTS.some((k) => v?.[k]);
  if (q.type === 'ages') return ADULTS.filter((k) => a.members?.[k]).every((k) => v?.[k]);
  return Array.isArray(v) ? v.length > 0 : v != null;
};
const isAnswered = (q, a) => mainAnswered(q, a) && (!followUpFor(q, a) || a[followUpFor(q, a).id] != null);

// Readable answer for the summary screen.
function describe(q, a) {
  const v = a[q.id];
  if (q.type === 'members') {
    const kids = ['son', 'daughter'].filter((k) => v?.[k]).map((k) => `${v[k]} ${k}${v[k] > 1 ? 's' : ''}`);
    return [...ADULTS.filter((k) => v?.[k]).map((k) => memberLabel(k, a.gender)), ...kids].join(', ');
  }
  if (q.type === 'ages') return ADULTS.filter((k) => a.members?.[k]).map((k) => `${memberLabel(k, a.gender)} ${v?.[k]}`).join(', ');
  return [].concat(v).map((x) => q.options.find((o) => o.value === x)?.label).join(', ');
}
const describeFollowUp = (f, a) => f.options.find((o) => o.value === a[f.id])?.label;

function WizardModal() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { answers, setAnswers, step, setStep, close, reset } = useWizard();
  const [questions, setQuestions] = useState(null);
  const [editing, setEditing] = useState(false); // came from the summary's Edit button
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef();

  useEffect(() => {
    api.questions()
      .then((list) => {
        setQuestions(list);
        setStep((s) => Math.min(s, list.length)); // start(answers, 99) opens the summary
      })
      .catch(() => setError('Could not reach the server.'));
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const total = questions?.length ?? 0;
  const SUMMARY = total;
  const AUTH = total + 1;
  const q = questions?.[step];

  const advance = () => {
    setError('');
    if (editing || step === total - 1) {
      setEditing(false);
      setStep(SUMMARY);
    } else setStep(step + 1);
  };
  const next = () => (isAnswered(q, answers) ? advance() : setError('Please answer this question to continue.'));
  const pick = (value) => {
    setError('');
    setAnswers((a) => ({ ...a, [q.id]: value }));
  };
  // Answering the follow-up moves on by itself (except for multi-select, where you may still tick more).
  const pickFollowUp = (f, value) => {
    setError('');
    setAnswers((a) => ({ ...a, [f.id]: value }));
    if (q.type !== 'multi') timer.current = setTimeout(advance, 250);
  };
  const f = q && followUpFor(q, answers);
  const submit = async (justLoggedIn) => {
    const missing = questions.findIndex((qq) => !isAnswered(qq, answers));
    if (missing >= 0) {
      setEditing(true);
      setStep(missing);
      return setError('Please answer this question (and its follow-up) to continue.');
    }
    if (!user && !justLoggedIn) return setStep(AUTH);
    setBusy(true);
    try {
      const { id } = await api.assess(answers);
      reset();
      close();
      navigate(`/plans/${id}`);
    } catch (e) {
      setError(e.message);
      setStep(SUMMARY);
    } finally {
      setBusy(false);
    }
  };

  const subtitle = step < total ? `Question ${step + 1} of ${total}` : step === SUMMARY ? 'Review your answers' : 'Last step: save your results';
  let body;
  let footer;
  if (!questions || busy) {
    body = <div className="analysing"><div className="spinner" />{busy && <h2>Comparing plans for your family…</h2>}{error && <p className="err">{error}</p>}</div>;
  } else if (step < total) {
    body = (
      <>
        <h2>{q.prompt}</h2>
        <p className="help">{q.help}</p>
        <Field q={q} answers={answers} onPick={pick} />
        {f && (
          <div className="follow-up">
            <h3>{f.prompt}</h3>
            <div className="chips">
              {f.options.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={answers[f.id] === o.value} className={`chip${answers[f.id] === o.value ? ' on' : ''}`} onClick={() => pickFollowUp(f, o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
    footer = (
      <>
        <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
        <button className="btn" onClick={next}>{editing ? 'Save' : step === total - 1 ? 'Review answers' : 'Continue'} <Arrow /></button>
      </>
    );
  } else if (step === SUMMARY) {
    body = (
      <>
        <h2>Here’s what you told us</h2>
        <p className="help">Check your answers before we compare plans.</p>
        {questions.map((qq, i) => (
          <div className="sum-row" key={qq.id}>
            <div>
              <span>{qq.id === 'gender' ? 'Your gender' : qq.prompt}</span>
              <b>{describe(qq, answers)}</b>
              {followUpFor(qq, answers) && <small>{followUpFor(qq, answers).prompt} <b>{describeFollowUp(followUpFor(qq, answers), answers)}</b></small>}
            </div>
            <button type="button" className="linkbtn" aria-label={`Edit: ${qq.prompt}`} onClick={() => { setEditing(true); setStep(i); }}>Edit</button>
          </div>
        ))}
      </>
    );
    footer = (
      <>
        <button className="btn ghost" onClick={() => setStep(total - 1)}>Back</button>
        <button className="btn accent" onClick={() => submit()}>Confirm & view plans <Arrow /></button>
      </>
    );
  } else {
    body = <><h2>Your plans are ready</h2><p className="help">Create a free account (or log in) to see and save them.</p><AuthForm compact onDone={() => submit(true)} /></>;
    footer = <button className="btn ghost" onClick={() => setStep(SUMMARY)}>Back</button>;
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Find the right health plan">
        <div className="modal-head">
          <div className="title"><b>Find the right health plan</b><span>{subtitle}</span></div>
          <button className="close" onClick={close} aria-label="Close"><Close /></button>
        </div>
        <div className="bar"><i style={{ width: `${total ? (Math.min(step, total) / total) * 100 : 0}%` }} /></div>
        <div className="modal-body">
          {body}
          {error && !busy && questions && <p className="err" role="alert">{error}</p>}
        </div>
        {footer && !busy && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
