// Server entry point: connect to MongoDB, seed the catalogue, start the API.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb, seedCatalogue } from './db.js';
import { api } from './routes.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use('/api', api);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

try {
  await connectDb();
  await seedCatalogue();
} catch (err) {
  console.error('[db] Could not connect to MongoDB:', err.message);
  console.error('[db] Check MONGODB_URI in server/.env and that your IP is allowed in Atlas → Network Access.');
  process.exit(1);
}

const port = process.env.PORT || 5050;
app.listen(port, () => console.log(`[api] running on http://localhost:${port}`));
