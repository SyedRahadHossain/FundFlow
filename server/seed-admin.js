/**
 * Seed Admin user.
 * Run once: node seed-admin.js
 * Requires .env with MONGODB_URI set.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./models/User');

  const hash = await bcrypt.hash('Admin@123456', 10);
  const admin = await User.findOneAndUpdate(
    { email: 'admin@fundflow.com' },
    {
      $setOnInsert: {
        name:     'FundFlow Admin',
        email:    'admin@fundflow.com',
        password: hash,
        role:     'admin',
        credits:  0,
        photo:    '',
      },
    },
    { upsert: true, new: true }
  );

  console.log(`Admin ready: ${admin.email} (role: ${admin.role})`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
