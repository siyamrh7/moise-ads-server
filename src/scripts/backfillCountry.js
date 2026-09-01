import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Ad from '../models/Ad.js';
import Contact from '../models/Contact.js';

async function run() {
  await connectDB();

  const adsResult = await Ad.updateMany(
    { country: { $exists: false } },
    { $set: { country: 'NL' } }
  );
  console.log(`✓ Ads backfilled: ${adsResult.modifiedCount}`);

  const contactsResult = await Contact.updateMany(
    { country: { $exists: false } },
    { $set: { country: 'NL' } }
  );
  console.log(`✓ Contacts backfilled: ${contactsResult.modifiedCount}`);

  await mongoose.disconnect();
  console.log('✓ Backfill complete');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
