import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import profilesRoutes from './routes/profiles.js';
import companiesRoutes from './routes/companies.js';
import jobsRoutes from './routes/jobs.js';
import applicationsRoutes from './routes/applications.js';
import analyticsRoutes from './routes/analytics.js';
import miscRoutes from './routes/misc.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'job-portal-backend' }));

app.use('/api/profiles', profilesRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', miscRoutes); // saved-jobs, notifications, nudges

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Job portal API listening on http://localhost:${PORT}`));
