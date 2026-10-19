const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Report = require('../models/Report');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { deleteCampaignWithRefunds } = require('../lib/campaignLifecycle');
const verifyToken = require('../middleware/verifyToken');
const verifyRole = require('../middleware/verifyRole');

const reportSchema = Joi.object({
  campaign_id: Joi.string().required(),
  campaign_title: Joi.string().min(1).required(),
  reason: Joi.string().min(1).required(),
  // Deliberately absent: reporter_email and reporter_name are resolved
  // server-side from the JWT so a client cannot attribute a report to someone
  // else. stripUnknown drops them if sent anyway.
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  }
  req.validated = value;
  next();
};

// POST /api/reports — supporter reports a campaign
router.post('/', verifyToken, verifyRole('supporter'), validate(reportSchema), async (req, res) => {
  try {
    const { campaign_id, campaign_title, reason } = req.validated;
    const reporter = await User.findOne({ email: req.user.email });
    const report = new Report({
      reporter_email: req.user.email,
      reporter_name: reporter?.name || req.user.email,
      campaign_id,
      campaign_title,
      reason,
    });
    await report.save();
    return res.status(201).json(report);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reports — admin views all reports
router.get('/', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const reports = await Report.find().sort({ date: -1 });
    return res.json(reports);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/reports/:campaign_id/campaign — admin deletes reported campaign
// Goes through the shared delete-and-refund path so supporters get their
// credits back, exactly as a creator-initiated delete does.
router.delete('/:campaign_id/campaign', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaign_id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const { refunded } = await deleteCampaignWithRefunds(req.params.campaign_id);
    return res.json({ message: 'Campaign deleted, supporters refunded', refunded });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
