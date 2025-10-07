import 'dotenv/config'; // ensures .env is loaded
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';

import { supabase } from './config/supabaseClient.js'; // <- import Supabase client

import authRoutes from './routes/authRoutes.js';
import songRoutes from './routes/songRoutes.js';

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*', // restrict in production
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('DJ connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('DJ disconnected:', socket.id);
  });
});

// Optional: attach io to app locals for use in controllers
app.locals.io = io;

// 🔥 Subscribe to song_requests changes (Supabase Realtime)
const channel = supabase
  .channel('song_requests_channel')
  .on(
    'postgres_changes',
    {
      event: '*', // listen to insert, update, delete
      schema: 'public',
      table: 'song_requests',
    },
    (payload) => {
      console.log('Realtime change received:', payload);

      // Broadcast to all connected DJs
      io.emit('song_requests_update', payload);
    }
  )
  .subscribe();

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
