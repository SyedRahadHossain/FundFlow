const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { deleteCampaignWithRefunds } = require('../lib/campaignLifecycle');
const { parseCampaignSearchQuery, buildCampaignSearchPipeline } = require('../lib/campaignSearch');
const { POLICY, findPolicyViolation } = require('../lib/contentPolicy');

/**
 * The content policy.
 *
 * The platform does not host campaigns that attack a religion or the people
 * who follow it. A campaign that breaks the rule is refused at every door:
 * when it is written, when it is edited, and when an admin tries to publish
 * it. The refusal says what the rule is and never repeats the text that
 * broke it.
 */
const refuseByPolicy = (res, violation) => {
  console.warn('campaign refused by the content policy:', violation.rule);
  return res.status(422).json({ error: POLICY.message, policy: POLICY.id });
};
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

// GET /api/campaigns/query — server-side search, filter, sort and paging
//
// The path is "query", not "search": some networks (a filtering proxy, a
// browser extension) drop browser requests whose path contains "search", and
// the symptom is a page that cannot load its own data. Nothing else depends
// on the name.
//
// The public index used to filter in the browser, so the answer was capped
// by what had already been sent down. One aggregation does the matching,
// the counting and the paging, and returns the rows, the size of the whole
// filtered set and the category counts together.
router.get('/query', (req, res, next) => {
  const { filters, errors } = parseCampaignSearchQuery(req.query);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }
  req.searchFilters = filters;
  return next();
}, (req, res, next) => {
  // An unapproved campaign is moderation data. Only an admin may ask for
  // one; everyone else gets the approved catalog.
  if (req.searchFilters.status === 'approved') return next();
  return verifyToken(req, res, () => verifyRole('admin')(req, res, next));
}, async (req, res) => {
  try {
    const pipeline = buildCampaignSearchPipeline(req.searchFilters);
    const [facet] = await Campaign.aggregate(pipeline);
    const campaigns = facet?.campaigns || [];
    const total = facet?.total?.[0]?.count || 0;
    return res.json({
      campaigns,
      total,
      page: req.searchFilters.page,
      limit: req.searchFilters.limit,
      pages: Math.ceil(total / req.searchFilters.limit),
      facets: {
        categories: (facet?.categories || []).map((c) => ({ value: c._id, count: c.count })),
      },
    });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/campaigns/top-funded — public, top 6 by amount_raised
router.get('/top-funded', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'approved' })
      .sort({ amount_raised: -1 })
      .limit(6)
      // Cards need deadline/goal/creator too: without them the card renders a
      // false "Ended" badge and an empty creator line.
      .select('title campaign_image_url amount_raised deadline funding_goal creator_name');
    res.set('Cache-Control', 'public, max-age=60');
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
    // The approved list is the public catalog: the landing page and the
    // campaign index read it, and it may be cached for a minute. Anything
    // else is moderation data and stays uncached.
    if (req.query.status === 'approved') {
      res.set('Cache-Control', 'public, max-age=60');
    }
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

    // The content policy is checked before the campaign is written, so a
    // campaign that attacks a religion never exists in the database.
    const violation = findPolicyViolation({ title, story, reward_info });
    if (violation) return refuseByPolicy(res, violation);

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
    // A rejected document is the caller's problem, not the server's: say what
    // is wrong instead of a blind "Server error".
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Campaign could not be saved: check the title, story, category, goal, deadline, reward note and image URL.' });
    }
    console.error('campaign create failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/campaigns/:id — creator: update title, story, reward_info
router.patch('/:id', verifyToken, verifyRole('creator'), validate(campaignUpdateSchema), async (req, res) => {
  try {
    const { title, story, reward_info } = req.validated;
    const existing = await Campaign.findOne({ _id: req.params.id, creator_email: req.user.email });
    if (!existing) return res.status(404).json({ error: 'Campaign not found' });

    // The merged campaign is what would be published, so that is what the
    // policy reads: an edit that leaves a hostile story in place is refused
    // too.
    const violation = findPolicyViolation({
      title: title ?? existing.title,
      story: story ?? existing.story,
      reward_info: reward_info ?? existing.reward_info,
    });
    if (violation) return refuseByPolicy(res, violation);

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

    // A progress update is read by every backer of the campaign, so it is
    // held to the same rule as the campaign itself.
    const violation = findPolicyViolation({ title, body });
    if (violation) return refuseByPolicy(res, violation);

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

// DELETE /api/campaigns/:id — creator deletes their own, admin deletes any
// A creator may only delete a campaign they own. An admin may delete any
// campaign: the admin surfaces (campaign management, the report queue) both
// offer the action, and an admin who cannot delete is left with a control that
// always answers "Forbidden".
//
// Both paths go through the same delete-and-refund helper, so deleting a
// campaign returns the credits of every supporter who backed it — an admin
// delete cannot confiscate supporter money either.
router.delete('/:id', verifyToken, verifyRole('creator', 'admin'), async (req, res) => {
  try {
    const scope = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, creator_email: req.user.email };
    const campaign = await Campaign.findOne(scope);
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
    const existing = await Campaign.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Campaign not found' });

    // The content policy has the last word on publication. A campaign that
    // attacks a religion cannot be approved, whatever else is true of it.
    // Rejecting one is always allowed: that is how it leaves.
    if (status === 'approved') {
      const violation = findPolicyViolation(existing);
      if (violation) return refuseByPolicy(res, violation);
    }

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
