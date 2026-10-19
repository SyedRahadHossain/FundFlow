const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Contribution = require('../models/Contribution');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/verifyToken');
const verifyRole = require('../middleware/verifyRole');

const contributionSchema = Joi.object({
  campaign_id: Joi.string().hex().length(24).required(),
  contribution_amount: Joi.number().integer().min(1).required(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  }
  req.validated = value;
  next();
};

// POST /api/contributions — supporter submits a contribution
router.post('/', verifyToken, verifyRole('supporter'), validate(contributionSchema), async (req, res) => {
  try {
    const { campaign_id, contribution_amount } = req.validated;

    const campaign = await Campaign.findById(campaign_id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status !== 'approved') return res.status(400).json({ error: 'Campaign not active' });
    if (new Date(campaign.deadline) < new Date()) return res.status(400).json({ error: 'Campaign deadline passed' });
    if (contribution_amount < campaign.minimum_contribution) {
      return res.status(400).json({ error: `Minimum contribution is ${campaign.minimum_contribution}` });
    }

    const supporter = await User.findOne({ email: req.user.email });
    if (!supporter || supporter.credits < contribution_amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Debit atomically and only while the balance still covers it. The check
    // above is a separate read, so a request racing this one could spend the
    // same credits twice without this guard.
    const debited = await User.findOneAndUpdate(
      { email: req.user.email, credits: { $gte: contribution_amount } },
      { $inc: { credits: -contribution_amount } }
    );
    if (!debited) return res.status(400).json({ error: 'Insufficient credits' });

    const contribution = new Contribution({
      campaign_id,
      campaign_title: campaign.title,
      contribution_amount,
      supporter_email: req.user.email,
      supporter_name: supporter.name,
      creator_email: campaign.creator_email,
      creator_name: campaign.creator_name,
    });

    try {
      await contribution.save();
    } catch (err) {
      // The debit is already committed. Hand the credits back so a failed
      // write cannot charge for a contribution that does not exist.
      await User.findOneAndUpdate(
        { email: req.user.email },
        { $inc: { credits: contribution_amount } }
      ).catch(() => {});
      throw err;
    }

    // Best effort from here: the contribution exists, so a notification
    // failure must not answer 500 and invite a second, paid-for retry.
    await new Notification({
      message: `New contribution of ${contribution_amount} credits to "${campaign.title}" from ${supporter.name}`,
      toEmail: campaign.creator_email,
      actionRoute: '/dashboard/contributions-review',
    }).save().catch(() => {});

    return res.status(201).json(contribution);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/contributions/mine — supporter's own (paginated, optional status filter)
const ALLOWED_STATUS = ['pending', 'approved', 'rejected', 'refunded'];
router.get('/mine', verifyToken, verifyRole('supporter'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Whitelist rather than trust: an arbitrary status would never match, but
    // it would still reach Mongo as a query value.
    const filter = { supporter_email: req.user.email };
    if (req.query.status) {
      if (!ALLOWED_STATUS.includes(req.query.status)) {
        return res.status(400).json({ error: 'Invalid status filter' });
      }
      filter.status = req.query.status;
    }

    const [contributions, total] = await Promise.all([
      Contribution.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Contribution.countDocuments(filter),
    ]);
    return res.json({ contributions, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/contributions/campaign/:id — creator views contributions for their campaign
router.get('/campaign/:id', verifyToken, verifyRole('creator'), async (req, res) => {
  try {
    const contributions = await Contribution.find({
      campaign_id: req.params.id,
      creator_email: req.user.email,
      status: 'pending',
    }).sort({ createdAt: -1 });
    return res.json(contributions);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/contributions/:id/approve — creator approves
router.patch('/:id/approve', verifyToken, verifyRole('creator'), async (req, res) => {
  try {
    const contribution = await Contribution.findOne({ _id: req.params.id, creator_email: req.user.email });
    if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
    if (contribution.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    contribution.status = 'approved';
    await contribution.save();

    await Campaign.findByIdAndUpdate(
      contribution.campaign_id,
      { $inc: { amount_raised: contribution.contribution_amount } }
    );

    await new Notification({
      message: `Your contribution of ${contribution.contribution_amount} credits to "${contribution.campaign_title}" was approved by ${contribution.creator_name}`,
      toEmail: contribution.supporter_email,
      actionRoute: '/dashboard/supporter-home',
    }).save();

    return res.json(contribution);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/contributions/:id/reject — creator rejects + refunds
router.patch('/:id/reject', verifyToken, verifyRole('creator'), async (req, res) => {
  try {
    const contribution = await Contribution.findOne({ _id: req.params.id, creator_email: req.user.email });
    if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
    if (contribution.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    contribution.status = 'rejected';
    await contribution.save();

    // Refund supporter
    await User.findOneAndUpdate(
      { email: contribution.supporter_email },
      { $inc: { credits: contribution.contribution_amount } }
    );

    await new Notification({
      message: `Your contribution of ${contribution.contribution_amount} credits to "${contribution.campaign_title}" was rejected by ${contribution.creator_name}`,
      toEmail: contribution.supporter_email,
      actionRoute: '/dashboard/supporter-home',
    }).save();

    return res.json(contribution);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;