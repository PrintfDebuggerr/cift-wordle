'use client';

import { useCallback, useMemo } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useGameSocket } from './use-game-socket';
import { 
  GameMode, 
  Difficulty, 
  LetterStatus, 
  Guess, 
  GameState,
  Player
} from '@/types/game';
import { 
  calculateScore, 
  calculateLetterStatus, 
  isValidTurkishWord,
  triggerHapticFeedback,
  playSoundEffect
} from '@/lib/utils';

export interface UseGameActionsOptions {
  enableHaptics?: boolean;
  enableSounds?: boolean;
  onGameAction?: (action: string, data: any) => void;
}

export interface UseGameActionsReturn {
  // Game setup actions
  createGame: (config: {
    mode: GameMode;
    difficulty: Difficulty;
    wordLength: number;
    timeLimit?: number;
  }) => Promise<void>;
  
  joinGame: (roomCode: string, playerName: string) => Promise<void>;
  leaveGame: () => void;
  startGame: () => void;
  
  // Gameplay actions
  makeGuess: (word: string) => Promise<{
    success: boolean;
    result?: LetterStatus[];
    isCorrect?: boolean;
    error?: string;
  }>;
  
  submitGuess: (word: string) => Promise<boolean>;
  clearGuess: () => void;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  
  // Game state actions
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  restartGame: () => void;
  
  // Player actions
  setPlayerReady: (ready: boolean) => void;
  updatePlayerName: (name: string) => void;
  togglePlayerReady: () => void;
  
  // Chat actions
  sendChatMessage: (message: string) => void;
  
  // Utility actions
  getHint: () => string | null;
  getWordStats: () => {
    totalGuesses: number;
    correctGuesses: number;
    averageScore: number;
  };
  
  // Game state getters
  canMakeGuess: boolean;
  isPlayerTurn: boolean;
  gameStatus: string;
  currentWord: string;
  remainingGuesses: number;
  timeRemaining: number;
}

export function useGameActions(options: UseGameActionsOptions = {}): UseGameActionsReturn {
  const {
    enableHaptics = true,
    enableSounds = true,
    onGameAction
  } = options;

  const {
    gameState,
    players,
    currentPlayer,
    updateGameState,
    updatePlayers,
    addGuess,
    clearGuesses,
    setCurrentPlayer,
    addChatMessage
  } = useGameStore();

  const {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame: socketStartGame,
    makeGuess: socketMakeGuess,
    sendChatMessage: socketSendChatMessage,
    setPlayerReady: socketSetPlayerReady
  } = useGameSocket();

  // Game setup actions
  const createGame = useCallback(async (config: {
    mode: GameMode;
    difficulty: Difficulty;
    wordLength: number;
    timeLimit?: number;
  }) => {
    try {
      await createRoom({
        mode: config.mode,
        difficulty: config.difficulty,
        wordLength: config.wordLength,
        timeLimit: config.timeLimit || 300, // 5 minutes default
        maxPlayers: 2
      });

      // Update local game state
      updateGameState(prev => ({
        ...prev,
        mode: config.mode,
        difficulty: config.difficulty,
        wordLength: config.wordLength,
        timeLimit: config.timeLimit || 300,
        status: 'waiting'
      }));

      onGameAction?.('game_created', config);
      
      if (enableHaptics) {
        triggerHapticFeedback('success');
      }
      
      if (enableSounds) {
        playSoundEffect('game_created');
      }
      
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  }, [createRoom, updateGameState, onGameAction, enableHaptics, enableSounds]);

  const joinGame = useCallback(async (roomCode: string, playerName: string) => {
    try {
      await joinRoom(roomCode, playerName);
      
      // Update local player info
      setCurrentPlayer({
        id: Date.now().toString(), // Temporary ID until server confirms
        name: playerName,
        ready: false,
        score: 0,
        isHost: false
      });

      onGameAction?.('game_joined', { roomCode, playerName });
      
      if (enableHaptics) {
        triggerHapticFeedback('success');
      }
      
      if (enableSounds) {
        playSoundEffect('game_joined');
      }
      
    } catch (error) {
      console.error('Failed to join game:', error);
      throw error;
    }
  }, [joinRoom, setCurrentPlayer, onGameAction, enableHaptics, enableSounds]);

  const leaveGame = useCallback(() => {
    leaveRoom();
    
    // Reset local game state
    updateGameState({
      status: 'idle',
      roomCode: '',
      roomId: '',
      players: [],
      currentPlayerId: '',
      timeRemaining: 0,
      guesses: [],
      winnerId: null,
      mode: 'turn_based',
      difficulty: 'normal',
      wordLength: 5,
      timeLimit: 300
    });
    
    clearGuesses();
    setCurrentPlayer(null);
    
    onGameAction?.('game_left', {});
    
    if (enableHaptics) {
      triggerHapticFeedback('warning');
    }
    
    if (enableSounds) {
      playSoundEffect('game_left');
    }
  }, [leaveRoom, updateGameState, clearGuesses, setCurrentPlayer, onGameAction, enableHaptics, enableSounds]);

  const startGame = useCallback(() => {
    socketStartGame();
    
    // Update local game state
    updateGameState(prev => ({
      ...prev,
      status: 'playing',
      timeRemaining: prev.timeLimit || 300
    }));
    
    onGameAction?.('game_started', {});
    
    if (enableHaptics) {
      triggerHapticFeedback('success');
    }
    
    if (enableSounds) {
      playSoundEffect('game_started');
    }
  }, [socketStartGame, updateGameState, onGameAction, enableHaptics, enableSounds]);

  // Gameplay actions
  const makeGuess = useCallback(async (word: string): Promise<{
    success: boolean;
    result?: LetterStatus[];
    isCorrect?: boolean;
    error?: string;
  }> => {
    try {
      // Validate word
      if (!isValidTurkishWord(word)) {
        return {
          success: false,
          error: 'Geçersiz Türkçe kelime'
        };
      }

      // Check if it's player's turn
      if (!isPlayerTurn) {
        return {
          success: false,
          error: 'Sıra sizde değil'
        };
      }

      // Check if game is active
      if (gameState.status !== 'playing') {
        return {
          success: false,
          error: 'Oyun aktif değil'
        };
      }

      // Send guess to server
      socketMakeGuess(word);
      
      // Add guess to local state
      const guess: Guess = {
        word,
        timestamp: Date.now(),
        playerId: currentPlayer?.id || '',
        result: [] // Will be updated by server response
      };
      
      addGuess(guess);
      
      onGameAction?.('guess_made', { word, guess });
      
      if (enableHaptics) {
        triggerHapticFeedback('medium');
      }
      
      if (enableSounds) {
        playSoundEffect('guess_made');
      }
      
      return {
        success: true,
        result: [],
        isCorrect: false
      };
      
    } catch (error) {
      console.error('Failed to make guess:', error);
      return {
        success: false,
        error: 'Tahmin yapılamadı'
      };
    }
  }, [
    socketMakeGuess, 
    addGuess, 
    onGameAction, 
    enableHaptics, 
    enableSounds,
    isPlayerTurn,
    gameState.status,
    currentPlayer?.id
  ]);

  const submitGuess = useCallback(async (word: string): Promise<boolean> => {
    const result = await makeGuess(word);
    return result.success;
  }, [makeGuess]);

  const clearGuess = useCallback(() => {
    // Clear current guess input
    updateGameState(prev => ({
      ...prev,
      currentGuess: ''
    }));
    
    onGameAction?.('guess_cleared', {});
    
    if (enableHaptics) {
      triggerHapticFeedback('light');
    }
    
    if (enableSounds) {
      playSoundEffect('guess_cleared');
    }
  }, [updateGameState, onGameAction, enableHaptics, enableSounds]);

  const addLetter = useCallback((letter: string) => {
    const currentGuess = gameState.currentGuess || '';
    
    if (currentGuess.length < gameState.wordLength) {
      updateGameState(prev => ({
        ...prev,
        currentGuess: currentGuess + letter
      }));
      
      if (enableHaptics) {
        triggerHapticFeedback('light');
      }
      
      if (enableSounds) {
        playSoundEffect('letter_added');
      }
    }
  }, [gameState.currentGuess, gameState.wordLength, updateGameState, enableHaptics, enableSounds]);

  const removeLetter = useCallback(() => {
    const currentGuess = gameState.currentGuess || '';
    
    if (currentGuess.length > 0) {
      updateGameState(prev => ({
        ...prev,
        currentGuess: currentGuess.slice(0, -1)
      }));
      
      if (enableHaptics) {
        triggerHapticFeedback('light');
      }
      
      if (enableSounds) {
        playSoundEffect('letter_removed');
      }
    }
  }, [gameState.currentGuess, updateGameState, enableHaptics, enableSounds]);

  // Game state actions
  const pauseGame = useCallback(() => {
    updateGameState(prev => ({
      ...prev,
      status: 'paused'
    }));
    
    onGameAction?.('game_paused', {});
    
    if (enableHaptics) {
      triggerHapticFeedback('medium');
    }
    
    if (enableSounds) {
      playSoundEffect('game_paused');
    }
  }, [updateGameState, onGameAction, enableHaptics, enableSounds]);

  const resumeGame = useCallback(() => {
    updateGameState(prev => ({
      ...prev,
      status: 'playing'
    }));
    
    onGameAction?.('game_resumed', {});
    
    if (enableHaptics) {
      triggerHapticFeedback('success');
    }
    
    if (enableSounds) {
      playSoundEffect('game_resumed');
    }
  }, [updateGameState, onGameAction, enableHaptics, enableSounds]);

  const endGame = useCallback(() => {
    updateGameState(prev => ({
      ...prev,
      status: 'finished'
    }));
    
    onGameAction?.('game_ended', {});
    
    if (enableHaptics) {
      triggerHapticFeedback('heavy');
    }
    
    if (enableSounds) {
      playSoundEffect('game_ended');
    }
  }, [updateGameState, onGameAction, enableHaptics, enableSounds]);

  const restartGame = useCallback(() => {
    clearGuesses();
    
    updateGameState(prev => ({
      ...prev,
      status: 'waiting',
      timeRemaining: prev.timeLimit || 300,
      currentPlayerId: '',
      winnerId: null
    }));
    
    // Reset player ready status
    updatePlayers(players.map(p => ({ ...p, ready: false })));
    
    onGameAction?.('game_restarted', {});
    
    if (enableHaptics) {
      triggerHapticFeedback('success');
    }
    
    if (enableSounds) {
      playSoundEffect('game_restarted');
    }
  }, [clearGuesses, updateGameState, updatePlayers, players, onGameAction, enableHaptics, enableSounds]);

  // Player actions
  const setPlayerReady = useCallback((ready: boolean) => {
    socketSetPlayerReady(ready);
    
    // Update local player state
    if (currentPlayer) {
      setCurrentPlayer({
        ...currentPlayer,
        ready
      });
    }
    
    onGameAction?.('player_ready_changed', { ready });
    
    if (enableHaptics) {
      triggerHapticFeedback('light');
    }
    
    if (enableSounds) {
      playSoundEffect(ready ? 'player_ready' : 'player_not_ready');
    }
  }, [socketSetPlayerReady, currentPlayer, setCurrentPlayer, onGameAction, enableHaptics, enableSounds]);

  const updatePlayerName = useCallback((name: string) => {
    if (currentPlayer) {
      setCurrentPlayer({
        ...currentPlayer,
        name
      });
      
      onGameAction?.('player_name_updated', { name });
    }
  }, [currentPlayer, setCurrentPlayer, onGameAction]);

  const togglePlayerReady = useCallback(() => {
    if (currentPlayer) {
      setPlayerReady(!currentPlayer.ready);
    }
  }, [currentPlayer, setPlayerReady]);

  // Chat actions
  const sendChatMessage = useCallback((message: string) => {
    socketSendChatMessage(message);
    
    // Add message to local chat
    addChatMessage({
      id: Date.now().toString(),
      playerId: currentPlayer?.id || '',
      playerName: currentPlayer?.name || 'Bilinmeyen',
      message,
      timestamp: Date.now()
    });
    
    onGameAction?.('chat_message_sent', { message });
    
    if (enableHaptics) {
      triggerHapticFeedback('light');
    }
    
    if (enableSounds) {
      playSoundEffect('chat_message');
    }
  }, [socketSendChatMessage, addChatMessage, currentPlayer, onGameAction, enableHaptics, enableSounds]);

  // Utility actions
  const getHint = useCallback((): string | null => {
    // This would typically be implemented with server-side logic
    // For now, return null
    return null;
  }, []);

  const getWordStats = useCallback(() => {
    const totalGuesses = gameState.guesses.length;
    const correctGuesses = gameState.guesses.filter(g => 
      g.result?.every(r => r === 'correct')
    ).length;
    
    const averageScore = totalGuesses > 0 
      ? gameState.guesses.reduce((sum, g) => sum + (g.score || 0), 0) / totalGuesses
      : 0;
    
    return {
      totalGuesses,
      correctGuesses,
      averageScore: Math.round(averageScore)
    };
  }, [gameState.guesses]);

  // Computed values
  const isPlayerTurn = useMemo(() => {
    return gameState.currentPlayerId === currentPlayer?.id;
  }, [gameState.currentPlayerId, currentPlayer?.id]);

  const canMakeGuess = useMemo(() => {
    return gameState.status === 'playing' && 
           isPlayerTurn && 
           (gameState.currentGuess?.length || 0) === gameState.wordLength;
  }, [gameState.status, gameState.currentGuess, gameState.wordLength, isPlayerTurn]);

  const gameStatus = gameState.status;
  const currentWord = gameState.currentGuess || '';
  const remainingGuesses = Math.max(0, 6 - gameState.guesses.length);
  const timeRemaining = gameState.timeRemaining;

  return {
    // Game setup actions
    createGame,
    joinGame,
    leaveGame,
    startGame,
    
    // Gameplay actions
    makeGuess,
    submitGuess,
    clearGuess,
    addLetter,
    removeLetter,
    
    // Game state actions
    pauseGame,
    resumeGame,
    endGame,
    restartGame,
    
    // Player actions
    setPlayerReady,
    updatePlayerName,
    togglePlayerReady,
    
    // Chat actions
    sendChatMessage,
    
    // Utility actions
    getHint,
    getWordStats,
    
    // Game state getters
    canMakeGuess,
    isPlayerTurn,
    gameStatus,
    currentWord,
    remainingGuesses,
    timeRemaining
  };
}

// Simplified game actions hook
export function useSimpleGameActions() {
  const {
    makeGuess,
    submitGuess,
    addLetter,
    removeLetter,
    canMakeGuess,
    isPlayerTurn,
    gameStatus
  } = useGameActions();
  
  return {
    makeGuess,
    submitGuess,
    addLetter,
    removeLetter,
    canMakeGuess,
    isPlayerTurn,
    gameStatus
  };
}

// Keyboard actions hook
export function useGameKeyboard() {
  const { addLetter, removeLetter, submitGuess, canMakeGuess } = useGameActions();
  
  const handleKeyPress = useCallback((key: string) => {
    if (key === 'Enter' && canMakeGuess) {
      // Submit current guess
      // This would need access to current word from game state
      return;
    }
    
    if (key === 'Backspace') {
      removeLetter();
      return;
    }
    
    if (key.length === 1 && /[A-Za-zÇĞIİÖŞÜçğıiöşü]/.test(key)) {
      addLetter(key.toUpperCase());
    }
  }, [addLetter, removeLetter, canMakeGuess]);
  
  return {
    handleKeyPress,
    canMakeGuess
  };
}
