import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  emit: (event: string, data: any) => void
}

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  const connect = () => {
    if (!socketRef.current) {
      // Development için localhost, production için gerçek URL
      const socket = io(process.env.NODE_ENV === 'production' 
        ? 'https://your-backend.com' 
        : 'http://localhost:3001'
      )

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id)
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      socket.on('error', (error) => {
        console.error('Socket error:', error)
        setIsConnected(false)
      })

      socketRef.current = socket
    }
  }

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }

  const emit = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit:', event)
    }
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emit
  }
}

