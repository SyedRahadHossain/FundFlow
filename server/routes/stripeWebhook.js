const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');

/**
 * POST /api/stripe/webhook — the only path that grants credits.
 *
 * Mounted before the global JSON body parser (see index.js) because the Stripe
 * signature must be checked against the exact bytes Stripe sent. Credits and
 * amount come from session metadata that this server wrote when it created the
 * session, so a client cannot influence either.
 */
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return res.status(503).json({ error: 'Stripe webhook not configured' });
  }

  const Stripe = require('stripe');
  const stripe = Stripe(secretKey);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      webhookSecret
    );
  } catch {
    return res.status(400).json({ error: 'Invalid Stripe signature' });
  }

  if (event.type !== 'checkout.session.completed') {
    return res.json({ received: true, ignored: event.type });
  }

  const session = event.data.object;
  if (session.payment_status !== 'paid') {
    return res.json({ received: true, ignored: 'unpaid' });
  }

  const email = session.metadata?.supporter_email;
  const credits = Number.parseInt(session.metadata?.credits, 10);
  const amount = Number(session.metadata?.amount);

  if (!email || !Number.isInteger(credits) || credits < 1 || !Number.isFinite(amount)) {
    return res.json({ received: true, ignored: 'invalid metadata' });
  }

  // What was actually charged must match the metadata this server authored.
  if (session.amount_total !== Math.round(amount * 100)) {
    return res.json({ received: true, ignored: 'amount mismatch' });
  }

  try {
    // Claim the event first: the unique index on stripe_session_id makes this
    // the idempotency guard, so a replayed event cannot grant credits twice.
    await new Payment({
      supporter_email: email,
      credits,
      amount,
      stripe_session_id: session.id,
    }).save();

    await User.findOneAndUpdate({ email }, { $inc: { credits } });
    return res.json({ received: true });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ received: true, duplicate: true });
    }
    // Release the claim so Stripe's retry can process the event cleanly.
    await Payment.deleteOne({ stripe_session_id: session.id }).catch(() => {});
    console.error('Stripe webhook failed:', err.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
