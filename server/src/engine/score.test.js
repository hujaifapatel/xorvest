import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommend, recommendSumInsured, buildProfile } from './score.js';
import { PLANS } from '../seed/plans.js';
import { validateAnswers } from '../routes.js';

const base = {
  members: { self: true, spouse: true, children: 1, parents: 0 },
  eldestAge: 34,
  cityTier: 'metro',
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

const plans = PLANS.map((p) => ({ floater: true, copayPct: 0, declines: [], restore: 'none', ncb: { perYear: 0, max: 0 }, ...p }));

test('valid answers pass validation', () => {
  assert.deepEqual(validateAnswers(base), []);
});

test('young family is ranked and maternity plans float up', () => {
  const { results, declined } = recommend(plans, base);
  assert.ok(results.length > 8);
  assert.ok(results[0].match >= results.at(-1).match);
  assert.ok(results.slice(0, 3).some((r) => r.reasons.some((x) => x.startsWith('Maternity'))));
  assert.ok(!declined.some((d) => d.slug === 'kensal-young'));
});

test('seniors are steered away from plans with low entry ages', () => {
  const { declined } = recommend(plans, { ...base, eldestAge: 72, members: { self: true, spouse: true, children: 0, parents: 0 } });
  assert.ok(declined.some((d) => d.slug === 'kensal-young'));
  assert.ok(declined.some((d) => d.slug === 'aldermoor-sovereign'));
});

test('cardiac condition excludes plans that decline it', () => {
  const { declined } = recommend(plans, { ...base, conditions: ['cardiac'] });
  assert.ok(declined.some((d) => d.slug === 'dunmore-essential'));
});

test('sum insured scales with household and is capped by income', () => {
  const big = recommendSumInsured(buildProfile({ ...base, members: { spouse: true, children: 2, parents: 2 }, eldestAge: 62 }));
  const small = recommendSumInsured(buildProfile({ ...base, income: 'lt5', members: { spouse: true, children: 2, parents: 2 }, eldestAge: 62 }));
  assert.ok(big.sumInsured > small.sumInsured);
  assert.ok(small.sumInsured <= 10);
});
