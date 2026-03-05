import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';

// Load .env from backend directory so it works when started from repo root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/auth.js';
import householdRoutes from './src/routes/households.js';
import reportRoutes from './src/routes/reports.js';
import residentCardRoutes from './src/routes/residentCard.js';
import formBRoutes from './src/routes/formB.js';
import certificateRoutes from './src/routes/certificates.js';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/resident-card', residentCardRoutes);
app.use('/api/form-b', formBRoutes);
app.use('/api/certificates', certificateRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

// Central error handler: log which request failed and respond with 500
app.use((err, req, res, next) => {
  console.error(`[500] ${req.method} ${req.originalUrl}`, err.message || err);
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.error(`Port ${PORT} is in use. Trying port ${nextPort}...`);
    app.listen(nextPort, () => console.log(`Server running on port ${nextPort}`));
  } else {
    throw err;
  }
});
