const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Contribution = require('../models/Contribution');
const Withdrawal = require('../models/Withdrawal');
const Campaign = require('../models/Campaign');

/**
 * GET /api/dashboard/counts
 *
 * Pending-work counts for the sidebar badges, scoped to the caller's role.
 * One request per poll instead of the previous four, and every value is a real
 * number — the old calls hit a missing route (403) and array-returning
 * endpoints that never carried a `total`.
 */
router.get('/counts', verifyToken, async (req, res) => {
  try {
    const { email, role } = req.user;
    const counts = { pendingContributions: 0, pendingWithdrawals: 0, pendingCampaigns: 0 };

    if (role === 'supporter') {
      // Contributions the supporter made that are still awaiting creator review.
      counts.pendingContributions = await Contribution.countDocuments({
        supporter_email: email,
        status: 'pending',
      });
    } else if (role === 'creator') {
      // Contributions to this creator's campaigns awaiting review, plus their
      // own withdrawals still being processed.
      [counts.pendingContributions, counts.pendingWithdrawals] = await Promise.all([
        Contribution.countDocuments({ creator_email: email, status: 'pending' }),
        Withdrawal.countDocuments({ creator_email: email, status: 'pending' }),
      ]);
    } else if (role === 'admin') {
      [counts.pendingCampaigns, counts.pendingWithdrawals] = await Promise.all([
        Campaign.countDocuments({ status: 'pending' }),
        Withdrawal.countDocuments({ status: 'pending' }),
      ]);
    }

    return res.json(counts);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
