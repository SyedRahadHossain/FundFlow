const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { deleteCampaignWithRefunds } = require('../lib/campaignLifecycle');
const verifyToken = require('../middleware/verifyToken');
const verifyRole = require('../middleware/verifyRole');

const campaignCreateSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  story: Joi.string().min(1).required(),
  category: Joi.string().min(1).max(80).required(),
  funding_goal: Joi.number().integer().min(1).required(),
  minimum_contribution: Joi.number().integer().min(1).required(),
  deadline: Joi.date().required(),
  reward_info: Joi.string().allow('').optional(),
  campaign_image_url: Joi.string().uri().allow('').optional(),
});

const campaignUpdateSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  story: Joi.string().min(10).optional(),
  reward_info: Joi.string().allow('').optional(),
});

const campaignStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
});

const campaignUpdatePostSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  body: Joi.string().min(2).max(4000).required(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  }
  req.validated = value;
  next();
};

// GET /api/campaigns/top-funded — public, top 6 by amount_raised
router.get('/top-funded', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'approved' })
      .sort({ amount_raised: -1 })
      .limit(6)
      // Cards need deadline/goal/creator too: without them the card renders a
      // false "Ended" badge and an empty creator line.
      .select('title campaign_image_url amount_raised deadline funding_goal creator_name');
    return res.json(campaigns);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/campaigns/mine — creator's own campaigns
router.get('/mine', verifyToken, verifyRole('creator'), async (req, res) => {
  try {
    const campaigns = await Campaign.find({ creator_email: req.user.email })
      .sort({ deadline: -1 });
    return res.json(campaigns);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// The status filter must be a plain whitelisted string. Express's extended
// query parser turns `?status[$ne]=x` into { status: { $ne: 'x' } }, which
// would otherwise land in find() as a Mongo operator.
const ALLOWED_CAMPAIGN_STATUS = ['pending', 'approved', 'rejected'];

const validateStatusFilter = (req, res, next) => {
  const raw = req.query.status;
  if (raw === undefined) return next();
  if (typeof raw !== 'string' || !ALLOWED_CAMPAIGN_STATUS.includes(raw)) {
    return res.status(400).json({ error: 'Invalid status filter' });
  }
  return next();
};

// Unapproved campaigns are moderation data. Listing them — by filtering for
// them or by omitting the filter and receiving every document — needs an admin.
// `status=approved` stays public, which is all the public campaign pages ask for.
const adminOnlyForUnapproved = (req, res, next) => {
  if (req.query.status === 'approved') return next();
  return verifyToken(req, res, () => verifyRole('admin')(req, res, next));
};

// GET /api/campaigns — approved list is public; every other view is admin-only
router.get('/', validateStatusFilter, adminOnlyForUnapproved, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.active === 'true') filter.deadline = { $gt: new Date() };
    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
    return res.json(campaigns);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/campaigns/:id — approved is public; anything else needs an admin
// The detail route answers under the same rule as the list, because it is the
// same disclosure: an unapproved campaign is moderation data. The load happens
// here, once, so the route cannot serve a document it never classified.
async function sendCampaign(req, res, campaign) {
  if (campaign.status === 'approved') return res.json(campaign);
  return verifyToken(req, res, () =>
    verifyRole('admin')(req, res, () => res.json(campaign)));
}

router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    return await sendCampaign(req, res, campaign);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/campaigns — creator only
router.post('/', verifyToken, verifyRole('creator'), validate(campaignCreateSchema), async (req, res) => {
  try {
    const {
      title, story, category, funding_goal, minimum_contribution,
      deadline, reward_info, campaign_image_url,
    } = req.validated;

    const user = await User.findOne({ email: req.user.email });
    const campaign = new Campaign({
      title, story, category, funding_goal, minimum_contribution,
      deadline, reward_info, campaign_image_url,
      creator_email: req.user.email,
      creator_name: user ? user.name : req.user.email,
      status: 'pending',
    });
    await campaign.save();
    return res.status(201).json(campaign);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/campaigns/:id — creator: update title, story, reward_info
router.patch('/:id', verifyToken, verifyRole('creator'), validate(campaignUpdateSchema), async (req, res) => {
  try {
    const { title, story, reward_info } = req.validated;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, creator_email: req.user.email },
      { $set: { title, story, reward_info } },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    return res.json(campaign);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/campaigns/:id/updates — creator: post a progress update to backers
router.post('/:id/updates', verifyToken, verifyRole('creator'), validate(campaignUpdatePostSchema), async (req, res) => {
  try {
    const { title, body } = req.validated;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, creator_email: req.user.email },
      { $push: { updates: { title, body } } },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    return res.status(201).json(campaign.updates[campaign.updates.length - 1]);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/campaigns/:id — creator: delete + refund approved supporters
router.delete('/:id', verifyToken, verifyRole('creator'), async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, creator_email: req.user.email });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const { refunded } = await deleteCampaignWithRefunds(req.params.id);
    return res.json({ message: 'Campaign deleted, supporters refunded', refunded });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/campaigns/:id/status — admin only
router.patch('/:id/status', verifyToken, verifyRole('admin'), validate(campaignStatusSchema), async (req, res) => {
  try {
    const { status } = req.validated;
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Notify creator
    await new Notification({
      message: `Your campaign "${campaign.title}" was ${status} by Admin`,
      toEmail: campaign.creator_email,
      actionRoute: '/dashboard/my-campaigns',
    }).save();

    return res.json(campaign);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
