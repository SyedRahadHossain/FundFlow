const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter_email: { type: String, required: true },
  // Display name resolved server-side at report time. Optional so documents
  // written before this field existed still validate.
  reporter_name:  { type: String },
  campaign_id:    { type: mongoose.Schema.Types.ObjectId, required: true },
  campaign_title: { type: String, required: true },
  reason:         { type: String, required: true },
  date:           { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', reportSchema);
