"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/use-socket'

interface JoinRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const router = useRouter()
  const { socket, isConnected, connect, emit } = useSocket()
  
  const [formData, setFormData] = useState({
    playerName: '',
    roomCode: ''
  })
  
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.playerName.trim() && formData.roomCode.trim()) {
      setIsJoining(true)
      setJoinError('')
      
      // Socket bağlantısını kur
      connect()
      
      // Odaya katıl
      if (socket) {
        socket.emit('join_room', {
          roomCode: formData.roomCode,
          playerName: formData.playerName
        })
      }
      
      console.log('Joining room:', formData)
    }
  }

  // Socket event listener'ları
  useEffect(() => {
    if (!socket) return

    // Odaya katılma başarılı
    socket.on('room_joined', (data: { roomCode: string, playerName: string }) => {
      console.log('Room joined:', data)
      setIsJoining(false)
      router.push(`/room/waiting?code=${formData.roomCode}`)
      onClose()
    })

    // Odaya katılma hatası
    socket.on('join_error', (error: { message: string }) => {
      console.error('Join error:', error)
      setJoinError(error.message)
      setIsJoining(false)
    })

    // Oda bulunamadı
    socket.on('room_not_found', () => {
      setJoinError('Oda bulunamadı. Kodu kontrol edin.')
      setIsJoining(false)
    })

    // Oda dolu
    socket.on('room_full', () => {
      setJoinError('Oda dolu. Başka bir oda bulun.')
      setIsJoining(false)
    })

    return () => {
      socket.off('room_joined')
      socket.off('join_error')
      socket.off('room_not_found')
      socket.off('room_full')
    }
  }, [socket, formData.roomCode, router, onClose])

  // Sadece rakam girişine izin ver
  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Sadece rakamları al
    if (value.length <= 6) {
      setFormData(prev => ({ ...prev, roomCode: value }))
      setJoinError('') // Hata mesajını temizle
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md mx-4 bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-700 overflow-hidden"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1 bg-gray-600 rounded-full sm:hidden" />
              </div>
              <h2 className="text-xl font-semibold text-white text-center">
                ⚡ Odaya Katıl
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Oyuncu Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Oyuncu Adı
                </label>
                <input
                  type="text"
                  value={formData.playerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, playerName: e.target.value }))}
                  placeholder="Adınızı girin..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={20}
                  autoFocus
                />
              </div>

              {/* Oda Kodu */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Oda Kodu
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.roomCode}
                    onChange={handleRoomCodeChange}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                  />
                  {formData.roomCode.length > 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      {formData.roomCode.length}/6
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Arkadaşınızdan aldığınız 6 haneli kodu girin
                </p>
              </div>

              {/* Error Message */}
              {joinError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm text-center">{joinError}</p>
                </div>
              )}

              {/* Connection Status */}
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-white font-medium">
                    {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
                  </span>
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="full"
                  onClick={onClose}
                  disabled={isJoining}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  size="full"
                  disabled={!formData.playerName.trim() || formData.roomCode.length !== 6 || isJoining}
                >
                  {isJoining ? 'Katılıyor...' : 'Odaya Katıl'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
