import express from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ---------- CANDIDATE: save job for later — Step 3 ----------
router.post('/saved-jobs/:jobId', requireAuth, requireRole('candidate'), async (req, res) => {
  const { jobId } = req.params;
  const { error } = await supabaseAdmin
    .from('saved_jobs').upsert({ candidate_id: req.user.id, job_id: jobId });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

router.delete('/saved-jobs/:jobId', requireAuth, requireRole('candidate'), async (req, res) => {
  const { jobId } = req.params;
  await supabaseAdmin.from('saved_jobs').delete().eq('candidate_id', req.user.id).eq('job_id', jobId);
  res.json({ ok: true });
});

router.get('/saved-jobs', requireAuth, requireRole('candidate'), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('saved_jobs')
    .select('job_id, jobs(*, companies(name, logo_url))')
    .eq('candidate_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ saved: data });
});

// ---------- Notifications (both roles) ----------
router.get('/notifications', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ notifications: data });
});

router.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  const { id } = req.params;
  await supabaseAdmin.from('notifications').update({ read: true }).eq('id', id).eq('user_id', req.user.id);
  res.json({ ok: true });
});

// ---------- EMPLOYER: nudges — Step 7 "Nudges & Alerts" ----------
// Computed on demand: jobs with low applications or expiring soon (30+ days live).
router.get('/nudges', requireAuth, requireRole('employer'), async (req, res) => {
  const { data: jobs } = await supabaseAdmin
    .from('jobs').select('*').eq('created_by', req.user.id).eq('status', 'live');

  const nudges = [];
  const now = Date.now();
  for (const job of jobs || []) {
    const { count } = await supabaseAdmin
      .from('applications').select('*', { count: 'exact', head: true }).eq('job_id', job.id);
    if ((count || 0) < 3) {
      nudges.push({ job_id: job.id, title: job.title, type: 'low_applications', message: `"${job.title}" has fewer than 3 applications.` });
    }
    const ageDays = (now - new Date(job.published_at || job.created_at).getTime()) / 86400000;
    if (ageDays > 30) {
      nudges.push({ job_id: job.id, title: job.title, type: 'expiring', message: `"${job.title}" has been live for ${Math.floor(ageDays)} days — consider reposting.` });
    }
  }
  res.json({ nudges });
});

export default router;
