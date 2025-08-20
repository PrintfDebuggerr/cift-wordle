// Oyun temel tipleri
export type GameMode = 'turn-based' | 'duel'
export type GameStatus = 'waiting' | 'playing' | 'finished' | 'paused'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type LetterStatus = 'correct' | 'present' | 'absent' | 'unused'

// Oyuncu tipi
export interface Player {
  id: string
  name: string
  avatar?: string
  isReady: boolean
  isOnline: boolean
  joinedAt: Date
  lastSeen: Date
}

// Harf sonucu tipi
export interface LetterResult {
  letter: string
  status: LetterStatus
  position: number
}

// Tahmin tipi
export interface Guess {
  id: number
  word: string
  result: LetterResult[]
  playerId: string
  position: number
  timestamp: number
}

// Oyun durumu tipi
export interface GameState {
  // Oda bilgileri
  roomId?: string
  roomCode?: string
  players: Player[]
  
  // Oyun durumu
  gameId?: string
  mode: GameMode | null
  status: GameStatus
  currentTurn?: string
  
  // Oyun ayarları
  wordLength: number
  maxGuesses: number
  difficulty: Difficulty
  timeLimit: number
  
  // Tahmin verileri
  guesses: Record<string, Guess[]> // playerId -> guesses
  currentGuess: string
  targetWords: Record<string, string> // playerId -> word
  
  // Klavye durumu
  keyboardState: Record<string, LetterStatus>
  
  // UI durumu
  isLoading: boolean
  error?: string
  isFlipping: boolean
  showResults: boolean
  
  // Zamanlayıcı
  timeRemaining: number
  gameStartTime?: number
  
  // Chat
  chatMessages: ChatMessage[]
  
  // Ses ve efektler
  soundEnabled: boolean
  hapticEnabled: boolean
}

// Chat mesaj tipi
export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: number
  type?: 'text' | 'emoji' | 'reaction' | 'system'
}

// Oda oluşturma konfigürasyonu
export interface CreateRoomConfig {
  playerName: string
  gameMode: GameMode
  wordLength: 4 | 5 | 6
  difficulty: Difficulty
  timeLimit?: number
  maxGuesses?: number
}

// Odaya katılma konfigürasyonu
export interface JoinRoomConfig {
  roomCode: string
  playerName: string
}

// Oyun sonucu tipi
export interface GameResult {
  winnerId?: string
  reason: 'correct-guess' | 'time-out' | 'forfeit'
  targetWords: Record<string, string>
  duration: number
  guesses: Record<string, Guess[]>
  finalScores?: Record<string, number>
}

// Başarım tipi
export interface Achievement {
  id: string
  key: string
  name: string
  description: string
  icon: string
  condition: (stats: PlayerStats, gameData: GameResult) => boolean
  reward: number
}

// Oyuncu istatistikleri tipi
export interface PlayerStats {
  totalGames: number
  gamesWon: number
  gamesLost: number
  winRate: number
  averageGuesses: number
  averageTime: number
  currentStreak: number
  maxStreak: number
  totalScore: number
  level: number
  experience: number
  turnBasedWins: number
  turnBasedGames: number
  duelWins: number
  duelGames: number
}

// Socket event tipleri
export interface ClientEvents {
  'create-room': CreateRoomConfig
  'join-room': JoinRoomConfig
  'player-ready': { roomCode: string }
  'make-guess': { roomCode: string; guess: string }
  'send-message': { roomCode: string; message: string }
  'leave-room': void
}

export interface ServerEvents {
  'room-created': {
    roomId: string
    roomCode: string
    room: any
  }
  'player-joined': {
    room: any
    newPlayer: Player
  }
  'player-ready-updated': {
    playerId: string
    room: any
  }
  'player-disconnected': {
    playerId: string
    playerName: string
  }
  'game-started': {
    gameId: string
    mode: GameMode
    targetWords: Record<string, string>
    currentTurn?: string
    timeLimit: number
  }
  'guess-result': {
    playerId: string
    guess: string
    result: LetterResult[]
    isCorrect: boolean
    position: number
  }
  'turn-changed': {
    currentPlayer: string
    nextPlayerName: string
  }
  'game-ended': GameResult
  'chat-message': ChatMessage
  'error': { message: string }
}

// Kelime filtre tipi
export interface WordFilter {
  length?: number
  difficulty?: Difficulty
  category?: string
  excludeWords?: string[]
}

// Kelime ipucu tipi
export interface WordHint {
  category?: string
  firstLetter?: string
  length: number
  meaning?: string
}
