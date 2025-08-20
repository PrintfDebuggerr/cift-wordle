const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Production'da frontend URL'ini belirtin
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (production'da database kullanın)
const rooms = new Map();
const players = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create room
  socket.on('create_room', (data) => {
    const { roomCode, playerName, gameMode = 'turn_based' } = data;
    
    if (rooms.has(roomCode)) {
      socket.emit('room_error', { message: 'Room already exists' });
      return;
    }

    const room = {
      id: roomCode,
      code: roomCode,
      players: [{
        id: socket.id,
        name: playerName,
        isHost: true,
        isReady: false,
        score: 0
      }],
      gameMode,
      status: 'waiting',
      currentTurn: null,
      targetWord: null,
      gameStartTime: null,
      createdAt: new Date()
    };

    rooms.set(roomCode, room);
    players.set(socket.id, { roomCode, playerName });
    
    socket.join(roomCode);
    socket.emit('room_created', { room });
    console.log(`Room created: ${roomCode} by ${playerName}`);
  });

  // Join room
  socket.on('join_room', (data) => {
    const { roomCode, playerName } = data;
    
    if (!rooms.has(roomCode)) {
      socket.emit('room_error', { message: 'Room not found' });
      return;
    }

    const room = rooms.get(roomCode);
    
    if (room.players.length >= 2) {
      socket.emit('room_error', { message: 'Room is full' });
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('room_error', { message: 'Game already started' });
      return;
    }

    // Add player to room
    const newPlayer = {
      id: socket.id,
      name: playerName,
      isHost: false,
      isReady: false,
      score: 0
    };

    room.players.push(newPlayer);
    players.set(socket.id, { roomCode, playerName });
    
    socket.join(roomCode);
    
    // Notify all players in room
    io.to(roomCode).emit('player_joined', { 
      player: newPlayer, 
      room,
      message: `${playerName} joined the room!`
    });

    // Check if room is ready
    if (room.players.length === 2) {
      io.to(roomCode).emit('room_ready', { room });
    }

    console.log(`Player ${playerName} joined room: ${roomCode}`);
  });

  // Player ready
  socket.on('player_ready', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.isReady = true;
      
      // Check if all players are ready
      const allReady = room.players.every(p => p.isReady);
      if (allReady && room.players.length === 2) {
        io.to(roomCode).emit('can_start_game', { room });
      }
    }
  });

  // Start game
  socket.on('start_game', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (!room || room.players.length !== 2) return;

    // Generate target word (basit örnek)
    const words = ['ELMA', 'KALEM', 'KITAP', 'BILGISAYAR', 'TELEFON'];
    room.targetWord = words[Math.floor(Math.random() * words.length)];
    room.status = 'playing';
    room.gameStartTime = new Date();
    room.currentTurn = room.players[0].id; // Host starts

    io.to(roomCode).emit('game_started', { 
      room,
      targetWord: room.targetWord,
      currentTurn: room.currentTurn
    });

    console.log(`Game started in room: ${roomCode}, word: ${room.targetWord}`);
  });

  // Make guess
  socket.on('make_guess', (data) => {
    const { roomCode, guess, playerId } = data;
    const room = rooms.get(roomCode);
    
    if (!room || room.status !== 'playing') return;
    if (room.currentTurn !== playerId) return;

    // Simple guess evaluation (production'da daha gelişmiş olmalı)
    const isCorrect = guess.toUpperCase() === room.targetWord;
    
    if (isCorrect) {
      // Game won
      const winner = room.players.find(p => p.id === playerId);
      winner.score += 100;
      room.status = 'finished';
      
      io.to(roomCode).emit('game_finished', {
        winner: winner,
        room: room,
        message: `${winner.name} won the game!`
      });
    } else {
      // Switch turn
      const currentPlayerIndex = room.players.findIndex(p => p.id === room.currentTurn);
      const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
      room.currentTurn = room.players[nextPlayerIndex].id;
      
      io.to(roomCode).emit('turn_changed', {
        currentTurn: room.currentTurn,
        guess: guess,
        isCorrect: false
      });
    }
  });

  // Chat message
  socket.on('send_message', (data) => {
    const { roomCode, message, playerName } = data;
    
    io.to(roomCode).emit('new_message', {
      id: Date.now(),
      playerName,
      message,
      timestamp: new Date()
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const room = rooms.get(playerInfo.roomCode);
      if (room) {
        // Remove player from room
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
          // Delete empty room
          rooms.delete(playerInfo.roomCode);
          console.log(`Room deleted: ${playerInfo.roomCode}`);
        } else {
          // Notify remaining players
          io.to(playerInfo.roomCode).emit('player_left', {
            playerName: playerInfo.playerName,
            room: room
          });
        }
      }
      
      players.delete(socket.id);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    players: players.size
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Çift Wordle Backend Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Get port from environment or use default
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
