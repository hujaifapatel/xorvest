// The 14 questions shown in the questionnaire pop-up. Each has a follow-up
// ("sub question") that appears under it once it is answered. Follow-ups can
// depend on the answer: `followUp` maps an answer value (or '*' for any
// answer) to the sub question. The browser fetches this list from the API.

export const ADULTS = ['self', 'spouse', 'father', 'mother'];

// opts(['value', 'Label'], ...) → [{ value, label }]
const opts = (...pairs) => pairs.map(([value, label]) => ({ value, label }));
// sub('id', 'Question?', ['value', 'Label'], ...) → a follow-up question
const sub = (id, prompt, ...pairs) => ({ id, prompt, options: opts(...pairs) });
const YES_NO = [['yes', 'Yes'], ['no', 'No']];
const PRIORITIES = [['premium', 'Lowest premium'], ['coverage', 'Widest coverage'], ['claims', 'Fast, reliable claims'], ['network', 'Most cashless hospitals']];

export const CITIES = [
  ...['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'].map((c) => ({ label: c, tier: 'metro' })),
  ...['Jaipur', 'Lucknow', 'Kochi', 'Chandigarh', 'Indore', 'Surat'].map((c) => ({ label: c, tier: 'tier1' })),
  { label: 'Other city / town', tier: 'tier2' },
].map((c) => ({ ...c, value: c.label.toLowerCase().split(' ')[0] }));

export const cityTier = (value) => CITIES.find((c) => c.value === value)?.tier || 'tier2';

export const QUESTIONS = [
  {
    id: 'gender', type: 'single', prompt: 'Let’s start with you', help: 'This helps us label your family members.',
    options: opts(['male', 'Male'], ['female', 'Female']),
    followUp: { '*': sub('occupation', 'What do you do for a living?', ['salaried', 'Salaried'], ['self-employed', 'Self-employed'], ['business', 'Business owner'], ['retired', 'Retired'], ['other', 'Student / other']) },
  },
  {
    id: 'members', type: 'members', prompt: 'Who would you like to insure?', help: 'One family floater usually costs less than separate policies.',
    followUp: { '*': sub('sameCity', 'Do all of them live with you in the same city?', ['yes', 'Yes'], ['no', 'No, some live elsewhere']) },
  },
  {
    id: 'ages', type: 'ages', prompt: 'How old are they?', help: 'Premium depends on the age of the eldest member.',
    followUp: { '*': sub('medicalCheck', 'Has anyone had a full medical check-up in the last year?', ['normal', 'Yes, all normal'], ['findings', 'Yes, with some findings'], ['no', 'No']) },
  },
  {
    id: 'city', type: 'city', prompt: 'Which city do you live in?', help: 'Hospital costs, and so premiums, differ by city.', options: CITIES,
    followUp: { '*': sub('hospitalPref', 'Which hospitals do you usually prefer?', ['chain', 'Large private hospitals'], ['local', 'Nearby local hospitals'], ['any', 'No preference']) },
  },
  {
    id: 'conditions', type: 'multi', exclusive: 'none', prompt: 'Does any member have an existing illness?', help: 'Select all that apply.',
    options: opts(['none', 'No existing illness'], ['diabetes', 'Diabetes'], ['hypertension', 'Blood pressure'], ['thyroid', 'Thyroid'], ['asthma', 'Asthma'], ['cardiac', 'Heart disease'], ['other', 'Other illness']),
    followUp: {
      none: sub('familyHistory', 'Any serious illness in close family (parents, siblings)?', ...YES_NO),
      '*': sub('illnessSince', 'Since when has the illness been diagnosed?', ['lt1', 'Less than 1 year'], ['1to3', '1 – 3 years'], ['gt3', 'More than 3 years']),
    },
  },
  {
    id: 'tobacco', type: 'single', prompt: 'Does anyone smoke or chew tobacco?', options: opts(['no', 'No'], ['yes', 'Yes']),
    followUp: {
      yes: sub('tobaccoFrequency', 'How often?', ['daily', 'Daily'], ['occasional', 'Occasionally'], ['quit', 'Quit in the last 12 months']),
      no: sub('alcohol', 'Does anyone drink alcohol regularly?', ...YES_NO),
    },
  },
  {
    id: 'hospitalised', type: 'single', prompt: 'Any hospital admissions in the last 3 years?', options: opts(['no', 'None'], ['once', 'Once'], ['multiple', 'More than once']),
    followUp: {
      no: sub('plannedTreatment', 'Any surgery or treatment planned in the next year?', ...YES_NO),
      '*': sub('admissionReason', 'What was the main reason?', ['surgery', 'Surgery'], ['accident', 'Accident'], ['illness', 'Illness / infection'], ['other', 'Other']),
    },
  },
  {
    id: 'income', type: 'single', prompt: 'What is your annual family income?',
    options: opts(['lt5', 'Below ₹5 lakh'], ['5to10', '₹5 – 10 lakh'], ['10to25', '₹10 – 25 lakh'], ['25to50', '₹25 – 50 lakh'], ['gt50', 'Above ₹50 lakh']),
    followUp: { '*': sub('earners', 'How many earning members are in the family?', ['one', 'One'], ['two', 'Two or more']) },
  },
  {
    id: 'budget', type: 'single', prompt: 'How much would you like to spend each month?',
    options: opts(['1000', 'Up to ₹1,000'], ['2000', '₹1,000 – 2,000'], ['4000', '₹2,000 – 4,000'], ['8000', '₹4,000 – 8,000'], ['15000', 'Above ₹8,000']),
    followUp: { '*': sub('payFrequency', 'How would you prefer to pay?', ['monthly', 'Monthly'], ['yearly', 'Once a year'], ['multiyear', 'Every 2–3 years (bigger discount)']) },
  },
  {
    id: 'employerCover', type: 'single', prompt: 'Do you have health cover from your employer?',
    options: opts(['0', 'No'], ['3', 'Yes, up to ₹5 lakh'], ['7', 'Yes, ₹5 – 10 lakh'], ['12', 'Yes, above ₹10 lakh']),
    followUp: {
      0: sub('priorPolicy', 'Have you had a personal health policy before?', ['active', 'Yes, still active'], ['lapsed', 'Yes, but it lapsed'], ['never', 'Never']),
      '*': sub('employerParents', 'Does your employer’s cover include your parents?', ...YES_NO),
    },
  },
  {
    id: 'room', type: 'single', prompt: 'Which hospital room would you prefer?', options: opts(['any', 'Any room, no limit'], ['single', 'Single private room'], ['shared', 'Shared room is fine']),
    followUp: { '*': sub('homeCare', 'Would you like treatment at home covered, when hospital beds aren’t available?', ...YES_NO) },
  },
  {
    id: 'copay', type: 'single', prompt: 'Would you pay a small share of each claim for a lower premium?', options: opts(['never', 'No, insurer should pay in full'], ['acceptable', 'Yes, a small co-pay is okay']),
    followUp: {
      acceptable: sub('copayShare', 'Up to what share of each claim?', ['10', 'Up to 10%'], ['20', 'Up to 20%']),
      never: sub('deductible', 'Would you pay the first ₹25,000 of claims each year instead, for a lower premium?', ...YES_NO),
    },
  },
  {
    id: 'opd', type: 'single', prompt: 'Do you want doctor consultations (OPD) covered?', options: opts(['essential', 'Must have'], ['nice', 'Good to have'], ['no', 'Not needed']),
    followUp: {
      no: sub('healthCheckup', 'Would you like a free yearly health check-up?', ...YES_NO),
      '*': sub('opdReason', 'What do you mostly visit doctors for?', ['checkups', 'Routine check-ups'], ['chronic', 'Ongoing illness follow-ups'], ['kids', 'Children’s visits'], ['other', 'Other']),
    },
  },
  {
    id: 'priority', type: 'single', prompt: 'What matters most to you?', options: opts(...PRIORITIES),
    followUp: { '*': sub('secondPriority', 'And what matters second most?', ...PRIORITIES) },
  },
];

// Which follow-up applies to the current answer (or null if not answered yet).
export function followUpFor(q, a) {
  const v = a[q.id];
  if (!q.followUp || v == null || (Array.isArray(v) && !v.length)) return null;
  const key = Array.isArray(v) ? (v.includes('none') ? 'none' : '*') : typeof v === 'object' ? '*' : v;
  return q.followUp[key] ?? q.followUp['*'] ?? null;
}

// Server-side check of a submitted questionnaire. Returns a list of problems.
export function validateAnswers(a = {}) {
  const errors = [];
  const m = a.members || {};
  const adults = ADULTS.filter((k) => m[k] === true);
  if (!adults.length) errors.push('Select at least one adult member.');
  if (+(m.son || 0) < 0 || +(m.daughter || 0) < 0 || +(m.son || 0) + +(m.daughter || 0) > 4) errors.push('Up to 4 children.');
  for (const k of adults) if (!(a.ages?.[k] >= 18 && a.ages?.[k] <= 90)) errors.push(`Age of ${k} must be 18–90.`);

  for (const q of QUESTIONS) {
    const v = a[q.id];
    if (q.options) {
      const allowed = q.options.map((o) => o.value);
      const ok = q.type === 'multi' ? Array.isArray(v) && v.length > 0 && v.every((x) => allowed.includes(x)) : allowed.includes(v);
      if (!ok) errors.push(`Please answer: ${q.prompt}`);
    }
    const f = followUpFor(q, a);
    if (f && !f.options.some((o) => o.value === a[f.id])) errors.push(`Please answer: ${f.prompt}`);
  }
  return errors;
}
