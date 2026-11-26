// Recommendation engine: answers → profile → cover → eligible plans → price → match score.
// Follow-up answers used here: tobaccoFrequency, secondPriority, healthCheckup,
// hospitalPref, copayShare, plannedTreatment. The others are stored for reference.
import { ADULTS, cityTier } from './questions.js';

const COVER_BANDS = [5, 7, 10, 15, 20, 25, 50, 100]; // lakh
const INCOME_CAP = { lt5: 10, '5to10': 20, '10to25': 50, '25to50': 100, gt50: 100 };
const ILLNESS = { diabetes: 'diabetes', hypertension: 'blood pressure', thyroid: 'thyroid', asthma: 'asthma', cardiac: 'heart disease', other: 'existing illness' };
const ROOM_FIT = {
  any: { 'no-limit': 1, 'single-private': 0.45, shared: 0.15, '1pct': 0.1 },
  single: { 'no-limit': 1, 'single-private': 1, shared: 0.35, '1pct': 0.3 },
  shared: { 'no-limit': 1, 'single-private': 1, shared: 0.9, '1pct': 0.6 },
};
const rupees = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const clamp = (n) => Math.max(0, Math.min(1, n));
const copayApplies = (plan, p) => plan.copayPct > 0 && p.eldestAge >= plan.copayFromAge;

// 1. Turn raw answers into the facts the engine needs.
export function buildProfile(a) {
  const m = a.members || {};
  const adults = ADULTS.filter((k) => m[k]);
  const children = +(m.son || 0) + +(m.daughter || 0);
  return {
    adults: adults.length,
    children,
    lives: adults.length + children,
    eldestAge: Math.max(...adults.map((k) => +a.ages[k])),
    cityTier: cityTier(a.city),
    conditions: (a.conditions || []).filter((c) => c !== 'none'),
    tobacco: a.tobacco === 'yes' ? a.tobaccoFrequency : null, // daily | occasional | quit
    hospitalised: a.hospitalised,
    plannedTreatment: a.plannedTreatment === 'yes',
    income: a.income,
    budgetMonthly: +a.budget,
    employerCover: +a.employerCover || 0,
    room: a.room,
    copay: a.copay,
    copayShare: +a.copayShare || 0,
    opd: a.opd,
    wantsCheckup: a.healthCheckup === 'yes',
    hospitalPref: a.hospitalPref,
    priority: a.priority,
    secondPriority: a.secondPriority,
  };
}

// 2. How much cover (sum insured) the family should buy, with the reasons.
export function recommendCover(p) {
  const base = { metro: 10, tier1: 7, tier2: 5 }[p.cityTier];
  const reasons = [`Hospital costs in your city start us at ₹${base} lakh.`];
  let si = base * (1 + 0.4 * (p.adults - 1) + 0.15 * p.children);
  if (p.lives > 1) reasons.push(`Increased for ${p.lives} members sharing one floater.`);
  if (p.eldestAge >= 45) {
    si += p.eldestAge >= 60 ? 10 : 5;
    reasons.push(`Increased because the eldest member is ${p.eldestAge}.`);
  }
  if (p.conditions.length) {
    si += 5;
    reasons.push('Increased to allow for existing illnesses.');
  }
  if (p.hospitalised === 'multiple') si += 5;
  if (p.employerCover) {
    si -= p.employerCover / 2; // office cover ends when you change jobs, so count half
    reasons.push('Reduced slightly for your employer cover.');
  }
  si = Math.min(Math.max(si, 5), INCOME_CAP[p.income]);
  const sumInsured = COVER_BANDS.reduce((best, b) => (Math.abs(b - si) <= Math.abs(best - si) ? b : best));
  return { sumInsured, reasons };
}

// 3. Reasons a plan cannot be bought by this family (empty = eligible).
function whyIneligible(plan, p) {
  const out = [];
  if (p.eldestAge > plan.maxEntryAge) out.push(`Entry closes at age ${plan.maxEntryAge}.`);
  if (plan.category === 'senior' && p.eldestAge < 55) out.push('Only for families whose eldest member is 55+.');
  if (p.lives > 1 && !plan.floater) out.push('Covers one person only, not a family.');
  const refused = p.conditions.filter((c) => plan.declines?.includes(c));
  if (refused.length) out.push(`Does not cover ${refused.map((c) => ILLNESS[c]).join(' or ')}.`);
  return out;
}

// 4. Estimated premium incl. 18% GST.
function estimatePremium(plan, p, cover) {
  const age = [[25, 0.85], [35, 1], [45, 1.35], [55, 2], [60, 2.7], [65, 3.3], [70, 3.9]].find(([max]) => p.eldestAge <= max)?.[1] ?? 4.6;
  const family = 1 + 0.35 * (p.adults - 1) + 0.15 * p.children;
  const size = (cover / 5) ** 0.45;
  const city = { metro: 1, tier1: 0.9, tier2: 0.8 }[p.cityTier];
  const loading = ({ daily: 1.15, occasional: 1.1, quit: 1.05 }[p.tobacco] || 1) * (1 + 0.07 * p.conditions.length) * (copayApplies(plan, p) ? 1 - plan.copayPct / 100 : 1);
  const annual = Math.round(plan.baseRate * age * family * size * city * loading * 1.18);
  return { annual, monthly: Math.round(annual / 12) };
}

// 5. Match score 0–100: each factor is scored 0–1 and weighted by what the user cares about.
function matchScore(plan, p, price) {
  const ratio = price.monthly / p.budgetMonthly;
  const s = {
    price: ratio <= 1 ? 1 - 0.35 * ratio : clamp(0.5 - (ratio - 1) * 1.2),
    coverage: clamp(
      { 'no-limit': 0.3, 'single-private': 0.22, shared: 0.1, '1pct': 0.05 }[plan.roomRent] +
      { unlimited: 0.2, once: 0.12, none: 0 }[plan.restore] +
      (plan.ncb?.max || 0) / 500 + (plan.consumables ? 0.1 : 0) + ((plan.preHospDays + plan.postHospDays) / 270) * 0.2
    ),
    claims: 0.65 * clamp((plan.claimSettlementRatio - 85) / 15) + 0.35 * clamp(1 - (plan.claimTatDays - 3) / 25),
    network: clamp(plan.networkHospitals / 14000),
    room: ROOM_FIT[p.room][plan.roomRent],
    copay: !copayApplies(plan, p) ? 1 : p.copay === 'never' ? 0 : plan.copayPct <= p.copayShare ? 0.8 : 0.3,
  };
  const w = { price: 0.22, coverage: 0.2, claims: 0.17, network: 0.1, room: 0.07, copay: p.copay === 'never' ? 0.1 : 0.06 };

  // Extra factors only when the answers make them relevant.
  if (p.conditions.length || p.plannedTreatment) {
    s.illness = clamp(1 - (plan.pedWaitingYears - 1) * 0.25 + (plan.pedReductionRider ? 0.15 : 0));
    w.illness = 0.16;
  }
  if (p.wantsCheckup) {
    s.checkup = plan.healthCheckup ? 1 : 0;
    w.checkup = 0.05;
  }
  if (p.hospitalPref === 'chain') w.network *= 1.5;
  if (p.opd !== 'no') {
    s.opd = plan.opd?.covered ? 1 : 0;
    w.opd = p.opd === 'essential' ? 0.09 : 0.03;
  }
  if (p.hospitalised !== 'no') {
    s.restore = { unlimited: 1, once: 0.6, none: 0 }[plan.restore];
    w.restore = p.hospitalised === 'multiple' ? 0.08 : 0.04;
  }
  const dim = { premium: 'price', coverage: 'coverage', claims: 'claims', network: 'network' };
  w[dim[p.priority]] *= 2; // top priority counts double
  if (p.secondPriority && p.secondPriority !== p.priority) w[dim[p.secondPriority]] *= 1.4;

  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return Math.round((100 * Object.keys(w).reduce((sum, k) => sum + s[k] * w[k], 0)) / total);
}

// 6. Plain-language reasons and drawbacks (the user's own needs first).
function explain(plan, p, price) {
  const good = [];
  const bad = [];
  const ill = p.conditions.map((c) => ILLNESS[c]).join(', ');

  if (price.monthly <= p.budgetMonthly) good.push(`Within your budget at ${rupees(price.monthly)} a month.`);
  else bad.push(`About ${rupees(price.monthly - p.budgetMonthly)} a month over your budget.`);
  if (ill) (plan.pedWaitingYears <= 2 ? good : bad).push(`Existing ${ill} covered after ${plan.pedWaitingYears} year${plan.pedWaitingYears > 1 ? 's' : ''}.`);
  if (p.plannedTreatment && plan.pedWaitingYears > 2) bad.push(`Long waiting period (${plan.pedWaitingYears} years) for your planned treatment.`);
  if (p.opd !== 'no' && plan.opd?.covered) good.push(`Doctor consultations covered up to ${rupees(plan.opd.limit)} a year.`);
  if (p.opd === 'essential' && !plan.opd?.covered) bad.push('No OPD / consultation cover.');
  if (copayApplies(plan, p)) bad.push(`You pay ${plan.copayPct}% of every claim (co-pay).`);
  if (plan.roomRent === 'no-limit') good.push('No room rent limit: choose any room.');
  if (plan.roomRent === '1pct') bad.push('Room rent capped at 1% of cover per day.');
  if (plan.roomRent === 'shared') bad.push('Covers a shared room only.');
  if (p.wantsCheckup && plan.healthCheckup) good.push('Free yearly health check-up included.');
  if (plan.restore === 'unlimited' && p.hospitalised !== 'no') good.push('Cover refills in full after every claim.');
  if (plan.claimSettlementRatio >= 97) good.push(`${plan.bankShort} settles ${plan.claimSettlementRatio}% of claims.`);
  return { reasons: good.slice(0, 4), caveats: bad.slice(0, 3) };
}

// Short feature list shown on each plan card.
function highlights(plan) {
  const room = { 'no-limit': 'No room rent limit', 'single-private': 'Single private room', shared: 'Shared room', '1pct': 'Room rent 1% of cover' };
  return [
    room[plan.roomRent],
    `Existing illness covered after ${plan.pedWaitingYears} yr${plan.pedWaitingYears > 1 ? 's' : ''}`,
    plan.restore === 'unlimited' ? 'Unlimited restore of cover' : plan.restore === 'once' ? 'Cover restored once a year' : null,
    `${plan.claimSettlementRatio}% claims settled`,
  ].filter(Boolean);
}

// Main entry: rank every plan for these answers.
export function recommend(plans, answers) {
  const profile = buildProfile(answers);
  const { sumInsured, reasons } = recommendCover(profile);
  Object.assign(profile, { recommendedSumInsured: sumInsured, sumInsuredReasons: reasons });

  const results = [];
  const declined = [];
  for (const plan of plans) {
    const why = whyIneligible(plan, profile);
    if (why.length) {
      declined.push({ slug: plan.slug, name: plan.name, bankShort: plan.bankShort, reasons: why });
      continue;
    }
    const cover = plan.sumInsuredOptions.find((s) => s >= sumInsured) ?? Math.max(...plan.sumInsuredOptions);
    const premium = estimatePremium(plan, profile, cover);
    results.push({
      slug: plan.slug,
      name: plan.name,
      insurer: plan.bankName,
      bank: plan.bank,
      bankShort: plan.bankShort,
      monogram: plan.monogram,
      tint: plan.tint,
      claimSettlementRatio: plan.claimSettlementRatio,
      sumInsured: cover,
      premium,
      match: matchScore(plan, profile, premium),
      highlights: highlights(plan),
      ...explain(plan, profile, premium),
    });
  }
  results.sort((a, b) => b.match - a.match || a.premium.monthly - b.premium.monthly);
  return { profile, results, declined };
}
