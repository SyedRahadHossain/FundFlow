const express = require('express');
const router = express.Router();
const Joi = require('joi');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const verifyRole = require('../middleware/verifyRole');

const roleSchema = Joi.object({
  role: Joi.string().valid('supporter', 'creator', 'admin').required(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  }
  req.validated = value;
  next();
};

// GET /api/users — admin: all users
router.get('/', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.json(users);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:id — admin removes user
router.delete('/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'User deleted' });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/users/:id/role — admin updates role
router.patch('/:id/role', verifyToken, verifyRole('admin'), validate(roleSchema), async (req, res) => {
  try {
    const { role } = req.validated;
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { role } }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/stats — admin dashboard stats
router.get('/stats', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const [supporters, creators, admins, allUsers] = await Promise.all([
      User.countDocuments({ role: 'supporter' }),
      User.countDocuments({ role: 'creator' }),
      User.countDocuments({ role: 'admin' }),
      User.find().select('credits'),
    ]);
    const totalCredits = allUsers.reduce((sum, u) => sum + (u.credits || 0), 0);
    return res.json({ supporters, creators, admins, totalCredits });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
