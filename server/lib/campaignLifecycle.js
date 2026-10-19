const Campaign = require('../models/Campaign');
const Contribution = require('../models/Contribution');
const User = require('../models/User');

/**
 * Delete a campaign and refund every approved and pending contribution.
 *
 * The single place a campaign may be destroyed. Both the creator delete route
 * and the admin "delete reported campaign" route call this, so an admin delete
 * can no longer confiscate supporter credits.
 *
 * Pending contributions are refunded too: the supporter's credits are debited
 * when the contribution is submitted, so a pending row still holds real money.
 *
 * Each refund is claimed with a guarded update (`status: 'approved' | 'pending'`
 * → `'refunded'`) before the credits move, so a retry after a partial failure
 * only processes what is still unclaimed instead of refunding twice.
 *
 * @param {string} campaignId
 * @returns {Promise<{ refunded: number }>} credits returned to supporters
 */
async function deleteCampaignWithRefunds(campaignId) {
  const refundable = await Contribution.find({
    campaign_id: campaignId,
    status: { $in: ['approved', 'pending'] },
  });

  let refunded = 0;
  for (const contribution of refundable) {
    const claimed = await Contribution.findOneAndUpdate(
      { _id: contribution._id, status: { $in: ['approved', 'pending'] } },
      { $set: { status: 'refunded' } }
    );
    if (!claimed) continue; // already refunded by an earlier attempt

    await User.findOneAndUpdate(
      { email: contribution.supporter_email },
      { $inc: { credits: contribution.contribution_amount } }
    );
    refunded += contribution.contribution_amount;
  }

  await Campaign.deleteOne({ _id: campaignId });
  return { refunded };
}

module.exports = { deleteCampaignWithRefunds };
