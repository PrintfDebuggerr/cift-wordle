// app/page.tsx - Ana Sayfa
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MobileLayout, GameContainer } from '@/components/layout/mobile-layout'
import { CreateRoomModal } from '@/components/game/create-room-modal'
import { JoinRoomModal } from '@/components/game/join-room-modal'
import { useGameSocket } from '@/hooks/use-game-socket'

export default function HomePage() {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const { isConnected } = useGameSocket()

  return (
    <MobileLayout>
      <GameContainer className="flex flex-col items-center justify-center min-h-screen">
        {/* Logo ve Başlık */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ÇİFT
              </span>
              <br />
              <span className="text-white">WORDLE</span>
            </h1>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 blur-3xl -z-10" />
          </div>
          
          <p className="text-gray-400 text-lg sm:text-xl max-w-md mx-auto">
            2 kişilik online Türkçe kelime oyunu
          </p>
        </motion.div>

        {/* Ana Butonlar */}
        <motion.div
          className="w-full max-w-sm space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Button
            size="full"
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected}
            className="text-lg py-4 h-14"
          >
            🚀 ODA OLUŞTUR
          </Button>
          
          <Button
            variant="secondary"
            size="full"
            onClick={() => setShowJoinModal(true)}
            disabled={!isConnected}
            className="text-lg py-4 h-14"
          >
            ⚡ ODAYA KATIL
          </Button>
        </motion.div>

        {/* Bağlantı Durumu */}
        <motion.div
          className="mt-8 flex items-center gap-2 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-gray-400">
            {isConnected ? 'Bağlı' : 'Bağlanıyor...'}
          </span>
        </motion.div>

        {/* Alt Butonlar */}
        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button variant="ghost" size="sm">
            📊 İSTATİSTİKLER
          </Button>
          <Button variant="ghost" size="sm">
            ❓ NASIL OYNANIR
          </Button>
          <Button variant="ghost" size="sm">
            ⚙️ AYARLAR
          </Button>
        </motion.div>
      </GameContainer>

      {/* Modaller */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </MobileLayout>
  )
}

// components/game/create-room-modal.tsx
"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useGameActions } from '@/hooks/use-game-actions'
import { useRouter } from 'next/navigation'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter()
  const { createRoom } = useGameActions()
  const [formData, setFormData] = useState({
    playerName: '',
    gameMode: 'turn-based' as 'turn-based' | 'duel',
    wordLength: 5,
    difficulty: 'normal' as 'easy' | 'normal' | 'hard'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.playerName.trim()) {
      createRoom(formData)
      router.push('/room/waiting')
      onClose()
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
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
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

// components/game/join-room-modal.tsx
"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useGameActions } from '@/hooks/use-game-actions'
import { useRouter } from 'next/navigation'

interface JoinRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const router = useRouter()
  const { joinRoom } = useGameActions()
  const [formData, setFormData] = useState({
    playerName: '',
    roomCode: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.playerName.trim() && formData.roomCode.trim()) {
      joinRoom({
        playerName: formData.playerName.trim(),
        roomCode: formData.roomCode.trim().toUpperCase()
      })
      router.push('/room/waiting')
      onClose()
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
                <input
                  type="text"
                  value={formData.roomCode}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    roomCode: e.target.value.toUpperCase() 
                  }))}
                  placeholder="6 haneli oda kodu"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest"
                  maxLength={6}
                  pattern="[A-Z0-9]{6}"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Örnek: ABC123
                </p>
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
                  disabled={!formData.playerName.trim() || formData.roomCode.length !== 6}
                >
                  Katıl
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// app/room/waiting/page.tsx - Bekleme Odası
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MobileLayout, GameContainer, MobileHeader } from '@/components/layout/mobile-layout'
import { useGameStore } from '@/stores/game-store'
import { useGameActions } from '@/hooks/use-game-actions'

export default function WaitingRoomPage() {
  const router = useRouter()
  const { 
    roomCode, 
    players, 
    status,
    mode,
    wordLength,
    difficulty 
  } = useGameStore()
  const { setPlayerReady, leaveRoom } = useGameActions()

  const currentPlayer = players[0] // İlk oyuncu sen olacaksın
  const opponent = players[1]
  const canStart = players.length === 2 && players.every(p => p.isReady)

  useEffect(() => {
    if (status === 'playing') {
      router.push('/room/game')
    }
  }, [status, router])

  useEffect(() => {
    if (!roomCode) {
      router.push('/')
    }
  }, [roomCode, router])

  const handleReady = () => {
    setPlayerReady()
  }

  const handleLeave = () => {
    leaveRoom()
    router.push('/')
  }

  return (
    <MobileLayout>
      <MobileHeader
        title="Oyun Odası"
        showBack
        onBack={handleLeave}
      />
      
      <GameContainer className="py-8">
        {/* Oda Bilgileri */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-4">
            <span className="text-purple-400 font-mono text-lg tracking-widest">
              {roomCode}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(roomCode || '')}
              className="text-purple-400 hover:text-purple-300 transition-colors"
              title="Kodu kopyala"
            >
              📋
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-400">
            <span className="px-2 py-1 bg-gray-800 rounded">
              {mode === 'turn-based' ? '🔄 Sırayla' : '⚔️ Düello'}
            </span>
            <span className="px-2 py-1 bg-gray-800 rounded">
              {wordLength} Harf
            </span>
            <span className="px-2 py-1 bg-gray-800 rounded">
              {difficulty === 'easy' ? 'Kolay' : difficulty === 'normal' ? 'Normal' : 'Zor'}
            </span>
          </div>
        </motion.div>

        {/* Oyuncular */}
        <motion.div
          className="space-y-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Mevcut oyuncu */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {currentPlayer?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="font-semibold text-white">
                  {currentPlayer?.name || 'Sen'} 
                  <span className="text-purple-400 ml-2">(Sen)</span>
                </div>
                <div className="text-sm text-gray-400">
                  {currentPlayer?.isReady ? '✅ Hazır' : '⏳ Hazırlanıyor...'}
                </div>
              </div>
            </div>
          </div>

          {/* Rakip oyuncu */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              {opponent ? (
                <>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {opponent.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{opponent.name}</div>
                    <div className="text-sm text-gray-400">
                      {opponent.isReady ? '✅ Hazır' : '⏳ Hazırlanıyor...'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-400">Bekleniyor...</div>
                    <div className="text-sm text-gray-500">Oyuncu katılması bekleniyor</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Davet Linki */}
        <motion.div
          className="mb-8 p-4 bg-gray-800/30 border border-gray-700 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold text-white mb-2">Arkadaşını Davet Et</h3>
          <p className="text-sm text-gray-400 mb-3">
            Oda kodunu paylaş veya linki gönder
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigator.clipboard.writeText(roomCode || '')}
            >
              📋 Kodu Kopyala
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const url = `${window.location.origin}?join=${roomCode}`
                navigator.clipboard.writeText(url)
              }}
            >
              🔗 Link Kopyala
            </Button>
          </div>
        </motion.div>

        {/* Hazır Butonu */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {!currentPlayer?.isReady ? (
            <Button
              size="full"
              onClick={handleReady}
              disabled={!opponent}
              className="text-lg py-4 h-14"
            >
              ✅ HAZIR
            </Button>
          ) : (
            <div className="text-center">
              {canStart ? (
                <div className="space-y-2">
                  <div className="text-green-400 font-semibold">🎉 Oyun başlıyor!</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400">Kelimeler seçiliyor...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-yellow-400 font-semibold">⏳ Rakibin hazırlanması bekleniyor</div>
                  <div className="text-gray-400 text-sm">
                    Her iki oyuncu da hazır olduğunda oyun başlayacak
                  </div>
                </div>
              )}
            </div>
          )}
          
          <Button
            variant="secondary"
            size="full"
            onClick={handleLeave}
            className="text-base py-3"
          >
            🚪 Odadan Çık
          </Button>
        </motion.div>

        {/* Oyun Kuralları Özeti */}
        <motion.div
          className="mt-8 p-4 bg-gray-800/20 border border-gray-700/50 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="font-semibold text-white mb-2">
            {mode === 'turn-based' ? '🔄 Sırayla Modu' : '⚔️ Düello Modu'}
          </h3>
          <ul className="text-sm text-gray-400 space-y-1">
            {mode === 'turn-based' ? (
              <>
                <li>• Oyuncular sırayla tahmin yapar</li>
                <li>• Aynı kelimeyi bulmaya çalışırsınız</li>
                <li>• İlk doğru tahmin eden kazanır</li>
                <li>• Her tahmin için 60 saniye süreniz var</li>
              </>
            ) : (
              <>
                <li>• Her oyuncunun farklı kelimesi var</li>
                <li>• Aynı anda tahmin yapabilirsiniz</li>
                <li>• Kelimesini ilk bulan kazanır</li>
                <li>• Sadece renk ipuçlarını görebilirsiniz</li>
              </>
            )}
          </ul>
        </motion.div>
      </GameContainer>
    </MobileLayout>
  )
}

// app/room/game/page.tsx - Oyun Sayfası
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MobileLayout, GameContainer, MobileHeader } from '@/components/layout/mobile-layout'
import { WordGrid } from '@/components/game/word-grid'
import { MobileKeyboard } from '@/components/game/mobile-keyboard'
import { ChatPanel } from '@/components/game/chat-panel'
import { GameResults } from '@/components/game/game-results'
import { useGameStore } from '@/stores/game-store'
import { useGameActions } from '@/hooks/use-game-actions'

export default function GamePage() {
  const router = useRouter()
  const [showChat, setShowChat] = useState(false)
  
  const {
    roomCode,
    players,
    status,
    mode,
    currentTurn,
    guesses,
    currentGuess,
    targetWords,
    keyboardState,
    timeRemaining,
    maxGuesses,
    wordLength,
    isFlipping,
    showResults,
    error,
    updateCurrentGuess
  } = useGameStore()
  
  const { makeGuess, leaveRoom } = useGameActions()

  const currentPlayer = players[0]
  const opponent = players[1]
  const myGuesses = guesses[currentPlayer?.id] || []
  const opponentGuesses = guesses[opponent?.id] || []
  
  const isMyTurn = mode === 'turn-based' ? currentTurn === currentPlayer?.id : true
  const canGuess = isMyTurn && currentGuess.length === wordLength && status === 'playing'

  useEffect(() => {
    if (!roomCode || status === 'waiting') {
      router.push('/')
    }
  }, [roomCode, status, router])

  const handleKeyPress = (key: string) => {
    if (currentGuess.length < wordLength) {
      updateCurrentGuess(currentGuess + key)
    }
  }

  const handleDelete = () => {
    updateCurrentGuess(currentGuess.slice(0, -1))
  }

  const handleEnter = () => {
    if (canGuess) {
      makeGuess(currentGuess)
    }
  }

  const handleLeave = () => {
    leaveRoom()
    router.push('/')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Tahmin geçmişini evaluation formatına dönüştür
  const getEvaluations = (playerGuesses: typeof myGuesses) => {
    return playerGuesses.map(guess => 
      guess.result.map(r => r.status)
    )
  }

  return (
    <MobileLayout hasBottomNav={false}>
      <MobileHeader
        title={mode === 'turn-based' ? 'Sırayla Modu' : 'Düello Modu'}
        showBack
        onBack={handleLeave}
        rightButton={
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 text-gray-400 hover:text-white transition-colors relative"
          >
            💬
            {/* Chat notification badge burada olabilir */}
          </button>
        }
      />

      <div className="flex-1 flex flex-col">
        {/* Oyuncu Bilgileri */}
        <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                isMyTurn ? 'bg-green-400' : 'bg-gray-500'
              }`} />
              <span className="text-white font-medium">
                {currentPlayer?.name} {isMyTurn && '(Sıranız)'}
              </span>
            </div>
            
            <div className="text-center">
              <div className="text-purple-400 font-mono text-lg">
                ⏱️ {formatTime(timeRemaining)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{opponent?.name}</span>
              <span className={`w-2 h-2 rounded-full ${
                !isMyTurn ? 'bg-blue-400' : 'bg-gray-500'
              }`} />
            </div>
          </div>
        </div>

        {/* Oyun Alanı */}
        <div className="flex-1 overflow-y-auto">
          {mode === 'turn-based' ? (
            // Sırayla modu: Tek grid
            <div className="py-4">
              <WordGrid
                guesses={myGuesses.map(g => g.word)}
                currentGuess={isMyTurn ? currentGuess : ''}
                evaluations={getEvaluations(myGuesses)}
                maxGuesses={maxGuesses}
                wordLength={wordLength}
                isFlipping={isFlipping}
              />
              
              {/* Rakip son tahmini */}
              {opponentGuesses.length > 0 && (
                <div className="mt-4 px-4">
                  <div className="text-center text-sm text-gray-400 mb-2">
                    {opponent?.name} son tahmin:
                  </div>
                  <div className="flex justify-center gap-1">
                    {opponentGuesses[opponentGuesses.length - 1].result.map((letter, idx) => (
                      <div
                        key={idx}
                        className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold ${
                          letter.status === 'correct' ? 'bg-green-600 border-green-500 text-white' :
                          letter.status === 'present' ? 'bg-yellow-600 border-yellow-500 text-white' :
                          'bg-gray-600 border-gray-500 text-white'
                        }`}
                      >
                        {letter.letter}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Düello modu: Çift grid
            <div className="grid grid-cols-2 gap-2 p-2">
              <div className="border-r border-gray-800 pr-2">
                <div className="text-center text-sm text-purple-400 mb-2 font-medium">
                  {currentPlayer?.name}
                </div>
                <WordGrid
                  guesses={myGuesses.map(g => g.word)}
                  currentGuess={currentGuess}
                  evaluations={getEvaluations(myGuesses)}
                  maxGuesses={maxGuesses}
                  wordLength={wordLength}
                  isFlipping={isFlipping}
                />
              </div>
              
              <div className="pl-2">
                <div className="text-center text-sm text-blue-400 mb-2 font-medium">
                  {opponent?.name}
                </div>
                <WordGrid
                  guesses={opponentGuesses.map(g => g.word)}
                  currentGuess=""
                  evaluations={getEvaluations(opponentGuesses)}
                  maxGuesses={maxGuesses}
                  wordLength={wordLength}
                  isFlipping={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hata Mesajı */}
        {error && (
          <motion.div
            className="mx-4 mb-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          </motion.div>
        )}

        {/* Klavye */}
        <div className="bg-gray-900/50 border-t border-gray-800">
          <MobileKeyboard
            onKeyPress={handleKeyPress}
            onEnter={handleEnter}
            onDelete={handleDelete}
            keyStates={keyboardState}
            disabled={!isMyTurn || status !== 'playing'}
          />
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Oyun Sonucu */}
      {showResults && (
        <GameResults />
      )}
    </MobileLayout>
  )
}