const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title:               { type: String, required: true },
  story:               { type: String, required: true },
  category:            { type: String, required: true },
  funding_goal:        { type: Number, required: true },
  minimum_contribution:{ type: Number, required: true },
  deadline:            { type: Date, required: true },
  // Both may be empty: the API schema accepts an empty string, and the
  // campaign card falls back to a placeholder picture. Requiring them here
  // turned a valid create into a 500.
  reward_info:         { type: String, default: '' },
  campaign_image_url:  { type: String, default: '' },
  creator_email:       { type: String, required: true },
  creator_name:        { type: String, required: true },
  amount_raised:       { type: Number, default: 0 },
  status:              { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  // Creator progress posts, newest last. Embedded so a campaign fetch carries
  // them without a second round trip.
  updates: [{
    title:   { type: String, required: true },
    body:    { type: String, required: true },
    posted:  { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
