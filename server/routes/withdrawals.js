const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Withdrawal = require('../models/Withdrawal');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/verifyToken');
const verifyRole = require('../middleware/verifyRole');

const MIN_WITHDRAWAL_CREDITS = 200;

const withdrawalSchema = Joi.object({
  withdrawal_credit: Joi.number().integer().min(MIN_WITHDRAWAL_CREDITS).required(),
  payment_system: Joi.string().min(2).max(50).required(),
  account_number: Joi.string().min(1).max(100).required(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  }
  req.validated = value;
  next();
};

// POST /api/withdrawals — creator submits withdrawal request
router.post('/', verifyToken, verifyRole('creator'), validate(withdrawalSchema), async (req, res) => {
  try {
    const { withdrawal_credit, payment_system, account_number } = req.validated;

    // Sum amount_raised across all creator's approved campaigns
    const campaigns = await Campaign.find({ creator_email: req.user.email, status: 'approved' });
    const totalRaised = campaigns.reduce((sum, c) => sum + (c.amount_raised || 0), 0);

    if (totalRaised < MIN_WITHDRAWAL_CREDITS) {
      return res.status(400).json({ error: `Minimum ${MIN_WITHDRAWAL_CREDITS} raised credits required` });
    }
    if (withdrawal_credit > totalRaised) {
      return res.status(400).json({ error: 'Cannot withdraw more than raised credits' });
    }

    const withdrawal_amount = withdrawal_credit / 20;
    const user = await User.findOne({ email: req.user.email });

    const withdrawal = new Withdrawal({
      creator_email: req.user.email,
      creator_name: user ? user.name : req.user.email,
      withdrawal_credit,
      withdrawal_amount,
      payment_system,
      account_number,
    });
    await withdrawal.save();
    return res.status(201).json(withdrawal);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/withdrawals/mine — creator's own withdrawals
router.get('/mine', verifyToken, verifyRole('creator'), async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ creator_email: req.user.email }).sort({ withdraw_date: -1 });
    return res.json(withdrawals);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/withdrawals — admin: all pending
router.get('/', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: 'pending' }).sort({ withdraw_date: -1 });
    return res.json(withdrawals);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/withdrawals/:id/approve — admin approves
router.patch('/:id/approve', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    withdrawal.status = 'approved';
    await withdrawal.save();

    // Decrease creator's raised credits across campaigns (deduct proportionally from first campaign)
    const campaigns = await Campaign.find({ creator_email: withdrawal.creator_email, status: 'approved' })
      .sort({ amount_raised: -1 });
    let remaining = withdrawal.withdrawal_credit;
    for (const camp of campaigns) {
      if (remaining <= 0) break;
      const deduct = Math.min(camp.amount_raised, remaining);
      await Campaign.findByIdAndUpdate(camp._id, { $inc: { amount_raised: -deduct } });
      remaining -= deduct;
    }

    await new Notification({
      message: `Your withdrawal of $${withdrawal.withdrawal_amount} was processed`,
      toEmail: withdrawal.creator_email,
      actionRoute: '/dashboard/withdrawals',
    }).save();

    return res.json(withdrawal);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;