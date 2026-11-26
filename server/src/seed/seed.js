import { Bank } from '../models/Bank.js';
import { Plan } from '../models/Plan.js';
import { BANKS } from './banks.js';
import { PLANS } from './plans.js';

// Seeds banks and plans. Re-seeds automatically when the stored catalogue is
// out of date (e.g. plans from before banks existed).
export async function seedCatalogue({ force = false } = {}) {
  const [bankCount, planCount, legacy] = await Promise.all([
    Bank.countDocuments(),
    Plan.countDocuments(),
    Plan.countDocuments({ bank: { $exists: false } }),
  ]);
  const stale = bankCount !== BANKS.length || planCount !== PLANS.length || legacy > 0;
  if (!force && !stale) return;

  // Legacy documents may lack the bank field; drop them before re-validating.
  await Plan.collection.deleteMany({});
  await Bank.deleteMany({});

  const banks = await Bank.insertMany(BANKS);
  const idBySlug = Object.fromEntries(banks.map((b) => [b.slug, b._id]));
  await Plan.insertMany(PLANS.map((p) => ({ ...p, bank: idBySlug[p.bank] })));
  console.log(`[seed] inserted ${banks.length} banks and ${PLANS.length} plans`);
}
