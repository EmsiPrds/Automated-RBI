/**
 * Seed script: creates one test user per role for local/dev/testing.
 *
 * Seed accounts (shared password: password123):
 *   Resident:        resident@dev.local
 *   Encoder:         encoder@dev.local
 *   Secretary:       secretary@dev.local
 *   Punong Barangay: punong_barangay@dev.local
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
  { email: 'resident@dev.local', fullName: 'Dev Resident', role: 'resident' },
  { email: 'encoder@dev.local', fullName: 'Dev Encoder', role: 'encoder', ...staffLocation },
  { email: 'secretary@dev.local', fullName: 'Dev Secretary', role: 'secretary', ...staffLocation },
  { email: 'punong_barangay@dev.local', fullName: 'Dev Punong Barangay', role: 'punong_barangay', ...staffLocation },
];

async function seed() {
  try {
    await connectDB();

    for (const entry of seedUsers) {
      const existing = await User.findOne({ email: entry.email });
      if (existing) {
        if (entry.barangay && existing.barangay !== entry.barangay) {
          await User.updateOne(
            { email: entry.email },
            { $set: { barangay: entry.barangay, cityMunicipality: entry.cityMunicipality, province: entry.province, region: entry.region } }
          );
          console.log(`Updated location: ${entry.email}`);
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
