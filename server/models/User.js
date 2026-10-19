const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:  { type: String, required: true, unique: true },
  name:   { type: String, required: true },
  photo:  { type: String, default: '' },
  password: { type: String, default: '' },
  role:   { type: String, enum: ['supporter', 'creator', 'admin'], default: 'supporter' },
  credits:{ type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
