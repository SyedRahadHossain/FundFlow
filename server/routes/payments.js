const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const verifyToken = require('../middleware/verifyToken');
const verifyRole  = require('../middleware/verifyRole');

// Credits are never granted from a request body. The only path that mints
// credits is the signature-verified Stripe webhook (routes/stripeWebhook.js).

// GET /api/payments/all — admin: total payment count and dollar volume
router.get('/all', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const [total, [volume]] = await Promise.all([
      Payment.countDocuments(),
      Payment.aggregate([
        { $group: { _id: null, totalVolume: { $sum: '$amount' } } },
      ]),
    ]);
    return res.json({ total, totalVolume: volume?.totalVolume || 0 });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payments/mine — supporter's payment history
router.get('/mine', verifyToken, verifyRole('supporter'), async (req, res) => {
  try {
    const payments = await Payment.find({ supporter_email: req.user.email }).sort({ date: -1 });
    return res.json(payments);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
