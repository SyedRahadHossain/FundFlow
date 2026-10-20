const mongoose = require('mongoose');

/**
 * A single-use password reset grant.
 *
 * The raw token never touches the database: only its SHA-256 hash is stored,
 * so a dump of this collection cannot be replayed against the reset route.
 * The record carries the user it belongs to, the moment it stops being valid
 * and whether it has already been spent.
 */
const passwordResetTokenSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token_hash: { type: String, required: true, unique: true, index: true },
  expires_at: { type: Date, required: true },
  used:       { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
