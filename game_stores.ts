// stores/game-store.ts
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface Player {
  id: string
  name: string
  avatar?: string
  isReady: boolean
  isOnline: boolean
}

export interface GuessResult {
  letter: string
  status: 'correct' | 'present' | 'absent'
  position: number
}

export interface Guess {
  id: number
  word: string
  result: GuessResult[]
  playerId: string
  position: number
  timestamp: number
}

export interface GameState {
  // Oda bilgileri
  roomId?: string
  roomCode?: string
  players: Player[]
  
  // Oyun durumu
  gameId?: string
  mode: 'turn-based' | 'duel' | null
  status: 'waiting' | 'playing' | 'finished'
  currentTurn?: string
  
  // Oyun ayarları
  wordLength: number
  maxGuesses: number
  difficulty: 'easy' | 'normal' | 'hard'
  timeLimit: number
  
  // Tahmin verileri
  guesses: Record<string, Guess[]> // playerId -> guesses
  currentGuess: string
  targetWords: Record<string, string> // playerId -> word (sadece duel modunda kendi kelimen)
  
  // Klavye durumu
  keyboardState: Record<string, 'correct' | 'present' | 'absent' | 'unused'>
  
  // UI durumu
  isLoading: boolean
  error?: string
  isFlipping: boolean
  showResults: boolean
  
  // Zamanlayıcı
  timeRemaining: number
  gameStartTime?: number
  
  // Chat
  chatMessages: Array<{
    id: string
    playerId: string
    playerName: string
    message: string
    timestamp: number
  }>
  
  // Ses ve efektler
  soundEnabled: boolean
  hapticEnabled: boolean
}

export interface GameActions {
  // Oda işlemleri
  setRoomData: (roomId: string, roomCode: string) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayerReady: (playerId: string, isReady: boolean) => void
  
  // Oyun işlemleri
  startGame: (gameData: {
    gameId: string
    mode: 'turn-based' | 'duel'
    targetWords: Record<string, string>
    currentTurn?: string
  }) => void
  
  // Tahmin işlemleri
  updateCurrentGuess: (guess: string) => void
  addGuess: (playerId: string, guess: Guess) => void
  evaluateGuess: (playerId: string, guess: string, result: GuessResult[]) => void
  
  // Klavye işlemleri
  updateKeyboard: (result: GuessResult[]) => void
  resetKeyboard: () => void
  
  // Sıra işlemleri
  changeTurn: (nextPlayerId: string) => void
  
  // Oyun sonu
  endGame: (winnerId?: string, targetWords?: Record<string, string>) => void
  
  // UI işlemleri
  setLoading: (loading: boolean) => void
  setError: (error?: string) => void
  setFlipping: (flipping: boolean) => void
  setShowResults: (show: boolean) => void
  
  // Zamanlayıcı
  setTimeRemaining: (time: number) => void
  startTimer: () => void
  stopTimer: () => void
  
  // Chat
  addChatMessage: (message: {
    playerId: string
    playerName: string
    message: string
    timestamp: number
  }) => void
  
  // Ayarlar
  toggleSound: () => void
  toggleHaptic: () => void
  
  // Reset
  resetGame: () => void
  resetRoom: () => void
}

type GameStore = GameState & GameActions

const initialState: GameState = {
  players: [],
  mode: null,
  status: 'waiting',
  wordLength: 5,
  maxGuesses: 6,
  difficulty: 'normal',
  timeLimit: 300,
  guesses: {},
  currentGuess: '',
  targetWords: {},
  keyboardState: {},
  isLoading: false,
  isFlipping: false,
  showResults: false,
  timeRemaining: 300,
  chatMessages: [],
  soundEnabled: true,
  hapticEnabled: true
}

export const useGameStore = create<GameStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,
        
        // Oda işlemleri
        setRoomData: (roomId, roomCode) =>
          set((state) => {
            state.roomId = roomId
            state.roomCode = roomCode
          }),
        
        addPlayer: (player) =>
          set((state) => {
            const existingIndex = state.players.findIndex(p => p.id === player.id)
            if (existingIndex >= 0) {
              state.players[existingIndex] = player
            } else {
              state.players.push(player)
            }
          }),
        
        removePlayer: (playerId) =>
          set((state) => {
            state.players = state.players.filter(p => p.id !== playerId)
            delete state.guesses[playerId]
            delete state.targetWords[playerId]
          }),
        
        updatePlayerReady: (playerId, isReady) =>
          set((state) => {
            const player = state.players.find(p => p.id === playerId)
            if (player) {
              player.isReady = isReady
            }
          }),
        
        // Oyun işlemleri
        startGame: (gameData) =>
          set((state) => {
            state.gameId = gameData.gameId
            state.mode = gameData.mode
            state.status = 'playing'
            state.targetWords = gameData.targetWords
            state.currentTurn = gameData.currentTurn
            state.gameStartTime = Date.now()
            state.timeRemaining = state.timeLimit
            state.guesses = {}
            state.keyboardState = {}
            state.currentGuess = ''
            state.showResults = false
          }),
        
        // Tahmin işlemleri
        updateCurrentGuess: (guess) =>
          set((state) => {
            if (guess.length <= state.wordLength) {
              state.currentGuess = guess.toUpperCase()
            }
          }),
        
        addGuess: (playerId, guess) =>
          set((state) => {
            if (!state.guesses[playerId]) {
              state.guesses[playerId] = []
            }
            state.guesses[playerId].push(guess)
          }),
        
        evaluateGuess: (playerId, guess, result) =>
          set((state) => {
            // Tahmini ekle
            const newGuess: Guess = {
              id: Date.now(),
              word: guess,
              result,
              playerId,
              position: (state.guesses[playerId]?.length || 0) + 1,
              timestamp: Date.now()
            }
            
            if (!state.guesses[playerId]) {
              state.guesses[playerId] = []
            }
            state.guesses[playerId].push(newGuess)
            
            // Klavye durumunu güncelle
            result.forEach(({ letter, status }) => {
              const key = letter.toLowerCase()
              const currentStatus = state.keyboardState[key] || 'unused'
              
              // Priority: correct > present > absent > unused
              if (currentStatus === 'unused' || 
                  (currentStatus === 'absent' && status !== 'absent') ||
                  (currentStatus === 'present' && status === 'correct')) {
                state.keyboardState[key] = status
              }
            })
            
            // Mevcut tahmini temizle
            state.currentGuess = ''
          }),
        
        updateKeyboard: (result) =>
          set((state) => {
            result.forEach(({ letter, status }) => {
              const key = letter.toLowerCase()
              const currentStatus = state.keyboardState[key] || 'unused'
              
              if (currentStatus === 'unused' || 
                  (currentStatus === 'absent' && status !== 'absent') ||
                  (currentStatus === 'present' && status === 'correct')) {
                state.keyboardState[key] = status
              }
            })
          }),
        
        resetKeyboard: () =>
          set((state) => {
            state.keyboardState = {}
          }),
        
        // Sıra işlemleri
        changeTurn: (nextPlayerId) =>
          set((state) => {
            state.currentTurn = nextPlayerId
          }),
        
        // Oyun sonu
        endGame: (winnerId, targetWords) =>
          set((state) => {
            state.status = 'finished'
            state.showResults = true
            if (targetWords) {
              state.targetWords = { ...state.targetWords, ...targetWords }
            }
          }),
        
        // UI işlemleri
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),
        
        setError: (error) =>
          set((state) => {
            state.error = error
          }),
        
        setFlipping: (flipping) =>
          set((state) => {
            state.isFlipping = flipping
          }),
        
        setShowResults: (show) =>
          set((state) => {
            state.showResults = show
          }),
        
        // Zamanlayıcı
        setTimeRemaining: (time) =>
          set((state) => {
            state.timeRemaining = time
          }),
        
        startTimer: () => {
          const interval = setInterval(() => {
            const currentState = get()
            if (currentState.timeRemaining > 0 && currentState.status === 'playing') {
              set((state) => {
                state.timeRemaining = Math.max(0, state.timeRemaining - 1)
              })
            } else {
              clearInterval(interval)
            }
          }, 1000)
        },
        
        stopTimer: () =>
          set((state) => {
            // Timer durdurmak için sadece state güncelleniyor
            // Gerçek interval cleanup component'te yapılacak
          }),
        
        // Chat
        addChatMessage: (message) =>
          set((state) => {
            state.chatMessages.push({
              id: `${message.playerId}-${message.timestamp}`,
              ...message
            })
            
            // Son 50 mesajı tut
            if (state.chatMessages.length > 50) {
              state.chatMessages = state.chatMessages.slice(-50)
            }
          }),
        
        // Ayarlar
        toggleSound: () =>
          set((state) => {
            state.soundEnabled = !state.soundEnabled
          }),
        
        toggleHaptic: () =>
          set((state) => {
            state.hapticEnabled = !state.hapticEnabled
          }),
        
        // Reset
        resetGame: () =>
          set((state) => {
            state.gameId = undefined
            state.mode = null
            state.status = 'waiting'
            state.currentTurn = undefined
            state.guesses = {}
            state.currentGuess = ''
            state.targetWords = {}
            state.keyboardState = {}
            state.isFlipping = false
            state.showResults = false
            state.timeRemaining = state.timeLimit
            state.gameStartTime = undefined
            state.error = undefined
          }),
        
        resetRoom: () =>
          set((state) => {
            Object.assign(state, initialState)
          })
      }))
    ),
    { name: 'game-store' }
  )
)

// stores/socket-store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { io, Socket } from 'socket.io-client'

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  connectionError?: string
}

interface SocketActions {
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: any) => void
}

type SocketStore = SocketState & SocketActions

export const useSocketStore = create<SocketStore>()(
  devtools(
    (set, get) => ({
      socket: null,
      isConnected: false,
      connectionError: undefined,
      
      connect: () => {
        const socket = io(process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_SOCKET_URL || '' 
          : 'http://localhost:3000', {
          path: '/api/socket'
        })
        
        socket.on('connect', () => {
          set({ isConnected: true, connectionError: undefined })
        })
        
        socket.on('disconnect', () => {
          set({ isConnected: false })
        })
        
        socket.on('connect_error', (error) => {
          set({ connectionError: error.message })
        })
        
        set({ socket })
      },
      
      disconnect: () => {
        const { socket } = get()
        if (socket) {
          socket.disconnect()
          set({ socket: null, isConnected: false })
        }
      },
      
      emit: (event, data) => {
        const { socket } = get()
        if (socket && socket.connected) {
          socket.emit(event, data)
        }
      }
    }),
    { name: 'socket-store' }
  )
)

// hooks/use-game-socket.ts
import { useEffect } from 'react'
import { useSocketStore } from '@/stores/socket-store'
import { useGameStore } from '@/stores/game-store'

export function useGameSocket() {
  const { socket, connect, disconnect } = useSocketStore()
  const gameStore = useGameStore()
  
  useEffect(() => {
    // Socket bağlantısını başlat
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])
  
  useEffect(() => {
    if (!socket) return
    
    // Room events
    socket.on('room-created', (data) => {
      gameStore.setRoomData(data.roomId, data.roomCode)
      if (data.room.players[0]) {
        gameStore.addPlayer(data.room.players[0])
      }
    })
    
    socket.on('player-joined', (data) => {
      if (data.room.players) {
        data.room.players.forEach((player: any) => {
          gameStore.addPlayer(player)
        })
      }
    })
    
    socket.on('player-ready-updated', (data) => {
      gameStore.updatePlayerReady(data.playerId, true)
    })
    
    socket.on('player-disconnected', (data) => {
      gameStore.removePlayer(data.playerId)
    })
    
    // Game events
    socket.on('game-started', (data) => {
      gameStore.startGame({
        gameId: data.gameId,
        mode: data.mode,
        targetWords: data.targetWords,
        currentTurn: data.currentTurn
      })
      gameStore.startTimer()
    })
    
    socket.on('guess-result', (data) => {
      gameStore.evaluateGuess(data.playerId, data.guess, data.result)
      
      if (data.isCorrect) {
        gameStore.setFlipping(true)
        setTimeout(() => {
          gameStore.setFlipping(false)
        }, 600)
      }
    })
    
    socket.on('turn-changed', (data) => {
      gameStore.changeTurn(data.currentPlayer)
    })
    
    socket.on('game-ended', (data) => {
      gameStore.endGame(data.winnerId, data.targetWords)
      gameStore.stopTimer()
    })
    
    socket.on('invalid-word', (data) => {
      gameStore.setError('Geçersiz kelime!')
      setTimeout(() => {
        gameStore.setError(undefined)
      }, 3000)
    })
    
    // Chat events
    socket.on('chat-message', (data) => {
      gameStore.addChatMessage(data)
    })
    
    socket.on('error', (data) => {
      gameStore.setError(data.message)
      setTimeout(() => {
        gameStore.setError(undefined)
      }, 5000)
    })
    
    return () => {
      socket.off('room-created')
      socket.off('player-joined')
      socket.off('player-ready-updated')
      socket.off('player-disconnected')
      socket.off('game-started')
      socket.off('guess-result')
      socket.off('turn-changed')
      socket.off('game-ended')
      socket.off('invalid-word')
      socket.off('chat-message')
      socket.off('error')
    }
  }, [socket, gameStore])
  
  return { socket, isConnected: socket?.connected || false }
}

// hooks/use-game-actions.ts
import { useCallback } from 'react'
import { useSocketStore } from '@/stores/socket-store'
import { useGameStore } from '@/stores/game-store'

export function useGameActions() {
  const { emit } = useSocketStore()
  const gameStore = useGameStore()
  
  const createRoom = useCallback((data: {
    playerName: string
    gameMode: 'turn-based' | 'duel'
    wordLength: number
    difficulty: string
  }) => {
    gameStore.setLoading(true)
    emit('create-room', data)
  }, [emit, gameStore])
  
  const joinRoom = useCallback((data: {
    roomCode: string
    playerName: string
  }) => {
    gameStore.setLoading(true)
    emit('join-room', data)
  }, [emit, gameStore])
  
  const setPlayerReady = useCallback(() => {
    const roomCode = gameStore.roomCode
    if (roomCode) {
      emit('player-ready', { roomCode })
    }
  }, [emit, gameStore.roomCode])
  
  const makeGuess = useCallback((guess: string) => {
    const roomCode = gameStore.roomCode
    if (roomCode && guess.length === gameStore.wordLength) {
      gameStore.setFlipping(true)
      emit('make-guess', { roomCode, guess })
      
      // Flip animasyonunu 600ms sonra kapat
      setTimeout(() => {
        gameStore.setFlipping(false)
      }, 600)
    }
  }, [emit, gameStore.roomCode, gameStore.wordLength, gameStore])
  
  const sendMessage = useCallback((message: string) => {
    const roomCode = gameStore.roomCode
    if (roomCode && message.trim()) {
      emit('send-message', { roomCode, message: message.trim() })
    }
  }, [emit, gameStore.roomCode])
  
  const leaveRoom = useCallback(() => {
    gameStore.resetRoom()
  }, [gameStore])
  
  return {
    createRoom,
    joinRoom,
    setPlayerReady,
    makeGuess,
    sendMessage,
    leaveRoom
  }
}