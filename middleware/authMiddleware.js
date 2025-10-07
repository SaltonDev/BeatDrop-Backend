import { supabase } from '../config/supabaseClient.js';

async function authMiddleware(req, res, next) {
  try {
    // Expect token in header: "Authorization: Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });

    // Verify user via Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Attach user to request object
    req.user = data.user;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware;
