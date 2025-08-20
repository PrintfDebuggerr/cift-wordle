"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/use-socket'
import type { GameMode, Difficulty } from '@/types/game'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter()
  const { socket, isConnected, connect, emit } = useSocket()
  
  const [formData, setFormData] = useState({
    playerName: '',
    gameMode: 'turn-based' as GameMode,
    wordLength: 5,
    difficulty: 'normal' as Difficulty
  })
  
  const [roomCode, setRoomCode] = useState<string>('')
  const [isRoomCreated, setIsRoomCreated] = useState(false)
  const [isCopied, setCopied] = useState(false)
  const [waitingForPlayer, setWaitingForPlayer] = useState(false)
  const [playerCount, setPlayerCount] = useState(1)

  // 6 haneli oda kodu oluştur
  const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.playerName.trim()) {
      const code = generateRoomCode()
      setRoomCode(code)
      setIsRoomCreated(true)
      setWaitingForPlayer(true)
      
      // Socket bağlantısını kur
      connect()
      
      // Oda oluştur
      if (socket) {
        socket.emit('create_room', {
          roomCode: code,
          playerName: formData.playerName,
          gameMode: formData.gameMode,
          wordLength: formData.wordLength,
          difficulty: formData.difficulty
        })
      }
      
      console.log('Creating room:', { ...formData, roomCode: code })
    }
  }

  // Socket event listener'ları
  useEffect(() => {
    if (!socket) return

    // Oda oluşturuldu
    socket.on('room_created', (data: { roomCode: string }) => {
      console.log('Room created:', data)
    })

    // Oyuncu katıldı
    socket.on('player_joined', (data: { playerName: string, playerCount: number }) => {
      console.log('Player joined:', data)
      setPlayerCount(data.playerCount)
      
      if (data.playerCount === 2) {
        setWaitingForPlayer(false)
        // Oda oluşturan kişiye bildirim gönder
        localStorage.setItem('roomReady', roomCode)
      }
    })

    // Oda hazır
    socket.on('room_ready', () => {
      setWaitingForPlayer(false)
      setPlayerCount(2)
    })

    return () => {
      socket.off('room_created')
      socket.off('player_joined')
      socket.off('room_ready')
    }
  }, [socket, roomCode])

  // Oda hazır olduğunda dinle
  useEffect(() => {
    if (isRoomCreated && roomCode) {
      const checkRoomReady = () => {
        const readyCode = localStorage.getItem('roomReady')
        if (readyCode === roomCode) {
          setPlayerCount(2)
          setWaitingForPlayer(false)
          localStorage.removeItem('roomReady') // Temizle
        }
      }

      // Her 500ms kontrol et
      const interval = setInterval(checkRoomReady, 500)
      
      return () => clearInterval(interval)
    }
  }, [isRoomCreated, roomCode])

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareRoom = async () => {
    const roomUrl = `${window.location.origin}/room/waiting?code=${roomCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Çift Wordle - Odaya Katıl!',
          text: `Çift Wordle oyununa katılmak için bu kodu kullan: ${roomCode}`,
          url: roomUrl
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      // Fallback: URL'yi kopyala
      await navigator.clipboard.writeText(roomUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const joinRoom = () => {
    router.push(`/room/waiting?code=${roomCode}`)
    onClose()
  }

  // Modal kapandığında state'i sıfırla
  useEffect(() => {
    if (!isOpen) {
      setIsRoomCreated(false)
      setRoomCode('')
      setCopied(false)
      setWaitingForPlayer(false)
      setPlayerCount(1)
    }
  }, [isOpen])

  if (isRoomCreated) {
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
            />
            
            {/* Success Modal */}
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
                  🎉 Oda Oluşturuldu!
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Room Code */}
                <div className="text-center">
                  <p className="text-gray-400 mb-3">Arkadaşınızla paylaşın:</p>
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-xl">
                    <div className="text-4xl font-bold text-white tracking-widest mb-2">
                      {roomCode}
                    </div>
                    <div className="text-sm text-purple-200">
                      6 Haneli Oda Kodu
                    </div>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-white font-medium">
                      {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
                    </span>
                  </div>
                </div>

                {/* Player Status */}
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-white font-medium">Oyuncu Durumu</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {playerCount}/2
                  </div>
                  <div className="text-sm text-gray-400">
                    {waitingForPlayer ? 'İkinci oyuncu bekleniyor...' : 'Oda hazır!'}
                  </div>
                </div>

                {/* Share Options */}
                <div className="space-y-3">
                  <Button
                    onClick={copyRoomCode}
                    size="full"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isCopied ? '✅ Kopyalandı!' : '📋 Kodu Kopyala'}
                  </Button>
                  
                  <Button
                    onClick={shareRoom}
                    variant="secondary"
                    size="full"
                  >
                    📤 Paylaş
                  </Button>
                </div>

                {/* Join Room Button */}
                {!waitingForPlayer && playerCount === 2 && (
                  <Button
                    onClick={joinRoom}
                    size="full"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    🚀 Odaya Gir
                  </Button>
                )}

                {/* Info */}
                <div className="text-center text-sm text-gray-400">
                  {waitingForPlayer ? (
                    <>
                      <p>Oda kodunu arkadaşınıza gönderin</p>
                      <p className="mt-1">İkinci oyuncu katıldığında odaya girebilirsiniz</p>
                    </>
                  ) : (
                    <>
                      <p>İkinci oyuncu katıldı!</p>
                      <p className="mt-1">Şimdi odaya girebilirsiniz</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    )
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
                🚀 Yeni Oda Oluştur
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

              {/* Oyun Modu */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Oyun Modu
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gameMode: 'turn-based' }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.gameMode === 'turn-based'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">🔄 Sırayla Modu</div>
                    <div className="text-sm opacity-80">Oyuncular sırayla tahmin yapar</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gameMode: 'duel' }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.gameMode === 'duel'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">⚔️ Düello Modu</div>
                    <div className="text-sm opacity-80">Aynı anda yarışarak oynayın</div>
                  </button>
                </div>
              </div>

              {/* Ayarlar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kelime Uzunluğu
                  </label>
                  <select
                    value={formData.wordLength}
                    onChange={(e) => setFormData(prev => ({ ...prev, wordLength: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={4}>4 Harf</option>
                    <option value={5}>5 Harf</option>
                    <option value={6}>6 Harf</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Zorluk
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="easy">Kolay</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Zor</option>
                  </select>
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="full"
                  onClick={onClose}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  size="full"
                  disabled={!formData.playerName.trim()}
                >
                  Oda Oluştur
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
