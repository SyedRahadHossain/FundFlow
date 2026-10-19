const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  supporter_email: { type: String, required: true },
  credits:         { type: Number, required: true },
  amount:          { type: Number, required: true },
  date:            { type: Date, default: Date.now },
  // Set only by the verified Stripe webhook. Unique so a replayed
  // `checkout.session.completed` event cannot grant credits twice.
  stripe_session_id: { type: String, unique: true, sparse: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
