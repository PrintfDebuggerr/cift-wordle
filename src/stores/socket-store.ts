import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { io, Socket } from 'socket.io-client'
import type { ClientEvents, ServerEvents } from '@/types/game'

interface SocketState {
  socket: Socket<ServerEvents, ClientEvents> | null
  isConnected: boolean
  connectionError?: string
}

interface SocketActions {
  connect: () => void
  disconnect: () => void
  emit: <T extends keyof ClientEvents>(event: T, data?: ClientEvents[T]) => void
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
