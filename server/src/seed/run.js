import 'dotenv/config';
import { connectDb, disconnectDb } from '../db.js';
import { seedPlans } from './seed.js';

await connectDb();
await seedPlans({ force: true });
await disconnectDb();
