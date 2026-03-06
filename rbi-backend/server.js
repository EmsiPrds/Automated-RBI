import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';

// Load .env from backend directory so it works when started from repo root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Fail fast if required env is missing
if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI in .env');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env');
  process.exit(1);
}

import cors from 'cors';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/auth.js';
import householdRoutes from './src/routes/households.js';
import reportRoutes from './src/routes/reports.js';
import residentCardRoutes from './src/routes/residentCard.js';
import formBRoutes from './src/routes/formB.js';
import certificateRoutes from './src/routes/certificates.js';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/resident-card', residentCardRoutes);
app.use('/api/form-b', formBRoutes);
app.use('/api/certificates', certificateRoutes);

app.get('/api/health', (_, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (!dbReady) {
    return res.status(503).json({ ok: false, message: 'Database not ready' });
  }
  res.json({ ok: true });
});

// Central error handler: log which request failed and respond with 500
app.use((err, req, res, next) => {
  console.error(`[${err.status || 500}] ${req.method} ${req.originalUrl}`, err.message || err);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  const status = err.status || 500;
  const message = status === 500 && process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error');
  res.status(status).json({ message });
});

async function start() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use. Set PORT=${Number(PORT) + 1} in .env and restart.`);
      process.exit(1);
    }
    throw err;
  });
}

start().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
