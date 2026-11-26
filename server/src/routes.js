// Every API endpoint the website calls. All paths start with /api.
import { Router } from 'express';
import { Bank, Plan, Assessment, Interest, withBank } from './models.js';
import { QUESTIONS, validateAnswers } from './questions.js';
import { recommend } from './engine.js';
import { register, login, me, requireAuth } from './auth.js';

export const api = Router();

// Lets each handler be async: any thrown error goes to the error handler in index.js.
const route = (fn) => (req, res, next) => fn(req, res).catch(next);
const loadPlans = async (filter = {}) => (await Plan.find(filter).populate('bank').lean()).map(withBank);

/* ── Accounts ── */
api.post('/auth/register', route(register));
api.post('/auth/login', route(login));
api.get('/auth/me', requireAuth, route(me));

/* ── Catalogue (public) ── */
api.get('/questions', (req, res) => res.json(QUESTIONS));

api.get('/banks', route(async (req, res) => {
  const [banks, plans] = await Promise.all([Bank.find().sort({ name: 1 }).lean(), Plan.find({}, { bank: 1 }).lean()]);
  res.json(banks.map((b) => ({ ...b, plans: plans.filter((p) => String(p.bank) === String(b._id)).length })));
}));

api.get('/plans', route(async (req, res) => {
  const filter = req.query.slugs ? { slug: { $in: req.query.slugs.split(',') } } : {};
  res.json(await loadPlans(filter));
}));

/* ── Recommendations (logged-in users) ── */
api.post('/assessments', requireAuth, route(async (req, res) => {
  const answers = req.body.answers;
  const errors = validateAnswers(answers);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const { profile, results, declined } = recommend(await loadPlans(), answers);
  const doc = await Assessment.create({ user: req.userId, answers, profile, results, declined });
  res.status(201).json({ id: doc._id });
}));

api.get('/assessments', requireAuth, route(async (req, res) => {
  const docs = await Assessment.find({ user: req.userId }).sort({ createdAt: -1 }).limit(20).lean();
  res.json(docs.map((d) => ({ id: d._id, createdAt: d.createdAt, profile: d.profile, top: d.results[0] })));
}));

api.get('/assessments/:id', requireAuth, route(async (req, res) => {
  const doc = await Assessment.findOne({ _id: req.params.id, user: req.userId }).lean().catch(() => null);
  if (!doc) return res.status(404).json({ error: 'Recommendation not found.' });
  res.json({ id: doc._id, ...doc });
}));

/* ── Interested bucket (logged-in users) ── */
const listInterests = async (userId) => {
  const rows = await Interest.find({ user: userId }).sort({ createdAt: -1 }).populate({ path: 'plan', populate: 'bank' }).lean();
  return rows.filter((r) => r.plan).map((r) => ({ ...r, plan: withBank(r.plan) }));
};

api.get('/interests', requireAuth, route(async (req, res) => res.json(await listInterests(req.userId))));

api.post('/interests', requireAuth, route(async (req, res) => {
  const plan = await Plan.findOne({ slug: req.body.planSlug });
  if (!plan) return res.status(404).json({ error: 'Plan not found.' });

  // Remember the price the user saw, if they came from a recommendation.
  const a = await Assessment.findOne({ _id: req.body.assessmentId, user: req.userId }).lean().catch(() => null);
  const r = a?.results.find((x) => x.slug === plan.slug);
  const seen = r ? { assessment: a._id, sumInsured: r.sumInsured, monthly: r.premium.monthly, annual: r.premium.annual, match: r.match } : {};

  await Interest.updateOne({ user: req.userId, plan: plan._id }, { $set: { user: req.userId, plan: plan._id, ...seen } }, { upsert: true });
  res.status(201).json(await listInterests(req.userId));
}));

api.delete('/interests/:slug', requireAuth, route(async (req, res) => {
  const plan = await Plan.findOne({ slug: req.params.slug });
  if (plan) await Interest.deleteOne({ user: req.userId, plan: plan._id });
  res.json(await listInterests(req.userId));
}));
