import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';
import { seedPlans } from './seed/seed.js';
import { api } from './routes.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '50kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api', api);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

const port = Number(process.env.PORT) || 5050;

await connectDb();
await seedPlans();
app.listen(port, () => console.log(`[api] listening on http://localhost:${port}`));
