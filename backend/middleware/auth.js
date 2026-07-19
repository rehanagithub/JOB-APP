import { supabaseAdmin } from '../config/supabaseClient.js';

// Verifies the Supabase access token sent by the frontend in the
// Authorization header ("Bearer <token>") and attaches the user + profile
// to req.user / req.profile.
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !userData?.user) return res.status(401).json({ error: 'Invalid or expired token' });

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    if (profileErr) return res.status(401).json({ error: 'Profile not found' });

    req.user = userData.user;
    req.profile = profile;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Auth check failed' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.profile?.role !== role) {
      return res.status(403).json({ error: `Requires ${role} role` });
    }
    next();
  };
}
