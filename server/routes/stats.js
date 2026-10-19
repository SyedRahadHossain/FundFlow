const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Contribution = require('../models/Contribution');

/**
 * GET /api/stats — public platform counters.
 *
 * These are the only numbers the landing page is allowed to show. PRODUCT.md
 * forbids fabricated social proof and benchmark metrics, so every value here is
 * computed from the database and nothing is estimated or rounded up. A fresh
 * install legitimately reports zeros; the client hides the section in that case
 * rather than inventing activity.
 *
 * The credit total is aggregated server-side instead of loading every campaign
 * document just to add up one field.
 */
router.get('/', async (req, res) => {
  try {
    const [campaignsLive, raised, supporters, creators, goalsReached] = await Promise.all([
      Campaign.countDocuments({ status: 'approved', deadline: { $gt: new Date() } }),
      Campaign.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, credits: { $sum: '$amount_raised' } } },
      ]),
      Contribution.distinct('supporter_email', { status: 'approved' }),
      Campaign.distinct('creator_email', { status: 'approved' }),
      Campaign.countDocuments({
        status: 'approved',
        $expr: { $gte: ['$amount_raised', '$funding_goal'] },
      }),
    ]);

    res.set('Cache-Control', 'public, max-age=60');
    return res.json({
      campaigns_live: campaignsLive,
      campaigns_raised: goalsReached,
      credits_raised: raised[0]?.credits || 0,
      supporters: supporters.length,
      creators: creators.length,
    });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
