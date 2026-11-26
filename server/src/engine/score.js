// Recommendation engine: turns wizard answers into a household profile,
// a suggested sum insured, an estimated premium per plan, and a weighted
// match score with plain-language reasons and caveats.

const SI_STEPS = [5, 7, 10, 15, 20, 25, 50, 100]; // lakh
const GST = 0.18;

const ZONE_FACTOR = { metro: 1, tier1: 0.9, tier2: 0.8 };
const INCOME_SI_CAP = { lt5: 10, '5to10': 20, '10to25': 50, '25to50': 100, gt50: 100 };

const CONDITION_LABEL = {
  diabetes: 'diabetes',
  hypertension: 'blood pressure',
  thyroid: 'thyroid disorder',
  asthma: 'respiratory illness',
  cardiac: 'heart ailment',
  other: 'a long-standing condition',
};

const rupees = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

export function buildProfile(answers) {
  const m = answers.members || {};
  const adults = 1 + (m.spouse ? 1 : 0) + Number(m.parents || 0);
  const children = Number(m.children || 0);
  const conditions = (answers.conditions || []).filter((c) => c !== 'none');

  return {
    adults,
    children,
    lives: adults + children,
    eldestAge: Number(answers.eldestAge),
    cityTier: answers.cityTier,
    conditions,
    tobacco: answers.tobacco === 'yes',
    hospitalised: answers.hospitalised,
    maternity: answers.maternity,
    income: answers.income,
    budgetMonthly: Number(answers.budget),
    employerCover: Number(answers.employerCover || 0),
    room: answers.room,
    copay: answers.copay,
    opd: answers.opd,
    priority: answers.priority,
  };
}

export function recommendSumInsured(p) {
  const base = { metro: 10, tier1: 7, tier2: 5 }[p.cityTier] ?? 7;
  let si = base * (1 + 0.4 * (p.adults - 1) + 0.15 * p.children);
  if (p.eldestAge >= 45) si += 5;
  if (p.eldestAge >= 60) si += 5;
  if (p.conditions.length) si += 5;
  if (p.hospitalised === 'multiple') si += 5;
  // Employer cover is not portable; we credit half of it.
  si -= p.employerCover * 0.5;

  const cap = INCOME_SI_CAP[p.income] ?? 100;
  si = clamp(si, 5, cap);
  const step = SI_STEPS.find((s) => s >= si) ?? SI_STEPS[SI_STEPS.length - 1];

  const reasons = [
    `${p.cityTier === 'metro' ? 'Metropolitan' : p.cityTier === 'tier1' ? 'Large-city' : 'Smaller-city'} hospital costs set a base of ₹${base} lakh.`,
  ];
  if (p.lives > 1) reasons.push(`Raised for ${p.lives} people sharing one floater.`);
  if (p.eldestAge >= 45) reasons.push(`Raised because the eldest member is ${p.eldestAge}.`);
  if (p.conditions.length) reasons.push('Raised to allow for pre-existing conditions.');
  if (p.employerCover) reasons.push(`Reduced slightly to credit existing employer cover.`);
  return { sumInsured: step, reasons };
}

function ageFactor(age) {
  if (age <= 25) return 0.85;
  if (age <= 35) return 1;
  if (age <= 45) return 1.35;
  if (age <= 55) return 2.0;
  if (age <= 60) return 2.7;
  if (age <= 65) return 3.3;
  if (age <= 70) return 3.9;
  return 4.6;
}

export function pickSumInsured(plan, target) {
  return plan.sumInsuredOptions.find((s) => s >= target) ?? Math.max(...plan.sumInsuredOptions);
}

export function estimatePremium(plan, p, sumInsured) {
  const family = 1 + 0.45 * (p.adults - 1) + 0.22 * p.children;
  const si = Math.pow(sumInsured / 5, 0.55);
  const zone = ZONE_FACTOR[p.cityTier] ?? 1;
  const tobacco = p.tobacco ? 1.1 : 1;
  const ped = 1 + 0.07 * p.conditions.length;
  const copayDiscount = copayApplies(plan, p) ? 1 - plan.copayPct / 100 : 1;
  const annual = plan.baseRate * ageFactor(p.eldestAge) * family * si * zone * tobacco * ped * copayDiscount * (1 + GST);
  return { annual: Math.round(annual), monthly: Math.round(annual / 12) };
}

function copayApplies(plan, p) {
  return plan.copayPct > 0 && p.eldestAge >= (plan.copayFromAge || 0);
}

export function checkEligibility(plan, p) {
  const reasons = [];
  if (p.eldestAge > plan.maxEntryAge) reasons.push(`Entry closes at age ${plan.maxEntryAge}.`);
  if (plan.category === 'senior' && p.eldestAge < 55) reasons.push('Written for households whose eldest member is 55 or older.');
  if (p.lives > 1 && !plan.floater) reasons.push('Offered to individuals only, not as a family floater.');
  const declined = p.conditions.filter((c) => plan.declines.includes(c));
  if (declined.length) reasons.push(`Does not underwrite ${declined.map((c) => CONDITION_LABEL[c]).join(' or ')}.`);
  return reasons;
}

// Each dimension returns 0..1.
const dims = {
  affordability(plan, p, premium) {
    const ratio = premium.monthly / p.budgetMonthly;
    return ratio <= 1 ? 1 - 0.35 * ratio : clamp(0.5 - (ratio - 1) * 1.2);
  },
  coverage(plan) {
    let s = 0;
    s += { 'no-limit': 0.25, 'single-private': 0.18, shared: 0.08, '1pct': 0.04 }[plan.roomRent];
    s += plan.copayPct === 0 ? 0.15 : 0.15 * (1 - plan.copayPct / 30);
    s += { unlimited: 0.15, once: 0.09, none: 0 }[plan.restore];
    s += 0.12 * clamp(plan.ncb.max / 100);
    s += plan.consumables ? 0.1 : 0;
    s += 0.13 * clamp(((plan.preHospDays || 30) + (plan.postHospDays || 60)) / 270);
    s += plan.healthCheckup ? 0.05 : 0;
    s += plan.ayush ? 0.05 : 0;
    return clamp(s);
  },
  claims(plan) {
    const csr = clamp((plan.claimSettlementRatio - 85) / 15);
    const tat = clamp(1 - (plan.claimTatDays - 3) / 25);
    return 0.65 * csr + 0.35 * tat;
  },
  network(plan) {
    return clamp(plan.networkHospitals / 14000);
  },
  conditions(plan) {
    const wait = { 1: 0.85, 2: 0.65, 3: 0.4, 4: 0.2 }[plan.pedWaitingYears] ?? 0.2;
    return clamp(wait + (plan.pedReductionRider ? 0.15 : 0));
  },
  maternity(plan) {
    if (!plan.maternity?.covered) return 0;
    return clamp(1 - (plan.maternity.waitingYears - 1) * 0.25);
  },
  room(plan, p) {
    const table = {
      any: { 'no-limit': 1, 'single-private': 0.45, shared: 0.15, '1pct': 0.1 },
      single: { 'no-limit': 1, 'single-private': 1, shared: 0.35, '1pct': 0.3 },
      shared: { 'no-limit': 1, 'single-private': 1, shared: 0.9, '1pct': 0.6 },
    };
    return table[p.room]?.[plan.roomRent] ?? 0.5;
  },
  copay(plan, p) {
    if (!copayApplies(plan, p)) return 1;
    return p.copay === 'never' ? 0 : 0.7;
  },
  opd(plan) {
    return plan.opd?.covered ? 1 : 0;
  },
  restore(plan) {
    return { unlimited: 1, once: 0.6, none: 0 }[plan.restore];
  },
};

export function weightsFor(p) {
  const w = {
    affordability: 0.22,
    coverage: 0.2,
    claims: 0.17,
    network: 0.1,
    room: 0.07,
    copay: 0.06,
  };
  if (p.conditions.length) w.conditions = 0.16;
  if (p.maternity === 'yes') w.maternity = 0.12;
  if (p.maternity === 'unsure') w.maternity = 0.05;
  if (p.opd === 'essential') w.opd = 0.09;
  if (p.opd === 'nice') w.opd = 0.03;
  if (p.hospitalised !== 'no') w.restore = p.hospitalised === 'multiple' ? 0.08 : 0.04;
  if (p.copay === 'never') w.copay = 0.1;

  const bump = { premium: 'affordability', coverage: 'coverage', claims: 'claims', network: 'network' }[p.priority];
  if (bump) w[bump] *= 1.9;

  const total = Object.values(w).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(w)) w[k] /= total;
  return w;
}

function explain(plan, p, premium, scores) {
  const reasons = [];
  const caveats = [];

  if (premium.monthly <= p.budgetMonthly) reasons.push(`Sits within your budget at about ${rupees(premium.monthly)} a month.`);
  else caveats.push(`Exceeds your stated budget by about ${rupees(premium.monthly - p.budgetMonthly)} a month.`);

  if (plan.roomRent === 'no-limit') reasons.push('No limit on room rent; any room may be chosen.');
  else if (plan.roomRent === '1pct') caveats.push('Room rent capped at 1% of the sum insured per day; the whole bill is pro-rated above it.');
  else if (plan.roomRent === 'shared') caveats.push('Covers a shared room only.');

  if (plan.claimSettlementRatio >= 97) reasons.push(`Settles ${plan.claimSettlementRatio}% of claims, among the best on our register.`);
  if (plan.networkHospitals >= 11000) reasons.push(`Cashless at ${plan.networkHospitals.toLocaleString('en-IN')} hospitals.`);

  if (p.conditions.length) {
    const named = p.conditions.map((c) => CONDITION_LABEL[c]).join(', ');
    if (plan.pedWaitingYears <= 1) reasons.push(`Pre-existing ${named} covered after just ${plan.pedWaitingYears} year.`);
    else caveats.push(`Pre-existing ${named} covered only after ${plan.pedWaitingYears} years${plan.pedReductionRider ? ' (a rider can shorten this)' : ''}.`);
  }

  if (copayApplies(plan, p)) caveats.push(`You would bear ${plan.copayPct}% of every claim.`);
  if (p.maternity !== 'no') {
    if (plan.maternity?.covered) reasons.push(`Maternity cover up to ${rupees(plan.maternity.limit)} after ${plan.maternity.waitingYears} years.`);
    else if (p.maternity === 'yes') caveats.push('Does not cover maternity.');
  }
  if (p.opd !== 'no') {
    if (plan.opd?.covered) reasons.push(`Outpatient consultations covered up to ${rupees(plan.opd.limit)} a year.`);
    else if (p.opd === 'essential') caveats.push('No outpatient cover.');
  }
  if (plan.restore === 'unlimited' && p.hospitalised !== 'no') reasons.push('Sum insured restores in full, without limit, after a claim.');

  return { reasons: reasons.slice(0, 4), caveats: caveats.slice(0, 3) };
}

export function recommend(plans, answers) {
  const profile = buildProfile(answers);
  const si = recommendSumInsured(profile);
  profile.recommendedSumInsured = si.sumInsured;
  profile.sumInsuredReasons = si.reasons;
  const weights = weightsFor(profile);

  const results = [];
  const declined = [];

  for (const plan of plans) {
    const ineligible = checkEligibility(plan, profile);
    if (ineligible.length) {
      declined.push({ slug: plan.slug, insurer: plan.insurer, name: plan.name, reasons: ineligible });
      continue;
    }
    const sumInsured = pickSumInsured(plan, si.sumInsured);
    const premium = estimatePremium(plan, profile, sumInsured);
    const scores = {};
    let total = 0;
    for (const [dim, weight] of Object.entries(weights)) {
      scores[dim] = dims[dim](plan, profile, premium);
      total += scores[dim] * weight;
    }
    const { reasons, caveats } = explain(plan, profile, premium, scores);
    results.push({
      slug: plan.slug,
      insurer: plan.insurer,
      name: plan.name,
      category: plan.category,
      sumInsured,
      premium,
      match: Math.round(total * 100),
      scores,
      reasons,
      caveats,
    });
  }

  results.sort((a, b) => b.match - a.match || a.premium.annual - b.premium.annual);
  results.forEach((r, i) => (r.rank = i + 1));

  return { profile, weights, results, declined };
}
