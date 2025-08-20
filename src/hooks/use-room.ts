import { useState, useEffect } from 'react'
import { useSocket } from './use-socket'

interface RoomPlayer {
  id: string
  name: string
  isReady: boolean
  isOnline: boolean
  joinedAt: Date
  lastSeen: Date
}

interface RoomState {
  roomCode: string
  players: RoomPlayer[]
  isHost: boolean
  canStart: boolean
}

export function useRoom(roomCode: string) {
  const { socket, isConnected, connect, emit } = useSocket()
  const [roomState, setRoomState] = useState<RoomState>({
    roomCode,
    players: [],
    isHost: false,
    canStart: false
  })

  // Socket bağlantısını kur
  useEffect(() => {
    if (roomCode) {
      connect()
    }
  }, [roomCode, connect])

  // Socket event listener'ları
  useEffect(() => {
    if (!socket) return

    // Odaya katılma
    socket.emit('join_room', { roomCode })

    // Oyuncu listesi güncelleme
    socket.on('room_players', (players: RoomPlayer[]) => {
      setRoomState(prev => ({
        ...prev,
        players,
        canStart: players.length === 2 && players.every(p => p.isReady)
      }))
    })

    // Yeni oyuncu katıldı
    socket.on('player_joined', (player: RoomPlayer) => {
      setRoomState(prev => ({
        ...prev,
        players: [...prev.players, player],
        isHost: prev.players.length === 0 // İlk oyuncu host olur
      }))
    })

    // Oyuncu ayrıldı
    socket.on('player_left', (playerId: string) => {
      setRoomState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== playerId),
        canStart: false
      }))
    })

    // Oyuncu hazır durumu değişti
    socket.on('player_ready', (playerId: string, isReady: boolean) => {
      setRoomState(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.id === playerId ? { ...p, isReady } : p
        ),
        canStart: prev.players.length === 2 && 
          prev.players.every(p => p.id === playerId ? isReady : p.isReady)
      }))
    })

    // Oda hazır
    socket.on('room_ready', () => {
      setRoomState(prev => ({ ...prev, canStart: true }))
    })

    return () => {
      socket.off('room_players')
      socket.off('player_joined')
      socket.off('player_left')
      socket.off('player_ready')
      socket.off('room_ready')
    }
  }, [socket, roomCode])

  // Oyuncu hazır durumunu değiştir
  const toggleReady = () => {
    if (socket && isConnected) {
      emit('toggle_ready', { roomCode })
    }
  }

  // Oyunu başlat
  const startGame = () => {
    if (socket && isConnected && roomState.canStart) {
      emit('start_game', { roomCode })
    }
  }

  // Odadan ayrıl
  const leaveRoom = () => {
    if (socket && isConnected) {
      emit('leave_room', { roomCode })
    }
  }

  return {
    ...roomState,
    isConnected,
    toggleReady,
    startGame,
    leaveRoom
  }
}
