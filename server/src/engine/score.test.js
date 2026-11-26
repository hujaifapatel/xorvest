import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommend, recommendSumInsured, buildProfile } from './score.js';
import { PLANS } from '../seed/plans.js';
import { BANKS } from '../seed/banks.js';
import { validateAnswers } from '../routes.js';
import { validateRegistration } from '../auth.js';

const base = {
  gender: 'male',
  members: { self: true, spouse: true, son: 1, daughter: 0, father: false, mother: false },
  ages: { self: 34, spouse: 31 },
  city: 'mumbai',
  conditions: ['none'],
  tobacco: 'no',
  hospitalised: 'no',
  maternity: 'yes',
  income: '10to25',
  budget: '2000',
  employerCover: '0',
  room: 'single',
  copay: 'never',
  opd: 'nice',
  priority: 'coverage',
};

// Mirror flattenPlan() without a database.
const plans = PLANS.map((p) => {
  const b = BANKS.find((x) => x.slug === p.bank);
  return {
    restore: 'none', ncb: { perYear: 0, max: 0 }, ...p,
    insurer: b.name, bankShort: b.shortName, monogram: b.monogram, tint: b.tint,
    claimSettlementRatio: b.claimSettlementRatio, claimTatDays: b.claimTatDays, networkHospitals: b.networkHospitals,
  };
});

test('every plan belongs to a known bank', () => {
  for (const p of PLANS) assert.ok(BANKS.some((b) => b.slug === p.bank), p.slug);
});

test('valid answers pass validation', () => {
  assert.deepEqual(validateAnswers(base), []);
});

test('missing adult ages are rejected', () => {
  const errs = validateAnswers({ ...base, members: { ...base.members, father: true } });
  assert.ok(errs.some((e) => e.includes('father')));
});

test('children only is rejected', () => {
  const errs = validateAnswers({ ...base, members: { son: 2 } });
  assert.ok(errs.some((e) => e.includes('adult')));
});

test('eldest age is taken across adult members', () => {
  const p = buildProfile({ ...base, members: { ...base.members, mother: true }, ages: { ...base.ages, mother: 61 } });
  assert.equal(p.eldestAge, 61);
  assert.equal(p.adults, 3);
  assert.equal(p.cityTier, 'metro');
});

test('young family is ranked with bank details and maternity plans float up', () => {
  const { results } = recommend(plans, base);
  assert.ok(results.length > 8);
  assert.ok(results[0].insurer && results[0].monogram);
  assert.ok(results.slice(0, 3).some((r) => r.reasons.some((x) => x.startsWith('Maternity'))));
});

test('seniors are steered away from plans with low entry ages', () => {
  const { declined } = recommend(plans, { ...base, members: { self: true, spouse: true }, ages: { self: 72, spouse: 70 } });
  assert.ok(declined.some((d) => d.slug === 'kotak-young-star'));
  assert.ok(declined.some((d) => d.slug === 'hdfc-optimum-family'));
});

test('cardiac condition excludes plans that decline it', () => {
  const { declined } = recommend(plans, { ...base, conditions: ['cardiac'] });
  assert.ok(declined.some((d) => d.slug === 'yes-health-basic'));
});

test('sum insured scales with household and is capped by income', () => {
  const fam = { ...base, members: { self: true, spouse: true, son: 1, daughter: 1, father: true, mother: true }, ages: { self: 40, spouse: 38, father: 66, mother: 62 } };
  const big = recommendSumInsured(buildProfile(fam));
  const small = recommendSumInsured(buildProfile({ ...fam, income: 'lt5' }));
  assert.ok(big.sumInsured > small.sumInsured);
  assert.ok(small.sumInsured <= 10);
});

test('registration validation', () => {
  assert.deepEqual(validateRegistration({ name: 'Asha Rao', email: 'asha@example.com', mobile: '9876543210', password: 'longenough' }), {});
  const e = validateRegistration({ name: 'A', email: 'bad', mobile: '12345', password: 'short' });
  assert.deepEqual(Object.keys(e).sort(), ['email', 'mobile', 'name', 'password']);
});
