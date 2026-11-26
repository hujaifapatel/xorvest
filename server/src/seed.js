// `npm run seed`: wipe and reload banks + plans from data.js.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb, seedCatalogue } from './db.js';

await connectDb();
await seedCatalogue(true);
await mongoose.disconnect();
