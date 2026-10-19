const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/verifyToken');

// GET /api/notifications?email=x — current user's notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ toEmail: req.user.email }).sort({ time: -1 });
    return res.json(notifications);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/notifications/mark-all-read — mark all notifications as read for current user
router.post('/mark-all-read', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ toEmail: req.user.email }, { $set: { read: true } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
