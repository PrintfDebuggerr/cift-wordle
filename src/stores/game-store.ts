import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { 
  GameState, 
  Player, 
  Guess, 
  LetterResult, 
  GameMode, 
  Difficulty,
  ChatMessage 
} from '@/types/game'

export interface GameActions {
  // Oda işlemleri
  setRoomData: (roomId: string, roomCode: string) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayerReady: (playerId: string, isReady: boolean) => void
  
  // Oyun işlemleri
  startGame: (gameData: {
    gameId: string
    mode: GameMode
    targetWords: Record<string, string>
    currentTurn?: string
  }) => void
  
  // Tahmin işlemleri
  updateCurrentGuess: (guess: string) => void
  addGuess: (playerId: string, guess: Guess) => void
  evaluateGuess: (playerId: string, guess: string, result: LetterResult[]) => void
  
  // Klavye işlemleri
  updateKeyboard: (result: LetterResult[]) => void
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
  addChatMessage: (message: Omit<ChatMessage, 'id'>) => void
  
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

