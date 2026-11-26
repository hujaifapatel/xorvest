// The 15 questions shown in the questionnaire pop-up. The browser fetches this
// list, so questions can be changed here without touching the frontend.

export const ADULTS = ['self', 'spouse', 'father', 'mother'];

// opts(['value', 'Label'], ...) → [{ value, label }]
const opts = (...pairs) => pairs.map(([value, label, note]) => ({ value, label, note }));

export const CITIES = [
  ...['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'].map((c) => ({ label: c, tier: 'metro' })),
  ...['Jaipur', 'Lucknow', 'Kochi', 'Chandigarh', 'Indore', 'Surat'].map((c) => ({ label: c, tier: 'tier1' })),
  { label: 'Other city / town', tier: 'tier2' },
].map((c) => ({ ...c, value: c.label.toLowerCase().split(' ')[0] }));

export const cityTier = (value) => CITIES.find((c) => c.value === value)?.tier || 'tier2';

export const QUESTIONS = [
  { id: 'gender', type: 'single', prompt: 'Let’s start with you', help: 'This helps us label your family members.', options: opts(['male', 'Male'], ['female', 'Female']) },
  { id: 'members', type: 'members', prompt: 'Who would you like to insure?', help: 'One family floater usually costs less than separate policies.' },
  { id: 'ages', type: 'ages', prompt: 'How old are they?', help: 'Premium depends on the age of the eldest member.' },
  { id: 'city', type: 'city', prompt: 'Which city do you live in?', help: 'Hospital costs, and so premiums, differ by city.', options: CITIES },
  {
    id: 'conditions', type: 'multi', exclusive: 'none', prompt: 'Does any member have an existing illness?', help: 'Select all that apply.',
    options: opts(['none', 'No existing illness'], ['diabetes', 'Diabetes'], ['hypertension', 'Blood pressure'], ['thyroid', 'Thyroid'], ['asthma', 'Asthma'], ['cardiac', 'Heart disease'], ['other', 'Other illness']),
  },
  { id: 'tobacco', type: 'single', prompt: 'Does anyone smoke or chew tobacco?', options: opts(['no', 'No'], ['yes', 'Yes']) },
  { id: 'hospitalised', type: 'single', prompt: 'Any hospital admissions in the last 3 years?', options: opts(['no', 'None'], ['once', 'Once'], ['multiple', 'More than once']) },
  { id: 'maternity', type: 'single', prompt: 'Planning a baby in the next 3–4 years?', help: 'Maternity cover has a waiting period.', options: opts(['yes', 'Yes'], ['unsure', 'Maybe'], ['no', 'No']) },
  { id: 'income', type: 'single', prompt: 'What is your annual family income?', options: opts(['lt5', 'Below ₹5 lakh'], ['5to10', '₹5 – 10 lakh'], ['10to25', '₹10 – 25 lakh'], ['25to50', '₹25 – 50 lakh'], ['gt50', 'Above ₹50 lakh']) },
  { id: 'budget', type: 'single', prompt: 'How much would you like to spend each month?', options: opts(['1000', 'Up to ₹1,000'], ['2000', '₹1,000 – 2,000'], ['4000', '₹2,000 – 4,000'], ['8000', '₹4,000 – 8,000'], ['15000', 'Above ₹8,000']) },
  { id: 'employerCover', type: 'single', prompt: 'Do you have health cover from your employer?', options: opts(['0', 'No'], ['3', 'Yes, up to ₹5 lakh'], ['7', 'Yes, ₹5 – 10 lakh'], ['12', 'Yes, above ₹10 lakh']) },
  { id: 'room', type: 'single', prompt: 'Which hospital room would you prefer?', options: opts(['any', 'Any room, no limit'], ['single', 'Single private room'], ['shared', 'Shared room is fine']) },
  { id: 'copay', type: 'single', prompt: 'Would you pay a small share of each claim for a lower premium?', options: opts(['never', 'No, insurer should pay in full'], ['acceptable', 'Yes, a small co-pay is okay']) },
  { id: 'opd', type: 'single', prompt: 'Do you want doctor consultations (OPD) covered?', options: opts(['essential', 'Must have'], ['nice', 'Good to have'], ['no', 'Not needed']) },
  { id: 'priority', type: 'single', prompt: 'What matters most to you?', options: opts(['premium', 'Lowest premium'], ['coverage', 'Widest coverage'], ['claims', 'Fast, reliable claims'], ['network', 'Most cashless hospitals']) },
];

// Server-side check of a submitted questionnaire. Returns a list of problems.
export function validateAnswers(a = {}) {
  const errors = [];
  const m = a.members || {};
  const adults = ADULTS.filter((k) => m[k] === true);
  if (!adults.length) errors.push('Select at least one adult member.');
  if (+(m.son || 0) < 0 || +(m.daughter || 0) < 0 || +(m.son || 0) + +(m.daughter || 0) > 4) errors.push('Up to 4 children.');
  for (const k of adults) if (!(a.ages?.[k] >= 18 && a.ages?.[k] <= 90)) errors.push(`Age of ${k} must be 18–90.`);

  for (const q of QUESTIONS.filter((q) => q.options)) {
    const allowed = q.options.map((o) => o.value);
    const v = a[q.id];
    const ok = q.type === 'multi' ? Array.isArray(v) && v.length > 0 && v.every((x) => allowed.includes(x)) : allowed.includes(v);
    if (!ok) errors.push(`Please answer: ${q.prompt}`);
  }
  return errors;
}
