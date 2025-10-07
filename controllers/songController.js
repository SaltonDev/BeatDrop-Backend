import { supabase } from '../config/supabaseClient.js';

// Helper to normalize song & artist names
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/feat\.?|ft\.?|featuring/gi, '') // remove "feat", "ft", etc.
    .replace(/[^a-z0-9\s]/gi, '') // remove special characters
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

// 🟢 Submit song request (public)
export const submitRequest = async (req, res) => {
  const { song_name, artist_name } = req.body;
  if (!song_name || !artist_name)
    return res.status(400).json({ error: 'Missing song or artist' });

  const normalized_song = normalize(song_name);
  const normalized_artist = normalize(artist_name);

  // Check for existing entry (by normalized values)
  const { data: existing, error: checkError } = await supabase
    .from('song_requests')
    .select('*')
    .eq('normalized_song', normalized_song)
    .eq('normalized_artist', normalized_artist)
    .limit(1);

  if (checkError) return res.status(500).json({ error: checkError.message });

  let response;
  if (existing && existing.length > 0) {
    // Song already exists → increment vote count
    const song = existing[0];
    const { data, error: updateError } = await supabase
      .from('song_requests')
      .update({ vote_count: song.vote_count + 1 })
      .eq('id', song.id)
      .select();

    if (updateError) return res.status(500).json({ error: updateError.message });
    response = { action: 'update', data: data[0] };
  } else {
    // New song → insert with vote_count = 1
    const { data, error } = await supabase
      .from('song_requests')
      .insert([
        {
          song_name,
          artist_name,
          normalized_song,
          normalized_artist,
          vote_count: 1,
        },
      ])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    response = { action: 'insert', data: data[0] };
  }

  // Emit realtime update if socket.io available
  if (req.app.locals.io) {
    req.app.locals.io.emit('song_requests_update', response);
  }

  res.json(response);
};

// 🟠 Get all requests (for DJ dashboard)
export const getRequests = async (req, res) => {
  const { data, error } = await supabase
    .from('song_requests')
    .select('*')
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
};

// 🔴 Cleanup all requests (DJ only)
export const cleanup = async (req, res) => {
  try {
    // Method 1: Using .neq() to match all rows
    const { data, error } = await supabase
      .from('song_requests')
      .delete()
      .neq('id', 0); // Matches all rows since no id equals 0

    // Method 2: Alternative using .gt() if you have auto-incrementing IDs
    // const { data, error } = await supabase
    //   .from('song_requests')
    //   .delete()
    //   .gt('id', 0);

    if (error) {
      console.error('Cleanup error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Notify all DJs / clients that the list was cleared
    if (req.app.locals.io) {
      req.app.locals.io.emit('song_requests_update', { 
        eventType: 'DELETE',
        action: 'cleanup',
        message: 'All requests cleared'
      });
    }

    console.log('Cleanup successful:', data);
    res.json({ 
      message: 'All song requests deleted.',
      deletedCount: data?.length || 0
    });

  } catch (err) {
    console.error('Cleanup exception:', err);
    res.status(500).json({ error: 'Internal server error during cleanup' });
  }
};
