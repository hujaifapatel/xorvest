import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './models/User.js';

const TOKEN_TTL = '7d';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set in server/.env');
  return s;
}

const sign = (user) => jwt.sign({ sub: String(user._id) }, secret(), { expiresIn: TOKEN_TTL });

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });
  try {
    req.userId = jwt.verify(token, secret()).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE = /^[6-9]\d{9}$/;

export function validateRegistration({ name, email, mobile, password } = {}) {
  const errors = {};
  if (!name || String(name).trim().length < 2) errors.name = 'Please enter your full name.';
  if (!email || !EMAIL.test(String(email).trim())) errors.email = 'Please enter a valid email address.';
  if (mobile && !MOBILE.test(String(mobile).trim())) errors.mobile = 'Enter a 10-digit Indian mobile number.';
  if (!password || String(password).length < 8) errors.password = 'Use at least 8 characters.';
  return errors;
}

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

export const authRouter = Router();

authRouter.post('/register', wrap(async (req, res) => {
  const errors = validateRegistration(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the highlighted fields.', fields: errors });

  const email = String(req.body.email).trim().toLowerCase();
  if (await User.exists({ email })) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.', fields: { email: 'Already registered.' } });
  }
  const user = await User.create({
    name: String(req.body.name).trim(),
    email,
    mobile: req.body.mobile ? String(req.body.mobile).trim() : undefined,
    passwordHash: await bcrypt.hash(String(req.body.password), 10),
  });
  res.status(201).json({ token: sign(user), user: user.toPublic() });
}));

authRouter.post('/login', wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const user = email && (await User.findOne({ email }));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  res.json({ token: sign(user), user: user.toPublic() });
}));

authRouter.get('/me', requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  res.json({ user: user.toPublic() });
}));
