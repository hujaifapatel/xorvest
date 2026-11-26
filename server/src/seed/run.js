import 'dotenv/config';
import { connectDb, disconnectDb } from '../db.js';
import { seedCatalogue } from './seed.js';

await connectDb();
await seedCatalogue({ force: true });
await disconnectDb();
