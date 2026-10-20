/**
 * Role guard.
 *
 * Accepts one role or several: `verifyRole('admin')` and
 * `verifyRole('creator', 'admin')` both work. A user passes when their role is
 * one of the listed roles.
 */
const verifyRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};

module.exports = verifyRole;
