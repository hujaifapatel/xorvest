import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommend, recommendCover, buildProfile } from './engine.js';
import { validateAnswers } from './questions.js';
import { validateRegistration } from './auth.js';
import { BANKS, PLANS } from './data.js';

// Plans with their bank merged in, like withBank() does after a database read.
const plans = PLANS.map((p) => {
  const b = BANKS.find((x) => x.slug === p.bank);
  return { ...p, bankName: b.name, bankShort: b.shortName, claimSettlementRatio: b.claimSettlementRatio, claimTatDays: b.claimTatDays, networkHospitals: b.networkHospitals };
});

const family = {
  gender: 'male', occupation: 'salaried', members: { self: true, spouse: true, son: 1 }, sameCity: 'yes',
  ages: { self: 34, spouse: 31 }, medicalCheck: 'normal', city: 'mumbai', hospitalPref: 'any',
  conditions: ['none'], familyHistory: 'no', tobacco: 'no', alcohol: 'no', hospitalised: 'no', plannedTreatment: 'no',
  income: '10to25', earners: 'two', budget: '2000', payFrequency: 'monthly', employerCover: '0', priorPolicy: 'never',
  room: 'single', homeCare: 'no', copay: 'never', deductible: 'no', opd: 'no', healthCheckup: 'yes',
  priority: 'coverage', secondPriority: 'premium',
};

test('valid answers pass; missing adults or ages fail', () => {
  assert.deepEqual(validateAnswers(family), []);
  assert.ok(validateAnswers({ ...family, members: { son: 2 } }).some((e) => e.includes('adult')));
  assert.ok(validateAnswers({ ...family, members: { ...family.members, father: true } }).some((e) => e.includes('father')));
});

test('follow-up depends on the answer and is required', () => {
  assert.ok(validateAnswers({ ...family, tobacco: 'yes' }).some((e) => e.includes('How often')));
  assert.deepEqual(validateAnswers({ ...family, tobacco: 'yes', tobaccoFrequency: 'daily' }), []);
  assert.ok(validateAnswers({ ...family, conditions: ['diabetes'] }).some((e) => e.includes('diagnosed')));
});

test('daily tobacco costs more than none', () => {
  const price = (a) => recommend(plans, a).results.find((r) => r.slug === 'hdfc-optimum-family').premium.monthly;
  assert.ok(price({ ...family, tobacco: 'yes', tobaccoFrequency: 'daily' }) > price(family));
});

test('profile uses the eldest adult and the city tier', () => {
  const p = buildProfile({ ...family, members: { ...family.members, mother: true }, ages: { ...family.ages, mother: 61 } });
  assert.equal(p.eldestAge, 61);
  assert.equal(p.cityTier, 'metro');
});

test('young family: plans ranked, check-up wish reflected in reasons', () => {
  const { results } = recommend(plans, family);
  assert.ok(results.length > 8);
  assert.ok(results[0].match >= results.at(-1).match);
  assert.ok(results.slice(0, 3).some((r) => r.reasons.some((x) => x.includes('health check-up'))));
});

test('ineligible plans are declined with a reason', () => {
  const seniors = recommend(plans, { ...family, members: { self: true, spouse: true }, ages: { self: 72, spouse: 70 } });
  assert.ok(seniors.declined.some((d) => d.slug === 'kotak-young-star'));
  const heart = recommend(plans, { ...family, conditions: ['cardiac'] });
  assert.ok(heart.declined.some((d) => d.slug === 'yes-health-basic'));
});

test('cover grows with family size and is capped by income', () => {
  const big = { ...family, members: { self: true, spouse: true, son: 1, daughter: 1, father: true, mother: true }, ages: { self: 40, spouse: 38, father: 66, mother: 62 } };
  assert.ok(recommendCover(buildProfile(big)).sumInsured > recommendCover(buildProfile({ ...big, income: 'lt5' })).sumInsured);
});

test('registration validation', () => {
  assert.deepEqual(validateRegistration({ name: 'Asha Rao', email: 'asha@example.com', mobile: '9876543210', password: 'longenough' }), {});
  assert.equal(Object.keys(validateRegistration({ name: 'A', email: 'bad', mobile: '1', password: 'x' })).length, 4);
});
