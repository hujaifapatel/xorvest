import dns from 'node:dns';
import mongoose from 'mongoose';
import { Bank, Plan } from './models.js';
import { BANKS, PLANS } from './data.js';

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing in server/.env');
  try {
    await mongoose.connect(uri);
  } catch (err) {
    // Some Windows networks refuse Node's lookup of Atlas addresses; retry via public DNS.
    if (err.syscall !== 'querySrv') throw err;
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    await mongoose.connect(uri);
  }
  console.log('[db] connected to MongoDB');
}

// Fill the banks and plans collections from data.js when they are empty or out of date.
export async function seedCatalogue(force = false) {
  const upToDate = (await Bank.countDocuments()) === BANKS.length && (await Plan.countDocuments()) === PLANS.length;
  if (upToDate && !force) return;

  await Promise.all([Bank.deleteMany(), Plan.deleteMany()]);
  const banks = await Bank.insertMany(BANKS);
  const idOf = Object.fromEntries(banks.map((b) => [b.slug, b._id]));
  await Plan.insertMany(PLANS.map((p) => ({ ...p, bank: idOf[p.bank] })));
  console.log(`[db] seeded ${banks.length} banks and ${PLANS.length} plans`);
}
