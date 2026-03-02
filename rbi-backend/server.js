import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/auth.js';
import householdRoutes from './src/routes/households.js';
import reportRoutes from './src/routes/reports.js';
import residentCardRoutes from './src/routes/residentCard.js';
import formBRoutes from './src/routes/formB.js';

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

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
