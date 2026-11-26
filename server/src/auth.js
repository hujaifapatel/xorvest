// Register / login with hashed passwords and JSON Web Tokens.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './models.js';

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, mobile: u.mobile });
const issueToken = (u) => ({ token: jwt.sign({ sub: String(u._id) }, process.env.JWT_SECRET, { expiresIn: '7d' }), user: publicUser(u) });

// Middleware: only lets the request through with a valid "Authorization: Bearer <token>".
export function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Please log in to continue.' });
  }
}

export function validateRegistration({ name, email, mobile, password } = {}) {
  const fields = {};
  if (!name || name.trim().length < 2) fields.name = 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email || '')) fields.email = 'Please enter a valid email address.';
  if (mobile && !/^[6-9]\d{9}$/.test(mobile)) fields.mobile = 'Enter a 10-digit Indian mobile number.';
  if (!password || password.length < 8) fields.password = 'Use at least 8 characters.';
  return fields;
}

export async function register(req, res) {
  const fields = validateRegistration(req.body);
  if (Object.keys(fields).length) return res.status(400).json({ error: 'Please check the highlighted fields.', fields });
  const { name, email, mobile, password } = req.body;
  if (await User.exists({ email: email.toLowerCase() })) {
    return res.status(409).json({ error: 'This email is already registered. Please log in.', fields: { email: 'Already registered.' } });
  }
  const user = await User.create({ name: name.trim(), email, mobile: mobile || undefined, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json(issueToken(user));
}

export async function login(req, res) {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  res.json(issueToken(user));
}

export async function me(req, res) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  res.json({ user: publicUser(user) });
}
