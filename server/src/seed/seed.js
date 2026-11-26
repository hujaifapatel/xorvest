import { Plan } from '../models/Plan.js';
import { PLANS } from './plans.js';

export async function seedPlans({ force = false } = {}) {
  const count = await Plan.countDocuments();
  if (count && !force) return count;
  await Plan.deleteMany({});
  await Plan.insertMany(PLANS);
  console.log(`[seed] inserted ${PLANS.length} plans`);
  return PLANS.length;
}
