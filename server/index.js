const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Oda verilerini sakla
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Oda oluştur
  socket.on('create_room', (data) => {
    const { roomCode, playerName, gameMode, wordLength, difficulty } = data;
    
    // Oda oluştur
    const room = {
      code: roomCode,
      host: socket.id,
      players: [{
        id: socket.id,
        name: playerName,
        isReady: true,
        isOnline: true,
        joinedAt: new Date(),
        lastSeen: new Date()
      }],
      gameMode,
      wordLength,
      difficulty,
      status: 'waiting'
    };
    
    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    console.log('Room created:', roomCode);
    socket.emit('room_created', { roomCode });
    socket.emit('room_players', room.players);
  });

  // Odaya katıl
  socket.on('join_room', (data) => {
    const { roomCode, playerName } = data;
    
    if (!rooms.has(roomCode)) {
      socket.emit('room_not_found');
      return;
    }
    
    const room = rooms.get(roomCode);
    
    if (room.players.length >= 2) {
      socket.emit('room_full');
      return;
    }
    
    // Oyuncuyu odaya ekle
    const player = {
      id: socket.id,
      name: playerName,
      isReady: false,
      isOnline: true,
      joinedAt: new Date(),
      lastSeen: new Date()
    };
    
    room.players.push(player);
    socket.join(roomCode);
    
    // Tüm oyunculara güncel listeyi gönder
    io.to(roomCode).emit('room_players', room.players);
    
    // Yeni oyuncu katıldı bildirimi
    io.to(roomCode).emit('player_joined', {
      playerName,
      playerCount: room.players.length
    });
    
    console.log('Player joined room:', roomCode, playerName);
    
    // Oda hazır olduğunda bildir
    if (room.players.length === 2) {
      io.to(roomCode).emit('room_ready');
    }
  });

  // Hazır durumu değiştir
  socket.on('toggle_ready', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.isReady = !player.isReady;
        
        // Tüm oyunculara güncel listeyi gönder
        io.to(roomCode).emit('room_players', room.players);
        
        // Oda hazır olduğunda bildir
        if (room.players.length === 2 && room.players.every(p => p.isReady)) {
          io.to(roomCode).emit('room_ready');
        }
      }
    }
  });

  // Oyunu başlat
  socket.on('start_game', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (room && room.players.length === 2 && room.players.every(p => p.isReady)) {
      room.status = 'playing';
      io.to(roomCode).emit('game_started', { roomCode });
      console.log('Game started in room:', roomCode);
    }
  });

  // Odadan ayrıl
  socket.on('leave_room', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (room) {
      room.players = room.players.filter(p => p.id !== socket.id);
      socket.leave(roomCode);
      
      if (room.players.length === 0) {
        // Oda boşsa sil
        rooms.delete(roomCode);
        console.log('Room deleted:', roomCode);
      } else {
        // Kalan oyunculara güncel listeyi gönder
        io.to(roomCode).emit('room_players', room.players);
        io.to(roomCode).emit('player_left', socket.id);
      }
    }
  });

  // Bağlantı koptu
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Oyuncunun bulunduğu odaları bul ve güncelle
    for (const [roomCode, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(roomCode);
          console.log('Room deleted due to disconnect:', roomCode);
        } else {
          io.to(roomCode).emit('room_players', room.players);
          io.to(roomCode).emit('player_left', socket.id);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
