/**
 * Seed script: creates one test user per role for local/dev/testing.
 *
 * Seed accounts (shared password: password123):
 *   Resident:        resident@dev.local  (username: resident)
 *   Encoder:         encoder@dev.local   (username: encoder)
 *   Secretary:       secretary@dev.local (username: secretary)
 *   Punong Barangay: punong_barangay@dev.local (username: punong)
 *   Viewer (SK):     viewer@dev.local    (username: viewer)
 *   Admin:           admin@dev.local     (username: admin)
 *
 * Run: npm run seed (from rbi-backend). Requires MONGO_URI in .env.
 * Do NOT run in production.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const DEV_PASSWORD = 'password123';

const staffLocation = {
  barangay: 'Sta. Catalina',
  cityMunicipality: 'Atimonan',
  province: 'Quezon',
  region: 'NCR',
};

const seedUsers = [
  { email: 'resident@dev.local', username: 'resident', fullName: 'Dev Resident', role: 'resident' },
  { email: 'encoder@dev.local', username: 'encoder', fullName: 'Dev Encoder', role: 'encoder', ...staffLocation },
  { email: 'secretary@dev.local', username: 'secretary', fullName: 'Dev Secretary', role: 'secretary', ...staffLocation },
  { email: 'punong_barangay@dev.local', username: 'punong', fullName: 'Dev Punong Barangay', role: 'punong_barangay', ...staffLocation },
  { email: 'viewer@dev.local', username: 'viewer', fullName: 'Dev Viewer (SK)', role: 'viewer', ...staffLocation },
  { email: 'admin@dev.local', username: 'admin', fullName: 'Dev Admin', role: 'admin' },
];

async function seed() {
  try {
    await connectDB();

    for (const entry of seedUsers) {
      const existing = await User.findOne({ email: entry.email });
      if (existing) {
        const updates = {};
        if (entry.username && !existing.username) updates.username = entry.username;
        if (entry.barangay && existing.barangay !== entry.barangay) {
          updates.barangay = entry.barangay;
          updates.cityMunicipality = entry.cityMunicipality;
          updates.province = entry.province;
          updates.region = entry.region;
        }
        if (Object.keys(updates).length) {
          await User.updateOne({ email: entry.email }, { $set: updates });
          console.log(`Updated: ${entry.email}`);
        } else {
          console.log(`Skip (exists): ${entry.email}`);
        }
        continue;
      }
      await User.create({ ...entry, password: DEV_PASSWORD });
      console.log(`Created: ${entry.email} (${entry.role})`);
    }

    await mongoose.connection.close();
    console.log('Seed done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
