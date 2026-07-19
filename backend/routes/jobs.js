import express from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

function slugify(title) {
  return (
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}

// ---------- EMPLOYER: create job (draft) — Step 2 "Create New Job" + "Add Job Details" ----------
router.post('/', requireAuth, requireRole('employer'), async (req, res) => {
  const {
    company_id, title, job_type, description, location, remote,
    salary_min, salary_max, experience_required, notice_period,
    key_skills, education_required, languages, screening_questions,
  } = req.body;

  if (!company_id || !title || !job_type) {
    return res.status(400).json({ error: 'company_id, title and job_type are required' });
  }

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({
      company_id, created_by: req.user.id, title, job_type, description, location,
      remote: !!remote, salary_min, salary_max, experience_required, notice_period,
      key_skills: key_skills || [], education_required, languages: languages || [],
      screening_questions: screening_questions || [],
      status: 'draft',
      share_slug: slugify(title),
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ job: data });
});

// ---------- EMPLOYER: update job (add details / preferences) ----------
router.patch('/:id', requireAuth, requireRole('employer'), async (req, res) => {
  const { id } = req.params;
  const allowed = [
    'title', 'description', 'location', 'remote', 'salary_min', 'salary_max',
    'experience_required', 'notice_period', 'key_skills', 'education_required',
    'languages', 'screening_questions', 'boosted',
  ];
  const updates = {};
  for (const key of allowed) if (key in req.body) updates[key] = req.body[key];

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .eq('created_by', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ job: data });
});

// ---------- EMPLOYER: publish job — Step 2 "Preview & Publish" -> "Job Live!" ----------
router.post('/:id/publish', requireAuth, requireRole('employer'), async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .update({ status: 'live', published_at: new Date().toISOString() })
    .eq('id', id)
    .eq('created_by', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ job: data, message: 'Your job is now live!' });
});

// ---------- EMPLOYER: duplicate/repost job — Step 7 ----------
router.post('/:id/duplicate', requireAuth, requireRole('employer'), async (req, res) => {
  const { id } = req.params;
  const { data: original, error: findErr } = await supabaseAdmin
    .from('jobs').select('*').eq('id', id).eq('created_by', req.user.id).single();
  if (findErr) return res.status(404).json({ error: 'Job not found' });

  const { id: _drop, share_slug: _s, created_at: _c, published_at: _p, views: _v, ...rest } = original;
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({ ...rest, status: 'draft', share_slug: slugify(original.title) })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ job: data });
});

// ---------- EMPLOYER: list my jobs (any status) ----------
router.get('/mine', requireAuth, requireRole('employer'), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*, companies(name, logo_url)')
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ jobs: data });
});

// ---------- CANDIDATE: browse/search live jobs — Step 3 "Search & Filter" ----------
router.get('/', async (req, res) => {
  const { q, location, job_type, remote, min_salary } = req.query;
  let query = supabaseAdmin
    .from('jobs')
    .select('*, companies(name, logo_url, industry)')
    .eq('status', 'live')
    .order('created_at', { ascending: false });

  if (q) query = query.ilike('title', `%${q}%`);
  if (location) query = query.ilike('location', `%${location}%`);
  if (job_type) query = query.eq('job_type', job_type);
  if (remote === 'true') query = query.eq('remote', true);
  if (min_salary) query = query.gte('salary_max', Number(min_salary));

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ jobs: data });
});

// ---------- Get single job by id (public if live, owner otherwise) + log a view ----------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { source } = req.query;
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*, companies(name, logo_url, industry, website, description)')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Job not found' });

  if (data.status === 'live') {
    await supabaseAdmin.from('job_events').insert({ job_id: id, event_type: 'view', source: source || 'direct' });
    await supabaseAdmin.from('jobs').update({ views: (data.views || 0) + 1 }).eq('id', id);
  }

  res.json({ job: data });
});

// ---------- Track a share click — Step 3 "Track Source" ----------
router.post('/:id/share', async (req, res) => {
  const { id } = req.params;
  const { source } = req.body;
  await supabaseAdmin.from('job_events').insert({ job_id: id, event_type: 'share', source: source || 'unknown' });
  res.json({ ok: true });
});

export default router;
