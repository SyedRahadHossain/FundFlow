const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { getFirebaseAuth } = require('../lib/firebaseAdmin');
const { resolveClientUrl } = require('../lib/clientUrl');

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

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

// The password rules are the register route's rules: 8 to 128 characters.
const resetPasswordSchema = Joi.object({
  token: Joi.string().min(20).max(200).required(),
  password: Joi.string().min(8).max(128).required(),
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

// ── Password recovery ─────────────────────────────────────────────
//
// The platform has no email provider configured, so the reset link cannot be
// mailed. It follows the same graceful degradation the Stripe and imgBB
// integrations use: outside production the link is written to the server
// console, and in production it is never emitted anywhere. A mail provider
// still has to be wired before this route can deliver anything to a real
// user — until then, the console line is the delivery channel.

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // one hour
const RESET_TOKEN_BYTES = 32;              // 256 bits of entropy

// One answer for every address, known or not. The response never says
// whether an account exists.
const GENERIC_RESET_MESSAGE =
  'If an account exists for that address, a password reset link is on its way.';

// A real bcrypt hash of a value nobody can sign in with. Comparing against
// it spends the time a live check would, so an unknown address takes about as
// long to answer as a known one and the timing does not leak which addresses
// are registered.
const DUMMY_PASSWORD_HASH = '$2b$10$vInWIzP0OoHCcFU8ZMnshulAlRfy0dXECTCBa5xjGpFNSuT70d2j.';

// Only the hash of the token is stored, so a dump of the token collection
// cannot be replayed against the reset route.
const hashResetToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

/**
 * Hand the reset link to the user.
 *
 * Outside production the link is printed to the console. In production the
 * link is never emitted — not to the console, not to the response.
 */
const deliverResetLink = ({ email, rawToken }) => {
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[auth] Password reset requested, but no email provider is configured — the reset link was not delivered.'
    );
    return;
  }

  const base = resolveClientUrl();
  if (!base) {
    console.warn(
      '[auth] Password reset requested, but CLIENT_URL is unusable — the reset link was not delivered.'
    );
    return;
  }

  console.log(
    `\n[auth] Password reset link for ${email} (valid for one hour):\n` +
      `${base}/reset-password?token=${rawToken}\n`
  );
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
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    return res.status(503).json({ error: 'Google sign-in is not configured' });
  }

  let decoded;
  try {
    decoded = await firebaseAuth.verifyIdToken(req.validated.idToken);
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

// POST /api/auth/forgot-password
// Always answers the same way, so the response never reveals whether an
// account exists. The route sits inside the /api/auth rate limiter that
// index.js mounts, so it shares the 20 requests per 15 minutes per IP budget
// with login and register.
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.validated;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Spend the time a live account would spend before answering.
      await bcrypt.compare('fundflow-timing-equalizer', DUMMY_PASSWORD_HASH);
      return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
    }

    // One live link per account: a fresh request supersedes the old grant.
    await PasswordResetToken.updateMany(
      { user_id: user._id, used: false },
      { $set: { used: true } }
    );

    const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
    await new PasswordResetToken({
      user_id: user._id,
      token_hash: hashResetToken(rawToken),
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      used: false,
    }).save();

    deliverResetLink({ email, rawToken });

    return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password
// The grant is spent as it is used, and every other grant the account still
// holds is spent with it, so a link that was superseded cannot be used later.
// Note the platform's sessions are stateless JWTs, so a token that was already
// issued stays valid until it expires — this route cannot revoke it.
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  const { token, password } = req.validated;
  try {
    const record = await PasswordResetToken.findOne({ token_hash: hashResetToken(token) });
    const expired = record && new Date(record.expires_at).getTime() <= Date.now();

    if (!record || record.used || expired) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    const user = await User.findOne({ _id: record.user_id });
    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    await user.save();

    record.used = true;
    await record.save();
    await PasswordResetToken.updateMany(
      { user_id: record.user_id, used: false },
      { $set: { used: true } }
    );

    return res.status(200).json({ message: 'Password updated. Sign in with your new password.' });
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