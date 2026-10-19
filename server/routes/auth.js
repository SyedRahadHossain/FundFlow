const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { getFirebaseAdmin } = require('../lib/firebaseAdmin');

const SALT_ROUNDS = 10;

// Admin is deliberately absent: it is only assignable through the admin-gated
// PATCH /api/users/:id/role route.
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  photo: Joi.string().uri().allow('').optional(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('supporter', 'creator').default('supporter'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const googleSchema = Joi.object({
  idToken: Joi.string().min(20).required(),
});

const signToken = (user) =>
  jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );

const safeUser = (user) => ({
  email: user.email,
  name: user.name,
  photo: user.photo,
  role: user.role,
  credits: user.credits,
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  }
  req.validated = value;
  next();
};

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, photo = '', password, role = 'supporter' } = req.validated;

    const credits = role === 'creator' ? 20 : 50;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({ name, email, photo, password: hashedPassword, role, credits });
    await user.save();

    return res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validated;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    return res.status(200).json({ token: signToken(user), user: safeUser(user) });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/google
// The only accepted credential is a Firebase ID token, verified server-side.
// Identity fields are read from the verified claims, never from the body.
router.post('/google', validate(googleSchema), async (req, res) => {
  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Google sign-in is not configured' });
  }

  let decoded;
  try {
    decoded = await firebaseAdmin.auth().verifyIdToken(req.validated.idToken);
  } catch {
    return res.status(401).json({ error: 'Invalid Google credential' });
  }

  if (!decoded.email || decoded.email_verified === false) {
    return res.status(401).json({ error: 'Google account email is not verified' });
  }
  if (decoded.firebase?.sign_in_provider !== 'google.com') {
    return res.status(401).json({ error: 'Unsupported sign-in provider' });
  }

  const { email, name, picture } = decoded;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      // New Google user — default to supporter with 50 credits
      user = new User({
        email,
        name: name || email,
        photo: picture || '',
        role: 'supporter',
        credits: 50,
        password: '',
      });
      await user.save();
    }

    return res.status(200).json({ token: signToken(user), user: safeUser(user) });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me — returns current user's profile including credits
const verifyToken = require('../middleware/verifyToken');
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;