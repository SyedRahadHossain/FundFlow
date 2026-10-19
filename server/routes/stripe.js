const express = require('express');
const router = express.Router();
const Joi = require('joi');
const verifyToken = require('../middleware/verifyToken');
const verifyRole  = require('../middleware/verifyRole');
const { findPackage } = require('../lib/creditPackages');
const { resolveClientUrl } = require('../lib/clientUrl');

const checkoutSchema = Joi.object({
  credits: Joi.number().integer().min(1).required(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  }
  req.validated = value;
  next();
};

// POST /api/stripe/create-checkout-session
// Supporter only — creates a Stripe Checkout session for a fixed credit package.
// The client picks a package; the price comes from the server-side table, so the
// amount charged and the credits granted are never client-controlled.
router.post('/create-checkout-session', verifyToken, verifyRole('supporter'), validate(checkoutSchema), async (req, res) => {
  const pkg = findPackage(req.validated.credits);
  if (!pkg) {
    return res.status(400).json({ error: 'Unknown credit package' });
  }

  // Stripe is optional — if key not set, report it rather than pretending to pay
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  // A placeholder CLIENT_URL would bounce paying users to an unowned host and
  // 404 *after* the charge, so refuse before a session exists.
  const clientUrl = resolveClientUrl();
  if (!clientUrl) {
    console.error('Stripe checkout blocked: CLIENT_URL is missing or still a placeholder from .env.example');
    return res.status(503).json({ error: 'Client URL not configured' });
  }

  try {
    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(pkg.price * 100), // cents
            product_data: {
              name: `${pkg.credits} FundFlow Credits`,
              description: `Top up your FundFlow account with ${pkg.credits} credits`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${clientUrl}/dashboard/purchase-credit?purchase=success`,
      cancel_url:  `${clientUrl}/dashboard/purchase-credit?purchase=cancelled`,
      metadata: {
        supporter_email: req.user.email,
        credits: String(pkg.credits),
        amount:  String(pkg.price),
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: 'Stripe session creation failed' });
  }
});

module.exports = router;
