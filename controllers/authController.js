import 'dotenv/config';
import { supabase } from '../config/supabaseClient.js';

export const login = async (req, res) => {
  const { email, password } = req.body;  
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  // Sign in using Supabase Admin API (service role key)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: error.message });

  res.json({
    access_token: data.session.access_token,
    user: data.user,
  });
};
