import { Router } from 'express';
import mongoose from 'mongoose';
import { Plan } from './models/Plan.js';
import { Assessment } from './models/Assessment.js';
import { QUESTIONS, CHAPTERS } from './engine/questions.js';
import { recommend } from './engine/score.js';

export const api = Router();

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

api.get('/questions', (req, res) => {
  res.json({ chapters: CHAPTERS, questions: QUESTIONS });
});

api.get('/plans', wrap(async (req, res) => {
  const filter = {};
  if (req.query.slugs) filter.slug = { $in: String(req.query.slugs).split(',') };
  const plans = await Plan.find(filter).sort({ insurer: 1, name: 1 }).lean();
  res.json(plans);
}));

export function validateAnswers(a) {
  const errors = [];
  for (const q of QUESTIONS) {
    const v = a?.[q.id];
    if (q.type === 'members') {
      if (!v || typeof v !== 'object') errors.push(`${q.id} is required`);
      else {
        const c = Number(v.children ?? 0);
        const p = Number(v.parents ?? 0);
        if (!Number.isInteger(c) || c < 0 || c > 4) errors.push('children must be 0–4');
        if (!Number.isInteger(p) || p < 0 || p > 2) errors.push('parents must be 0–2');
      }
    } else if (q.type === 'number') {
      const n = Number(v);
      if (!Number.isFinite(n) || n < q.min || n > q.max) errors.push(`${q.id} must be between ${q.min} and ${q.max}`);
    } else if (q.type === 'multi') {
      const allowed = q.options.map((o) => o.value);
      if (!Array.isArray(v) || !v.length || v.some((x) => !allowed.includes(x))) errors.push(`${q.id} is invalid`);
    } else {
      if (!q.options.some((o) => o.value === v)) errors.push(`${q.id} is invalid`);
    }
  }
  return errors;
}

api.post('/assessments', wrap(async (req, res) => {
  const answers = req.body?.answers;
  const errors = validateAnswers(answers);
  if (errors.length) return res.status(400).json({ errors });

  const plans = await Plan.find().lean();
  const { profile, results, declined } = recommend(plans, answers);
  const doc = await Assessment.create({ answers, profile, results, declined });
  res.status(201).json({ id: doc._id, profile, results, declined });
}));

api.get('/assessments/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const doc = await Assessment.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ id: doc._id, profile: doc.profile, results: doc.results, declined: doc.declined, answers: doc.answers });
}));
