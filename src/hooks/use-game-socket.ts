'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSocketStore } from '@/stores/socket-store';
import { useGameStore } from '@/stores/game-store';
import { 
  ClientEvents, 
  ServerEvents, 
  GameState, 
  Player, 
  ChatMessage,
  GameResult,
  Achievement
} from '@/types/game';

export interface UseGameSocketOptions {
  autoConnect?: boolean;
  onGameStateUpdate?: (gameState: GameState) => void;
  onPlayerUpdate?: (players: Player[]) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onGameEnd?: (result: GameResult) => void;
  onAchievement?: (achievement: Achievement) => void;
  onError?: (error: string) => void;
}

export interface UseGameSocketReturn {
  // Connection status
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Game actions
  createRoom: (config: any) => Promise<void>;
  joinRoom: (roomCode: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  startGame: () => void;
  makeGuess: (word: string) => void;
  sendChatMessage: (message: string) => void;
  setPlayerReady: (ready: boolean) => void;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useGameSocket(options: UseGameSocketOptions = {}): UseGameSocketReturn {
  const {
    autoConnect = true,
    onGameStateUpdate,
    onPlayerUpdate,
    onChatMessage,
    onGameEnd,
    onAchievement,
    onError
  } = options;

  const socket = useSocketStore(state => state.socket);
  const isConnected = useSocketStore(state => state.isConnected);
  const isConnecting = useSocketStore(state => state.isConnecting);
  const connectionError = useSocketStore(state => state.error);
  
  const gameState = useGameStore(state => state.gameState);
  const updateGameState = useGameStore(state => state.updateGameState);
  const updatePlayers = useGameStore(state => state.updatePlayers);
  const addChatMessage = useGameStore(state => state.addChatMessage);
  const setGameResult = useGameStore(state => state.setGameResult);
  const addAchievement = useGameStore(state => state.addAchievement);
  const setError = useGameStore(state => state.setError);

  const eventHandlersRef = useRef<Map<string, Function>>(new Map());

  // Event handler setup
  const setupEventHandlers = useCallback(() => {
    if (!socket) return;

    // Game state updates
    const handleGameStateUpdate = (data: GameState) => {
      updateGameState(data);
      onGameStateUpdate?.(data);
    };

    // Player updates
    const handlePlayerUpdate = (data: { players: Player[] }) => {
      updatePlayers(data.players);
      onPlayerUpdate?.(data.players);
    };

    // Chat messages
    const handleChatMessage = (data: ChatMessage) => {
      addChatMessage(data);
      onChatMessage?.(data);
    };

    // Game end
    const handleGameEnd = (data: GameResult) => {
      setGameResult(data);
      onGameEnd?.(data);
    };

    // Achievement unlocked
    const handleAchievement = (data: Achievement) => {
      addAchievement(data);
      onAchievement?.(data);
    };

    // Error handling
    const handleError = (data: { message: string }) => {
      setError(data.message);
      onError?.(data.message);
    };

    // Room events
    const handleRoomCreated = (data: { roomCode: string; roomId: string }) => {
      updateGameState(prev => ({
        ...prev,
        roomCode: data.roomCode,
        roomId: data.roomId,
        status: 'waiting'
      }));
    };

    const handleRoomJoined = (data: { room: any; players: Player[] }) => {
      updateGameState(prev => ({
        ...prev,
        ...data.room,
        status: 'waiting'
      }));
      updatePlayers(data.players);
    };

    const handlePlayerJoined = (data: { player: Player }) => {
      updatePlayers(prev => [...prev, data.player]);
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      updatePlayers(prev => prev.filter(p => p.id !== data.playerId));
    };

    const handlePlayerReady = (data: { playerId: string; ready: boolean }) => {
      updatePlayers(prev => 
        prev.map(p => 
          p.id === data.playerId ? { ...p, ready: data.ready } : p
        )
      );
    };

    // Game events
    const handleGameStarted = (data: { gameState: GameState }) => {
      updateGameState(prev => ({
        ...prev,
        ...data.gameState,
        status: 'playing'
      }));
    };

    const handleTurnUpdate = (data: { currentPlayerId: string; timeRemaining: number }) => {
      updateGameState(prev => ({
        ...prev,
        currentPlayerId: data.currentPlayerId,
        timeRemaining: data.timeRemaining
      }));
    };

    const handleGuessResult = (data: { 
      guess: string; 
      result: any; 
      playerId: string;
      isCorrect: boolean;
    }) => {
      // Update game state with guess result
      updateGameState(prev => ({
        ...prev,
        guesses: [...prev.guesses, {
          word: data.guess,
          result: data.result,
          playerId: data.playerId,
          timestamp: Date.now()
        }]
      }));

      // Update keyboard state
      // This would typically be handled by the game store
    };

    const handleGameWon = (data: { winnerId: string; word: string; score: number }) => {
      setGameResult({
        winnerId: data.winnerId,
        word: data.word,
        score: data.score,
        timestamp: Date.now()
      });
      
      updateGameState(prev => ({
        ...prev,
        status: 'finished',
        winnerId: data.winnerId
      }));
    };

    const handleGameLost = (data: { word: string; finalScore: number }) => {
      setGameResult({
        winnerId: null,
        word: data.word,
        score: data.finalScore,
        timestamp: Date.now()
      });
      
      updateGameState(prev => ({
        ...prev,
        status: 'finished'
      }));
    };

    // Store event handlers for cleanup
    const handlers = {
      'game:state_update': handleGameStateUpdate,
      'game:players_update': handlePlayerUpdate,
      'game:chat_message': handleChatMessage,
      'game:end': handleGameEnd,
      'game:achievement': handleAchievement,
      'game:error': handleError,
      'room:created': handleRoomCreated,
      'room:joined': handleRoomJoined,
      'room:player_joined': handlePlayerJoined,
      'room:player_left': handlePlayerLeft,
      'room:player_ready': handlePlayerReady,
      'game:started': handleGameStarted,
      'game:turn_update': handleTurnUpdate,
      'game:guess_result': handleGuessResult,
      'game:won': handleGameWon,
      'game:lost': handleGameLost
    };

    // Register all event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
      eventHandlersRef.current.set(event, handler);
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to game server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from game server');
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      setError(`Bağlantı hatası: ${error.message}`);
    });

  }, [socket, updateGameState, updatePlayers, addChatMessage, setGameResult, addAchievement, setError, onGameStateUpdate, onPlayerUpdate, onChatMessage, onGameEnd, onAchievement, onError]);

  // Cleanup event handlers
  const cleanupEventHandlers = useCallback(() => {
    if (!socket) return;

    eventHandlersRef.current.forEach((handler, event) => {
      socket.off(event, handler);
    });
    eventHandlersRef.current.clear();
  }, [socket]);

  // Game actions
  const createRoom = useCallback(async (config: any) => {
    if (!socket || !isConnected) {
      throw new Error('Socket bağlantısı yok');
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit('room:create', config, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Oda oluşturulamadı'));
        }
      });
    });
  }, [socket, isConnected]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    if (!socket || !isConnected) {
      throw new Error('Socket bağlantısı yok');
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit('room:join', { roomCode, playerName }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Odaya katılınamadı'));
        }
      });
    });
  }, [socket, isConnected]);

  const leaveRoom = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit('room:leave');
    
    // Reset local game state
    updateGameState({
      status: 'idle',
      roomCode: '',
      roomId: '',
      players: [],
      currentPlayerId: '',
      timeRemaining: 0,
      guesses: [],
      winnerId: null
    });
  }, [socket, isConnected, updateGameState]);

  const startGame = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit('game:start');
  }, [socket, isConnected]);

  const makeGuess = useCallback((word: string) => {
    if (!socket || !isConnected) return;

    socket.emit('game:guess', { word });
  }, [socket, isConnected]);

  const sendChatMessage = useCallback((message: string) => {
    if (!socket || !isConnected) return;

    socket.emit('chat:message', { message });
  }, [socket, isConnected]);

  const setPlayerReady = useCallback((ready: boolean) => {
    if (!socket || !isConnected) return;

    socket.emit('room:ready', { ready });
  }, [socket, isConnected]);

  // Connection management
  const connect = useCallback(() => {
    if (socket && !isConnected) {
      socket.connect();
    }
  }, [socket, isConnected]);

  const disconnect = useCallback(() => {
    if (socket && isConnected) {
      socket.disconnect();
    }
  }, [socket, isConnected]);

  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setTimeout(() => {
        socket.connect();
      }, 1000);
    }
  }, [socket]);

  // Effect: Setup event handlers when socket changes
  useEffect(() => {
    if (socket) {
      setupEventHandlers();
    }

    return () => {
      cleanupEventHandlers();
    };
  }, [socket, setupEventHandlers, cleanupEventHandlers]);

  // Effect: Auto-connect
  useEffect(() => {
    if (autoConnect && socket && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, socket, isConnected, isConnecting, connect]);

  return {
    // Connection status
    isConnected,
    isConnecting,
    connectionError,
    
    // Game actions
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    makeGuess,
    sendChatMessage,
    setPlayerReady,
    
    // Connection management
    connect,
    disconnect,
    reconnect
  };
}

// Simplified game socket hook for basic usage
export function useSimpleGameSocket() {
  const { isConnected, createRoom, joinRoom, leaveRoom, makeGuess } = useGameSocket();
  
  return {
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    makeGuess
  };
}

// Chat-specific hook
export function useGameChat() {
  const { sendChatMessage } = useGameSocket();
  const chatMessages = useGameStore(state => state.chatMessages);
  
  return {
    sendMessage: sendChatMessage,
    messages: chatMessages
  };
}

// Room management hook
export function useGameRoom() {
  const { createRoom, joinRoom, leaveRoom, setPlayerReady } = useGameSocket();
  const gameState = useGameStore(state => state.gameState);
  const players = useGameStore(state => state.players);
  
  return {
    createRoom,
    joinRoom,
    leaveRoom,
    setPlayerReady,
    roomCode: gameState.roomCode,
    players,
    gameStatus: gameState.status
  };
}

