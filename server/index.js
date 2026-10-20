require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Enforce JWT_SECRET in production (no silent fallback)
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const app = express();

// Vercel terminates TLS one proxy hop ahead of the function, so the client IP
// arrives in X-Forwarded-For. Without this, express-rate-limit rejects the
// header and IP-keyed limits would bucket every user together.
app.set('trust proxy', 1);

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — allow configured client origin in production, all origins in dev
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:3000']
  : true;
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Stripe webhooks need the raw request body for signature verification, so this
// route is mounted before the JSON body parser consumes the stream.
app.use('/api/stripe/webhook', require('./routes/stripeWebhook'));

app.use(express.json());

// Rate limit auth *mutations* — 20 requests per 15 min per IP.
// GET requests (e.g. /api/auth/me, called on every page load) are exempt,
// otherwise normal browsing exhausts the budget and blocks login/register.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' || req.method === 'GET',
});
app.use('/api/auth', authLimiter);

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Protected test route (used by middleware tests)
const verifyToken = require('./middleware/verifyToken');
app.get('/api/protected', verifyToken, (req, res) => res.json({ user: req.user }));

// Routes
app.use('/api/stats',         require('./routes/stats'));
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/campaigns',     require('./routes/campaigns'));
app.use('/api/contributions', require('./routes/contributions'));
app.use('/api/withdrawals',   require('./routes/withdrawals'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/stripe',        require('./routes/stripe'));

const PORT = process.env.PORT || 5000;

const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

// A connection string with no database path (…/<nothing> or …/<query>) makes
// MongoDB silently fall back to the `test` database. Default to a real name so
// data lands where you expect instead of a hidden `test` db.
const mongoUri = process.env.MONGODB_URI || '';
const uriHasDatabase = /^mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(mongoUri);
const connectOptions = uriHasDatabase
  ? mongooseOptions
  : { ...mongooseOptions, dbName: process.env.MONGODB_DB || 'fundflow' };

const connectWithRetry = () => {
  if (process.env.NODE_ENV === 'test') return;
  mongoose.connect(process.env.MONGODB_URI, connectOptions)
    .then(() => {
      const { host, name } = mongoose.connection;
      console.log(`MongoDB connected: ${host}/${name}`);
      app.listen(PORT, () => console.log(`Server running on ${PORT}`));
    })
    .catch((err) => {
      console.error('MongoDB connection failed, retrying in 5s...', err.message);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

module.exports = app;
