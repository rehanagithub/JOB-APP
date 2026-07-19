import express from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { generateJobInsights } from '../utils/scoring.js';

const router = express.Router();

// GET /api/analytics/job/:jobId — full analytics bundle for one job
router.get('/job/:jobId', requireAuth, requireRole('employer'), async (req, res) => {
  const { jobId } = req.params;

  const { data: job } = await supabaseAdmin.from('jobs').select('*').eq('id', jobId).single();
  if (!job || job.created_by !== req.user.id) return res.status(403).json({ error: 'Not your job' });

  const { data: events } = await supabaseAdmin.from('job_events').select('*').eq('job_id', jobId);
  const { data: applications } = await supabaseAdmin.from('applications').select('*').eq('job_id', jobId);

  // Jobs performance
  const views = (events || []).filter((e) => e.event_type === 'view').length;
  const applies = (events || []).filter((e) => e.event_type === 'apply').length;
  const shortlisted = (applications || []).filter((a) => a.stage === 'shortlisted').length;
  const hires = (applications || []).filter((a) => a.stage === 'hired').length;

  // Source performance
  const sourceCounts = {};
  (events || []).forEach((e) => {
    if (e.event_type !== 'apply') return;
    sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
  });

  // Funnel analytics
  const stages = ['applied', 'under_review', 'shortlisted', 'interview', 'offered', 'hired'];
  const funnel = stages.map((stage) => ({
    stage,
    count: (applications || []).filter((a) => a.stage === stage).length,
  }));

  const insights = generateJobInsights(job, applications || []);

  res.json({
    performance: { views, applies, shortlisted, hires, conversion_rate: views ? +(applies / views * 100).toFixed(1) : 0 },
    source_performance: sourceCounts,
    funnel,
    insights,
  });
});

// GET /api/analytics/overview — across all of employer's jobs
router.get('/overview', requireAuth, requireRole('employer'), async (req, res) => {
  const { data: jobs } = await supabaseAdmin
    .from('jobs').select('id, title, views, status').eq('created_by', req.user.id);
  const jobIds = (jobs || []).map((j) => j.id);

  const { data: applications } = jobIds.length
    ? await supabaseAdmin.from('applications').select('*').in('job_id', jobIds)
    : { data: [] };

  const perJob = (jobs || []).map((j) => ({
    job_id: j.id,
    title: j.title,
    status: j.status,
    views: j.views || 0,
    applications: (applications || []).filter((a) => a.job_id === j.id).length,
    hires: (applications || []).filter((a) => a.job_id === j.id && a.stage === 'hired').length,
  }));

  res.json({
    total_jobs: jobs?.length || 0,
    live_jobs: (jobs || []).filter((j) => j.status === 'live').length,
    total_applications: applications?.length || 0,
    total_hires: (applications || []).filter((a) => a.stage === 'hired').length,
    jobs: perJob,
  });
});

export default router;
