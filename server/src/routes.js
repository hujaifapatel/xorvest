import { Router } from 'express';
import mongoose from 'mongoose';
import { Plan, flattenPlan } from './models/Plan.js';
import { Bank } from './models/Bank.js';
import { Assessment } from './models/Assessment.js';
import { QUESTIONS, CHAPTERS, ADULT_MEMBERS } from './engine/questions.js';
import { recommend } from './engine/score.js';
import { authRouter, requireAuth } from './auth.js';

export const api = Router();

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

api.use('/auth', authRouter);

api.get('/questions', (req, res) => {
  res.json({ chapters: CHAPTERS, questions: QUESTIONS });
});

api.get('/banks', wrap(async (req, res) => {
  const banks = await Bank.find().sort({ name: 1 }).lean();
  const counts = await Plan.aggregate([{ $group: { _id: '$bank', plans: { $sum: 1 } } }]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.plans]));
  res.json(banks.map((b) => ({ ...b, plans: byId[String(b._id)] || 0 })));
}));

async function loadPlans(filter = {}) {
  const plans = await Plan.find(filter).populate('bank').sort({ name: 1 }).lean();
  return plans.map(flattenPlan);
}

api.get('/plans', wrap(async (req, res) => {
  const filter = {};
  if (req.query.slugs) filter.slug = { $in: String(req.query.slugs).split(',') };
  if (req.query.bank) {
    const bank = await Bank.findOne({ slug: String(req.query.bank) }).lean();
    filter.bank = bank?._id ?? null;
  }
  res.json(await loadPlans(filter));
}));

export function validateAnswers(a) {
  const errors = [];
  for (const q of QUESTIONS) {
    const v = a?.[q.id];
    if (q.type === 'members') {
      if (!v || typeof v !== 'object') { errors.push('members is required'); continue; }
      const kids = Number(v.son ?? 0) + Number(v.daughter ?? 0);
      if (!ADULT_MEMBERS.some((k) => v[k] === true)) errors.push('select at least one adult member');
      if (![v.son ?? 0, v.daughter ?? 0].every((n) => Number.isInteger(Number(n)) && n >= 0) || kids > 4) errors.push('up to 4 children');
    } else if (q.type === 'ages') {
      const members = a?.members || {};
      for (const k of ADULT_MEMBERS.filter((m) => members[m] === true)) {
        const n = Number(v?.[k]);
        if (!Number.isInteger(n) || n < q.min || n > q.max) errors.push(`age of ${k} must be ${q.min}–${q.max}`);
      }
    } else if (q.type === 'multi') {
      const allowed = q.options.map((o) => o.value);
      if (!Array.isArray(v) || !v.length || v.some((x) => !allowed.includes(x))) errors.push(`${q.id} is invalid`);
    } else if (!q.options.some((o) => o.value === v)) {
      errors.push(`${q.id} is invalid`);
    }
  }
  return errors;
}

const summary = (doc) => ({
  id: doc._id,
  createdAt: doc.createdAt,
  profile: doc.profile,
  top: doc.results.slice(0, 3).map((r) => ({ name: r.name, insurer: r.insurer, match: r.match, monthly: r.premium.monthly })),
});

api.post('/assessments', requireAuth, wrap(async (req, res) => {
  const answers = req.body?.answers;
  const errors = validateAnswers(answers);
  if (errors.length) return res.status(400).json({ errors });

  const plans = await loadPlans();
  const { profile, results, declined } = recommend(plans, answers);
  const doc = await Assessment.create({ user: req.userId, answers, profile, results, declined });
  res.status(201).json({ id: doc._id, profile, results, declined });
}));

api.get('/assessments', requireAuth, wrap(async (req, res) => {
  const docs = await Assessment.find({ user: req.userId }).sort({ createdAt: -1 }).limit(20).lean();
  res.json(docs.map(summary));
}));

api.get('/assessments/:id', requireAuth, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const doc = await Assessment.findOne({ _id: req.params.id, user: req.userId }).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ id: doc._id, createdAt: doc.createdAt, profile: doc.profile, results: doc.results, declined: doc.declined, answers: doc.answers });
}));
