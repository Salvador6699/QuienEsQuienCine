import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { tmdbService } from './services/tmdbService.js';
import { geminiReferee } from './services/geminiReferee.js';
import { roomManager } from './services/roomManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'CineClue',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    hasGeminiKey: Boolean(geminiReferee.apiKey),
    hasTmdbKey: Boolean(tmdbService.apiKey),
    modelName: geminiReferee.modelName
  });
});

app.post('/api/config', (req, res) => {
  const { geminiApiKey, tmdbApiKey, modelName } = req.body;
  if (geminiApiKey !== undefined) geminiReferee.setApiKey(geminiApiKey);
  if (tmdbApiKey !== undefined) tmdbService.setApiKey(tmdbApiKey);
  if (modelName) geminiReferee.setModelName(modelName);

  res.json({
    success: true,
    hasGeminiKey: Boolean(geminiReferee.apiKey),
    hasTmdbKey: Boolean(tmdbService.apiKey),
    modelName: geminiReferee.modelName
  });
});

app.get('/api/tmdb/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const results = await tmdbService.searchMovies(q);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tmdb/movie/:id', async (req, res) => {
  try {
    const movie = await tmdbService.getMovieDetails(req.params.id);
    res.json({ movie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/referee/test', async (req, res) => {
  try {
    const { movie, question } = req.body;
    const verdict = await geminiReferee.arbitrate(movie, question);
    res.json({ verdict });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build in production
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) next();
  });
});

// Helper to broadcast sanitized state to each player in room
function broadcastRoomState(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  for (const player of room.players) {
    const sanitized = roomManager.getSanitizedRoom(room, player.id);
    io.to(player.id).emit('room:updated', sanitized);
  }
}

// Socket.io Realtime Events
io.on('connection', socket => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Create room
  socket.on('room:create', (hostData, callback) => {
    try {
      const room = roomManager.createRoom(hostData, socket.id);
      socket.join(room.code);
      const sanitized = roomManager.getSanitizedRoom(room, socket.id);
      if (typeof callback === 'function') {
        callback({ success: true, room: sanitized, code: room.code });
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Join room
  socket.on('room:join', ({ code, player }, callback) => {
    try {
      const room = roomManager.joinRoom(code, player, socket.id);
      socket.join(room.code);
      broadcastRoomState(room.code);
      if (typeof callback === 'function') {
        callback({ success: true, room: roomManager.getSanitizedRoom(room, socket.id) });
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Start Selection phase
  socket.on('room:start-selection', ({ code }, callback) => {
    try {
      const room = roomManager.startSelection(code, socket.id);
      broadcastRoomState(room.code);
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Set Secret Movie
  socket.on('room:set-movie', ({ code, movieDetails }, callback) => {
    try {
      const room = roomManager.setSecretMovie(code, socket.id, movieDetails);
      broadcastRoomState(room.code);
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Ask Question
  socket.on('game:ask-question', async ({ code, targetId, question }, callback) => {
    try {
      const room = roomManager.getRoom(code);
      if (!room) throw new Error('Sala no encontrada');

      // Notify clients that Gemini is deliberating (UI clapperboard animation)
      io.to(room.code).emit('game:referee-thinking', {
        askerId: socket.id,
        question
      });

      const { historyItem } = await roomManager.askQuestion(code, socket.id, targetId, question);

      // Emit new answer event and updated room
      io.to(room.code).emit('game:new-verdict', historyItem);
      broadcastRoomState(room.code);

      if (typeof callback === 'function') callback({ success: true, historyItem });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Guess Movie
  socket.on('game:guess-movie', ({ code, targetId, guessedTitle }, callback) => {
    try {
      const { room, logEntry, isCorrect } = roomManager.guessMovie(code, socket.id, targetId, guessedTitle);

      io.to(room.code).emit('game:guess-result', logEntry);
      broadcastRoomState(room.code);

      if (typeof callback === 'function') callback({ success: true, isCorrect, logEntry });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Chat message
  socket.on('room:send-chat', ({ code, text }) => {
    const message = roomManager.addMessage(code, socket.id, text);
    if (message) {
      io.to(code.toUpperCase()).emit('room:new-message', message);
    }
  });

  // Restart room
  socket.on('room:restart', ({ code }, callback) => {
    try {
      const room = roomManager.restartRoom(code, socket.id);
      broadcastRoomState(room.code);
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    const updatedRoom = roomManager.removePlayer(socket.id);
    if (updatedRoom) {
      broadcastRoomState(updatedRoom.code);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎬 CineClue Server running on port ${PORT}`);
  console.log(`👉 TMDB key set: ${Boolean(tmdbService.apiKey)}`);
  console.log(`👉 Gemini key set: ${Boolean(geminiReferee.apiKey)}`);
});
