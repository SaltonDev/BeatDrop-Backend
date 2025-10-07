import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // ensure .env variables are loaded

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // make sure this matches your .env
);

// Test connection by fetching one row from song_requests
(async () => {
  try {
    const { data, error } = await supabase.from('song_requests').select('*').limit(1);
    if (error) {
      console.error('❌ Supabase DB connection failed:', error.message);
    } else {
      console.log('✅ Supabase DB connected successfully');
    }
  } catch (err) {
    console.error('❌ Supabase DB connection error:', err.message);
  }
})();
