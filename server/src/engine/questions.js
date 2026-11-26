// The questionnaire lives on the server so the wizard and the scoring engine
// always agree on ids and option values.

export const CHAPTERS = [
  { id: 'family', title: 'Family' },
  { id: 'health', title: 'Health' },
  { id: 'budget', title: 'Budget' },
  { id: 'preferences', title: 'Preferences' },
];

export const ADULT_MEMBERS = ['self', 'spouse', 'father', 'mother'];

const city = (value, label, tier) => ({ value, label, tier });

export const CITIES = [
  city('mumbai', 'Mumbai', 'metro'),
  city('delhi', 'Delhi NCR', 'metro'),
  city('bengaluru', 'Bengaluru', 'metro'),
  city('hyderabad', 'Hyderabad', 'metro'),
  city('chennai', 'Chennai', 'metro'),
  city('kolkata', 'Kolkata', 'metro'),
  city('pune', 'Pune', 'metro'),
  city('ahmedabad', 'Ahmedabad', 'metro'),
  city('jaipur', 'Jaipur', 'tier1'),
  city('lucknow', 'Lucknow', 'tier1'),
  city('kochi', 'Kochi', 'tier1'),
  city('chandigarh', 'Chandigarh', 'tier1'),
  city('indore', 'Indore', 'tier1'),
  city('surat', 'Surat', 'tier1'),
  city('other', 'Other city / town', 'tier2'),
];

export const QUESTIONS = [
  {
    id: 'gender',
    chapter: 'family',
    type: 'single',
    prompt: 'Let’s start with you',
    help: 'This helps us label your family members correctly.',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  },
  {
    id: 'members',
    chapter: 'family',
    type: 'members',
    prompt: 'Who would you like to insure?',
    help: 'One family floater usually costs less than separate policies.',
  },
  {
    id: 'ages',
    chapter: 'family',
    type: 'ages',
    min: 18,
    max: 90,
    prompt: 'How old are they?',
    help: 'Premium depends on the age of the eldest member.',
  },
  {
    id: 'city',
    chapter: 'family',
    type: 'city',
    prompt: 'Which city do you live in?',
    help: 'We use it to price your plan and find cashless hospitals near you.',
    options: CITIES,
  },
  {
    id: 'conditions',
    chapter: 'health',
    type: 'multi',
    prompt: 'Does any member have an existing illness?',
    help: 'Select all that apply. Honest disclosure keeps claims from being rejected.',
    exclusive: 'none',
    options: [
      { value: 'none', label: 'No existing illness' },
      { value: 'diabetes', label: 'Diabetes' },
      { value: 'hypertension', label: 'Blood pressure' },
      { value: 'thyroid', label: 'Thyroid' },
      { value: 'asthma', label: 'Asthma' },
      { value: 'cardiac', label: 'Heart disease' },
      { value: 'other', label: 'Other illness' },
    ],
  },
  {
    id: 'tobacco',
    chapter: 'health',
    type: 'single',
    prompt: 'Does anyone smoke or chew tobacco?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
  },
  {
    id: 'hospitalised',
    chapter: 'health',
    type: 'single',
    prompt: 'Any hospital admissions in the last 3 years?',
    help: 'Frequent admissions make a restore benefit worth having.',
    options: [
      { value: 'no', label: 'None' },
      { value: 'once', label: 'Once' },
      { value: 'multiple', label: 'More than once' },
    ],
  },
  {
    id: 'maternity',
    chapter: 'health',
    type: 'single',
    prompt: 'Planning a baby in the next 3–4 years?',
    help: 'Maternity cover has a waiting period, so it is best bought early.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'unsure', label: 'Maybe' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'income',
    chapter: 'budget',
    type: 'single',
    prompt: 'What is your annual family income?',
    help: 'Used only to suggest a sensible cover amount.',
    options: [
      { value: 'lt5', label: 'Below ₹5 lakh' },
      { value: '5to10', label: '₹5 – 10 lakh' },
      { value: '10to25', label: '₹10 – 25 lakh' },
      { value: '25to50', label: '₹25 – 50 lakh' },
      { value: 'gt50', label: 'Above ₹50 lakh' },
    ],
  },
  {
    id: 'budget',
    chapter: 'budget',
    type: 'single',
    prompt: 'How much would you like to spend each month?',
    options: [
      { value: '1000', label: 'Up to ₹1,000' },
      { value: '2000', label: '₹1,000 – 2,000' },
      { value: '4000', label: '₹2,000 – 4,000' },
      { value: '8000', label: '₹4,000 – 8,000' },
      { value: '15000', label: 'Above ₹8,000' },
    ],
  },
  {
    id: 'employerCover',
    chapter: 'budget',
    type: 'single',
    prompt: 'Do you have health cover from your employer?',
    help: 'Office cover ends when you change jobs, so we count only part of it.',
    options: [
      { value: '0', label: 'No' },
      { value: '3', label: 'Yes, up to ₹5 lakh' },
      { value: '7', label: 'Yes, ₹5 – 10 lakh' },
      { value: '12', label: 'Yes, above ₹10 lakh' },
    ],
  },
  {
    id: 'room',
    chapter: 'preferences',
    type: 'single',
    prompt: 'Which hospital room would you prefer?',
    help: 'Room-rent limits can cut the payout on your whole bill.',
    options: [
      { value: 'any', label: 'Any room, no limit', note: 'Includes suites and deluxe rooms' },
      { value: 'single', label: 'Single private room' },
      { value: 'shared', label: 'Shared room is fine' },
    ],
  },
  {
    id: 'copay',
    chapter: 'preferences',
    type: 'single',
    prompt: 'Would you pay a small share of each claim for a lower premium?',
    options: [
      { value: 'never', label: 'No, insurer should pay in full' },
      { value: 'acceptable', label: 'Yes, a small co-pay is okay' },
    ],
  },
  {
    id: 'opd',
    chapter: 'preferences',
    type: 'single',
    prompt: 'Do you want doctor consultations (OPD) covered?',
    options: [
      { value: 'essential', label: 'Must have' },
      { value: 'nice', label: 'Good to have' },
      { value: 'no', label: 'Not needed' },
    ],
  },
  {
    id: 'priority',
    chapter: 'preferences',
    type: 'single',
    prompt: 'What matters most to you?',
    options: [
      { value: 'premium', label: 'Lowest premium' },
      { value: 'coverage', label: 'Widest coverage' },
      { value: 'claims', label: 'Fast, reliable claims' },
      { value: 'network', label: 'Most cashless hospitals' },
    ],
  },
];

export function cityTier(value) {
  return CITIES.find((c) => c.value === value)?.tier;
}
