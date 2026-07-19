import express from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function computeProfileCompleteness(profile) {
  const fields = [
    profile.full_name,
    profile.location,
    profile.education?.length > 0,
    profile.experience?.length >= 0, // experience optional
    profile.skills?.length > 0,
    profile.resume_url,
    profile.preferences && Object.keys(profile.preferences).length > 0,
  ];
  const weights = [15, 10, 20, 0, 20, 20, 15];
  let pct = 0;
  fields.forEach((f, i) => {
    if (f) pct += weights[i];
  });
  return Math.min(100, pct);
}

// GET current user's profile
router.get('/me', requireAuth, async (req, res) => {
  res.json({ profile: req.profile });
});

// PATCH update candidate profile (Step 2: Create Account / Complete Profile)
router.patch('/me', requireAuth, async (req, res) => {
  const allowed = [
    'full_name', 'phone', 'location', 'education', 'experience',
    'skills', 'resume_url', 'preferences', 'avatar_url',
  ];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  const merged = { ...req.profile, ...updates };
  updates.profile_complete_pct = computeProfileCompleteness(merged);

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ profile: data });
});

export default router;
