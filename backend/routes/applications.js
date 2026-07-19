import express from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { scoreCandidate } from '../utils/scoring.js';

const router = express.Router();

// ---------- CANDIDATE: apply to a job — Step 4 "Click Apply" -> "Application Submitted" ----------
router.post('/', requireAuth, requireRole('candidate'), async (req, res) => {
  const { job_id, answers, source } = req.body;
  if (!job_id) return res.status(400).json({ error: 'job_id is required' });

  const { data: job, error: jobErr } = await supabaseAdmin
    .from('jobs').select('*').eq('id', job_id).eq('status', 'live').single();
  if (jobErr) return res.status(404).json({ error: 'Job not found or not live' });

  const { score, breakdown } = scoreCandidate(job, req.profile);

  const { data, error } = await supabaseAdmin
    .from('applications')
    .insert({
      job_id, candidate_id: req.user.id, answers: answers || {},
      source: source || 'direct', ai_score: score, ai_score_breakdown: breakdown,
      stage: 'applied',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'You already applied to this job' });
    return res.status(400).json({ error: error.message });
  }

  await supabaseAdmin.from('job_events').insert({ job_id, event_type: 'apply', source: source || 'direct' });
  await supabaseAdmin.from('notifications').insert({
    user_id: job.created_by,
    type: 'application_update',
    title: 'New application received',
    body: `A new candidate applied to "${job.title}".`,
  });

  res.status(201).json({ application: data, message: "You'll be notified about updates." });
});

// ---------- CANDIDATE: my applications — Step 5 "My Applications" + status stepper ----------
router.get('/mine', requireAuth, requireRole('candidate'), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*, jobs(title, location, job_type, companies(name, logo_url))')
    .eq('candidate_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ applications: data });
});

// ---------- EMPLOYER: applications dashboard for a job — Step 4 "Applications Dashboard" ----------
router.get('/job/:jobId', requireAuth, requireRole('employer'), async (req, res) => {
  const { jobId } = req.params;
  const { stage, min_score, sort } = req.query;

  const { data: job } = await supabaseAdmin
    .from('jobs').select('id, created_by').eq('id', jobId).single();
  if (!job || job.created_by !== req.user.id) return res.status(403).json({ error: 'Not your job' });

  let query = supabaseAdmin
    .from('applications')
    .select('*, profiles(full_name, location, skills, experience, education, resume_url, avatar_url)')
    .eq('job_id', jobId);

  if (stage) query = query.eq('stage', stage);
  if (min_score) query = query.gte('ai_score', Number(min_score));
  query = query.order(sort === 'score' ? 'ai_score' : 'created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ applications: data });
});

// ---------- EMPLOYER: move stage / shortlist / reject — Step 5 "Move to Next Stage" ----------
router.patch('/:id/stage', requireAuth, requireRole('employer'), async (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;
  const validStages = ['applied', 'under_review', 'shortlisted', 'interview', 'offered', 'rejected', 'hired'];
  if (!validStages.includes(stage)) return res.status(400).json({ error: 'Invalid stage' });

  const { data: application } = await supabaseAdmin
    .from('applications').select('*, jobs(created_by, title)').eq('id', id).single();
  if (!application || application.jobs.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { data, error } = await supabaseAdmin
    .from('applications').update({ stage }).eq('id', id).select().single();
  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from('notifications').insert({
    user_id: application.candidate_id,
    type: 'application_update',
    title: `Application update: ${application.jobs.title}`,
    body: `Your application status changed to "${stage.replace('_', ' ')}".`,
  });

  res.json({ application: data });
});

// ---------- EMPLOYER: add recruiter notes / rating — Step 5 "Evaluate" ----------
router.patch('/:id/evaluate', requireAuth, requireRole('employer'), async (req, res) => {
  const { id } = req.params;
  const { recruiter_notes, recruiter_rating } = req.body;

  const { data: application } = await supabaseAdmin
    .from('applications').select('*, jobs(created_by)').eq('id', id).single();
  if (!application || application.jobs.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const updates = {};
  if (recruiter_notes !== undefined) updates.recruiter_notes = recruiter_notes;
  if (recruiter_rating !== undefined) updates.recruiter_rating = recruiter_rating;

  const { data, error } = await supabaseAdmin
    .from('applications').update(updates).eq('id', id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ application: data });
});

// ---------- Bulk actions — Step 4 "Bulk Actions" ----------
router.post('/bulk-stage', requireAuth, requireRole('employer'), async (req, res) => {
  const { application_ids, stage } = req.body;
  if (!Array.isArray(application_ids) || !stage) {
    return res.status(400).json({ error: 'application_ids[] and stage are required' });
  }

  const { data: apps } = await supabaseAdmin
    .from('applications').select('id, jobs!inner(created_by)').in('id', application_ids);
  const owned = (apps || []).filter((a) => a.jobs.created_by === req.user.id).map((a) => a.id);
  if (owned.length === 0) return res.status(403).json({ error: 'No matching applications you own' });

  const { data, error } = await supabaseAdmin
    .from('applications').update({ stage }).in('id', owned).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ updated: data.length, applications: data });
});

// ---------- Messaging thread on an application — Step 5 "Communicate" ----------
router.get('/:id/messages', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('messages').select('*').eq('application_id', id).order('created_at', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ messages: data });
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Message body is required' });

  const { data, error } = await supabaseAdmin
    .from('messages').insert({ application_id: id, sender_id: req.user.id, body }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: data });
});

export default router;
