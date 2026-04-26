import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';

async function run() {
  await connectDB();

  const users = [
    {
      email: process.env.SEED_RAY_EMAIL || 'ray@moisecare.nl',
      name: 'Ray',
      role: 'ray',
      plainPassword: process.env.SEED_RAY_PASSWORD || 'changeme123'
    },
    {
      email: process.env.SEED_AGENCY_EMAIL || 'agency@example.com',
      name: 'Agency',
      role: 'agency',
      plainPassword: process.env.SEED_AGENCY_PASSWORD || 'changeme123'
    }
  ];

  for (const u of users) {
    const existing = await User.findOne({ email: u.email.toLowerCase() });
    if (existing) {
      console.log(`  · ${u.email} already exists, skipping`);
      continue;
    }
    const passwordHash = await User.hashPassword(u.plainPassword);
    await User.create({
      email: u.email,
      name: u.name,
      role: u.role,
      passwordHash
    });
    console.log(`  ✓ Created ${u.role}: ${u.email}`);
  }

  await mongoose.disconnect();
  console.log('✓ Seed complete');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
