// lib/socket/server.ts
import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SocketServer extends NetServer {
  io?: SocketIOServer
}

export interface SocketNextApiResponse extends NextApiResponse {
  socket: {
    server: SocketServer
  }
}

// Socket.io server setup
export function initializeSocket(server: NetServer) {
  if (!server.io) {
    console.log('Initializing Socket.io server...')
    
    const io = new SocketIOServer(server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })

    server.io = io
    setupSocketHandlers(io)
  }
  
  return server.io
}

// Socket event handlers
function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)
    
    // Oda oluşturma
    socket.on('create-room', async (data: {
      playerName: string
      gameMode: 'turn-based' | 'duel'
      wordLength: number
      difficulty: string
    }) => {
      try {
        const roomCode = generateRoomCode()
        
        // Veritabanında oda oluştur
        const room = await prisma.room.create({
          data: {
            code: roomCode,
            mode: data.gameMode,
            wordLength: data.wordLength,
            difficulty: data.difficulty,
            players: {
              create: {
                id: socket.id,
                name: data.playerName,
                isReady: false
              }
            }
          },
          include: { players: true }
        })
        
        // Socket'i oda kanalına ekle
        socket.join(roomCode)
        
        socket.emit('room-created', {
          roomId: room.id,
          roomCode: room.code,
          room: room
        })
        
      } catch (error) {
        socket.emit('error', { message: 'Oda oluşturulamadı' })
      }
    })
    
    // Odaya katılma
    socket.on('join-room', async (data: {
      roomCode: string
      playerName: string
    }) => {
      try {
        const room = await prisma.room.findUnique({
          where: { code: data.roomCode },
          include: { players: true }
        })
        
        if (!room) {
          socket.emit('error', { message: 'Oda bulunamadı' })
          return
        }
        
        if (room.players.length >= 2) {
          socket.emit('error', { message: 'Oda dolu' })
          return
        }
        
        if (room.status !== 'waiting') {
          socket.emit('error', { message: 'Oyun devam ediyor' })
          return
        }
        
        // Oyuncuyu odaya ekle
        await prisma.player.create({
          data: {
            id: socket.id,
            name: data.playerName,
            roomId: room.id,
            isReady: false
          }
        })
        
        // Socket'i oda kanalına ekle
        socket.join(data.roomCode)
        
        // Güncel oda bilgisini al
        const updatedRoom = await prisma.room.findUnique({
          where: { id: room.id },
          include: { players: true }
        })
        
        // Tüm oyunculara bildir
        io.to(data.roomCode).emit('player-joined', {
          room: updatedRoom,
          newPlayer: { id: socket.id, name: data.playerName }
        })
        
      } catch (error) {
        socket.emit('error', { message: 'Odaya katılınamadı' })
      }
    })
    
    // Oyuncu hazır
    socket.on('player-ready', async (data: { roomCode: string }) => {
      try {
        await prisma.player.update({
          where: { id: socket.id },
          data: { isReady: true }
        })
        
        const room = await prisma.room.findUnique({
          where: { code: data.roomCode },
          include: { players: true }
        })
        
        if (room) {
          io.to(data.roomCode).emit('player-ready-updated', {
            playerId: socket.id,
            room: room
          })
          
          // Her iki oyuncu da hazırsa oyunu başlat
          if (room.players.length === 2 && room.players.every(p => p.isReady)) {
            await startGame(room.id, data.roomCode, io)
          }
        }
        
      } catch (error) {
        socket.emit('error', { message: 'Hazır durumu güncellenemedi' })
      }
    })
    
    // Tahmin yapma
    socket.on('make-guess', async (data: {
      roomCode: string
      guess: string
    }) => {
      try {
        await handleGuess(socket.id, data.roomCode, data.guess, io)
      } catch (error) {
        socket.emit('error', { message: 'Tahmin işlenemedi' })
      }
    })
    
    // Chat mesajı
    socket.on('send-message', async (data: {
      roomCode: string
      message: string
    }) => {
      try {
        const player = await prisma.player.findUnique({
          where: { id: socket.id }
        })
        
        if (player) {
          io.to(data.roomCode).emit('chat-message', {
            playerId: socket.id,
            playerName: player.name,
            message: data.message,
            timestamp: Date.now()
          })
        }
      } catch (error) {
        console.error('Chat message error:', error)
      }
    })
    
    // Bağlantı kopma
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`)
      
      try {
        const player = await prisma.player.findUnique({
          where: { id: socket.id },
          include: { room: true }
        })
        
        if (player?.room) {
          // Diğer oyuncuya bildir
          socket.to(player.room.code).emit('player-disconnected', {
            playerId: socket.id,
            playerName: player.name
          })
          
          // 30 saniye reconnect timeout başlat
          setTimeout(async () => {
            try {
              const stillDisconnected = await prisma.player.findUnique({
                where: { id: socket.id }
              })
              
              if (stillDisconnected) {
                await cleanupDisconnectedPlayer(socket.id)
              }
            } catch (error) {
              console.error('Cleanup error:', error)
            }
          }, 30000)
        }
      } catch (error) {
        console.error('Disconnect handling error:', error)
      }
    })
  })
}

// Yardımcı fonksiyonlar
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function startGame(roomId: string, roomCode: string, io: SocketIOServer) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { players: true }
    })
    
    if (!room || room.players.length !== 2) return
    
    // Hedef kelimeleri seç
    const { getRandomWord } = await import('../database/words')
    const targetWords: Record<string, string> = {}
    
    if (room.mode === 'duel') {
      // Duel modunda her oyuncunun farklı kelimesi
      for (const player of room.players) {
        targetWords[player.id] = await getRandomWord({
          length: room.wordLength,
          difficulty: room.difficulty
        })
      }
    } else {
      // Turn-based modunda aynı kelime
      const word = await getRandomWord({
        length: room.wordLength,
        difficulty: room.difficulty
      })
      room.players.forEach(player => {
        targetWords[player.id] = word
      })
    }
    
    // Oyun kaydı oluştur
    const game = await prisma.game.create({
      data: {
        roomId: room.id,
        mode: room.mode,
        targetWords: targetWords
      }
    })
    
    // Oda durumunu güncelle
    await prisma.room.update({
      where: { id: roomId },
      data: { 
        status: 'playing',
        targetWords: targetWords
      }
    })
    
    // Oyunu başlat
    io.to(roomCode).emit('game-started', {
      gameId: game.id,
      mode: room.mode,
      targetWords: room.mode === 'duel' ? targetWords : { shared: targetWords[room.players[0].id] },
      currentTurn: room.mode === 'turn-based' ? room.players[0].id : null,
      timeLimit: room.timeLimit
    })
    
  } catch (error) {
    console.error('Start game error:', error)
  }
}

async function handleGuess(
  playerId: string, 
  roomCode: string, 
  guess: string, 
  io: SocketIOServer
) {
  const { validateWord, evaluateGuess } = await import('../database/words')
  const { updateKeyboardState } = await import('../game/word-evaluation')
  
  // Kelime doğrulaması
  const isValidWord = await validateWord(guess)
  if (!isValidWord) {
    io.to(playerId).emit('invalid-word', { guess })
    return
  }
  
  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: { players: true, games: { orderBy: { startedAt: 'desc' }, take: 1 } }
  })
  
  if (!room || !room.games[0]) return
  
  const game = room.games[0]
  const targetWords = game.targetWords as Record<string, string>
  const targetWord = targetWords[playerId]
  
  if (!targetWord) return
  
  // Tahmini değerlendir
  const evaluation = evaluateGuess(guess, targetWord)
  const isCorrect = guess.toLowerCase() === targetWord.toLowerCase()
  
  // Tahmin kaydını oluştur
  const guessCount = await prisma.guess.count({
    where: { gameId: game.id, playerId }
  })
  
  await prisma.guess.create({
    data: {
      gameId: game.id,
      playerId,
      word: guess,
      position: guessCount + 1,
      result: evaluation
    }
  })
  
  // Sonucu gönder
  io.to(roomCode).emit('guess-result', {
    playerId,
    guess,
    result: evaluation,
    isCorrect,
    position: guessCount + 1
  })
  
  // Kazanma kontrolü
  if (isCorrect) {
    await endGame(game.id, playerId, roomCode, io)
  } else if (room.mode === 'turn-based') {
    // Sırayı değiştir
    const currentPlayerIndex = room.players.findIndex(p => p.id === playerId)
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length
    const nextPlayer = room.players[nextPlayerIndex]
    
    io.to(roomCode).emit('turn-changed', {
      currentPlayer: nextPlayer.id,
      nextPlayerName: nextPlayer.name
    })
  }
}

async function endGame(
  gameId: string, 
  winnerId: string, 
  roomCode: string, 
  io: SocketIOServer
) {
  try {
    const game = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'finished',
        winnerId,
        finishedAt: new Date(),
        duration: Math.floor((Date.now() - new Date(game.startedAt).getTime()) / 1000)
      },
      include: {
        room: { include: { players: true } },
        guesses: true
      }
    })
    
    await prisma.room.update({
      where: { id: game.roomId },
      data: { status: 'finished', finishedAt: new Date() }
    })
    
    const targetWords = game.targetWords as Record<string, string>
    
    io.to(roomCode).emit('game-ended', {
      winnerId,
      targetWords,
      duration: game.duration,
      guesses: game.guesses
    })
    
  } catch (error) {
    console.error('End game error:', error)
  }
}

async function cleanupDisconnectedPlayer(playerId: string) {
  try {
    await prisma.player.delete({
      where: { id: playerId }
    })
  } catch (error) {
    console.error('Player cleanup error:', error)
  }
}

// app/api/socket/route.ts
import { NextRequest } from 'next/server'
import { initializeSocket } from '@/lib/socket/server'

export async function GET(req: NextRequest) {
  // Socket.io server'ı başlat
  const server = (global as any).socketServer || initializeSocket()
  
  return new Response('Socket.io server running', { status: 200 })
}