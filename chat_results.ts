// components/game/chat-panel.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/stores/game-store'
import { useGameActions } from '@/hooks/use-game-actions'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { chatMessages, players } = useGameStore()
  const { sendMessage } = useGameActions()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      sendMessage(message)
      setMessage('')
    }
  }

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    return player?.name || 'Bilinmeyen'
  }

  const isMyMessage = (playerId: string) => {
    return playerId === players[0]?.id
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Chat Panel */}
          <motion.div
            className="relative w-full max-w-md mx-4 bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[80vh]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 bg-gray-900">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-1 bg-gray-600 rounded-full sm:hidden" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">💬 Sohbet</h2>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">💭</div>
                  <p>Henüz mesaj yok</p>
                  <p className="text-sm mt-1">İlk mesajı sen gönder!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`flex ${isMyMessage(msg.playerId) ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`max-w-[80%] ${
                      isMyMessage(msg.playerId) 
                        ? 'order-2' 
                        : 'order-1'
                    }`}>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isMyMessage(msg.playerId)
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-gray-800 text-gray-100 rounded-bl-md'
                      }`}>
                        {msg.message}
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 px-1 ${
                        isMyMessage(msg.playerId) ? 'text-right' : 'text-left'
                      }`}>
                        {isMyMessage(msg.playerId) ? 'Sen' : getPlayerName(msg.playerId)} • 
                        {' '}{new Date(msg.timestamp).toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-800 bg-gray-900">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesajını yaz..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  maxLength={200}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!message.trim()}
                  className="rounded-full w-10 h-10 flex-shrink-0"
                >
                  📤
                </Button>
              </div>
              
              {/* Hızlı tepkiler */}
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {['👍', '👎', '😄', '😢', '🔥', '⚡', '🎉', '😱'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      sendMessage(emoji)
                    }}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 flex items-center justify-center text-sm transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// components/game/game-results.tsx
"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/stores/game-store'
import { useGameActions } from '@/hooks/use-game-actions'
import { useRouter } from 'next/navigation'

export function GameResults() {
  const router = useRouter()
  const { 
    players, 
    guesses, 
    targetWords, 
    mode,
    resetGame 
  } = useGameStore()
  const { leaveRoom } = useGameActions()

  const currentPlayer = players[0]
  const opponent = players[1]
  const myGuesses = guesses[currentPlayer?.id] || []
  const opponentGuesses = guesses[opponent?.id] || []
  
  // Kazananı belirle
  const myWon = myGuesses.some(guess => 
    guess.result.every(letter => letter.status === 'correct')
  )
  const opponentWon = opponentGuesses.some(guess => 
    guess.result.every(letter => letter.status === 'correct')
  )

  const winner = myWon ? currentPlayer : opponentWon ? opponent : null
  const isWinner = winner?.id === currentPlayer?.id
  
  const handlePlayAgain = () => {
    resetGame()
    router.push('/room/waiting')
  }

  const handleLeave = () => {
    leaveRoom()
    router.push('/')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-md mx-4 bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-800">
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {winner ? (isWinner ? '🎉' : '😔') : '🤝'}
          </motion.div>
          
          <motion.h2
            className="text-2xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {winner 
              ? (isWinner ? 'Tebrikler!' : 'Maalesef...') 
              : 'Berabere!'
            }
          </motion.h2>
          
          <motion.p
            className="text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {winner 
              ? `${winner.name} kazandı!`
              : 'İkiniz de harika oynadınız!'
            }
          </motion.p>
        </div>

        {/* Oyun Özeti */}
        <div className="p-6 space-y-4">
          {/* Hedef Kelimeler */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-center">🎯 Hedef Kelimeler</h3>
            
            {mode === 'turn-based' ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 tracking-widest">
                  {Object.values(targetWords)[0]?.toUpperCase() || ''}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-purple-400 mb-1">{currentPlayer?.name}</div>
                  <div className="text-lg font-bold text-white tracking-widest">
                    {targetWords[currentPlayer?.id]?.toUpperCase() || ''}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-blue-400 mb-1">{opponent?.name}</div>
                  <div className="text-lg font-bold text-white tracking-widest">
                    {targetWords[opponent?.id]?.toUpperCase() || ''}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <div className="text-sm text-purple-400 mb-1">{currentPlayer?.name}</div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-white">
                  {myGuesses.length} tahmin
                </div>
                <div className="text-xs text-gray-400">
                  {myWon ? '✅ Buldu' : '❌ Bulamadı'}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-blue-400 mb-1">{opponent?.name}</div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-white">
                  {opponentGuesses.length} tahmin
                </div>
                <div className="text-xs text-gray-400">
                  {opponentWon ? '✅ Buldu' : '❌ Bulamadı'}
                </div>
              </div>
            </div>
          </div>

          {/* Butonlar */}
          <div className="space-y-3 pt-4">
            <Button
              size="full"
              onClick={handlePlayAgain}
              className="text-lg py-3 h-12"
            >
              🔄 Tekrar Oyna
            </Button>
            
            <Button
              variant="secondary"
              size="full"
              onClick={handleLeave}
              className="text-base py-3"
            >
              🏠 Ana Sayfa
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// components/game/mobile-game-ui.tsx
"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/game-store'

export function MobileGameHeader() {
  const { 
    players, 
    currentTurn, 
    timeRemaining, 
    mode 
  } = useGameStore()

  const currentPlayer = players[0]
  const opponent = players[1]
  const isMyTurn = mode === 'turn-based' ? currentTurn === currentPlayer?.id : true

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800">
      <div className="flex items-center justify-between">
        {/* Sol Oyuncu */}
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-3 h-3 rounded-full transition-colors ${
              isMyTurn ? 'bg-green-400' : 'bg-gray-500'
            }`}
            animate={{ 
              scale: isMyTurn ? [1, 1.2, 1] : 1,
              opacity: isMyTurn ? [1, 0.7, 1] : 1
            }}
            transition={{ 
              duration: 1, 
              repeat: isMyTurn ? Infinity : 0 
            }}
          />
          <span className="text-white font-medium text-sm">
            {currentPlayer?.name}
          </span>
          {isMyTurn && (
            <span className="text-xs text-green-400">(Sıranız)</span>
          )}
        </div>

        {/* Orta - Timer */}
        <div className="text-center">
          <motion.div
            className={`font-mono text-lg font-bold ${
              timeRemaining <= 30 ? 'text-red-400' : 'text-purple-400'
            }`}
            animate={timeRemaining <= 10 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: timeRemaining <= 10 ? Infinity : 0 }}
          >
            ⏱️ {formatTime(timeRemaining)}
          </motion.div>
        </div>

        {/* Sağ Oyuncu */}
        <div className="flex items-center gap-2">
          {!isMyTurn && mode === 'turn-based' && (
            <span className="text-xs text-blue-400">(Sırası)</span>
          )}
          <span className="text-white font-medium text-sm">
            {opponent?.name}
          </span>
          <motion.div
            className={`w-3 h-3 rounded-full transition-colors ${
              !isMyTurn && mode === 'turn-based' ? 'bg-blue-400' : 'bg-gray-500'
            }`}
            animate={{ 
              scale: (!isMyTurn && mode === 'turn-based') ? [1, 1.2, 1] : 1,
              opacity: (!isMyTurn && mode === 'turn-based') ? [1, 0.7, 1] : 1
            }}
            transition={{ 
              duration: 1, 
              repeat: (!isMyTurn && mode === 'turn-based') ? Infinity : 0 
            }}
          />
        </div>
      </div>

      {/* Mod bilgisi */}
      <div className="flex justify-center mt-2">
        <span className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded-full">
          {mode === 'turn-based' ? '🔄 Sırayla Modu' : '⚔️ Düello Modu'}
        </span>
      </div>
    </div>
  )
}

// components/ui/loading-spinner.tsx
"use client"

import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        className={`border-2 border-gray-600 border-t-purple-500 rounded-full ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <motion.p
          className="text-gray-400 text-sm text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// components/ui/error-message.tsx
"use client"

import { motion } from 'framer-motion'
import { Button } from './button'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ 
  title = 'Bir hata oluştu', 
  message, 
  onRetry, 
  className 
}: ErrorMessageProps) {
  return (
    <motion.div
      className={`text-center p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          🔄 Tekrar Dene
        </Button>
      )}
    </motion.div>
  )
}

// lib/utils/sound-manager.ts
export class SoundManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private masterVolume = 0.7
  private enabled = true

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  async loadSound(name: string, url: string) {
    try {
      if (!this.audioContext) await this.initialize()
      
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
      
      this.sounds.set(name, audioBuffer)
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error)
    }
  }

  playSound(name: string, volume = 1) {
    if (!this.enabled || !this.audioContext || !this.sounds.has(name)) return

    try {
      const buffer = this.sounds.get(name)!
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()
      
      source.buffer = buffer
      gainNode.gain.value = volume * this.masterVolume
      
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      source.start()
    } catch (error) {
      console.warn(`Failed to play sound: ${name}`, error)
    }
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  // Preset ses efektleri
  playKeyPress() { this.playSound('key-press', 0.3) }
  playCorrectLetter() { this.playSound('correct-letter', 0.5) }
  playWrongLetter() { this.playSound('wrong-letter', 0.4) }
  playWordComplete() { this.playSound('word-complete', 0.6) }
  playGameWin() { this.playSound('game-win', 0.8) }
  playGameLose() { this.playSound('game-lose', 0.5) }
}

// Singleton instance
export const soundManager = new SoundManager()

// lib/utils/haptic-manager.ts
export class HapticManager {
  private enabled = true

  static isSupported(): boolean {
    return 'vibrate' in navigator
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  vibrate(pattern: number | number[]) {
    if (this.enabled && HapticManager.isSupported()) {
      navigator.vibrate(pattern)
    }
  }

  // Preset haptik efektleri
  light() { this.vibrate(50) }
  medium() { this.vibrate(100) }
  heavy() { this.vibrate([100, 50, 100]) }
  success() { this.vibrate([50, 25, 50]) }
  error() { this.vibrate([100, 100, 100]) }
  keyPress() { this.vibrate(30) }
}

// Singleton instance
export const hapticManager = new HapticManager()