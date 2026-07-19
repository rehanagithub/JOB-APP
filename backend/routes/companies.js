import express from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET current employer's company
router.get('/mine', requireAuth, requireRole('employer'), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('owner_id', req.user.id)
    .maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ company: data });
});

// POST create company (Step 1: Company Details)
router.post('/', requireAuth, requireRole('employer'), async (req, res) => {
  const { name, industry, size, website, logo_url, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Company name is required' });

  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert({ owner_id: req.user.id, name, industry, size, website, logo_url, description })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ company: data });
});

// PATCH update company details / trigger verification
router.patch('/:id', requireAuth, requireRole('employer'), async (req, res) => {
  const { id } = req.params;
  const allowed = ['name', 'industry', 'size', 'website', 'logo_url', 'description', 'verification_doc_url'];
  const updates = {};
  for (const key of allowed) if (key in req.body) updates[key] = req.body[key];

  const { data, error } = await supabaseAdmin
    .from('companies')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ company: data });
});

// POST simulate domain/document verification (Step: Verify Company)
router.post('/:id/verify', requireAuth, requireRole('employer'), async (req, res) => {
  const { id } = req.params;
  // In production: check website domain against employer's registered email domain,
  // or route uploaded document to a manual review queue. Here we auto-approve.
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({ domain_verified: true })
    .eq('id', id)
    .eq('owner_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ company: data, message: 'Company verified. Account ready!' });
});

export default router;
