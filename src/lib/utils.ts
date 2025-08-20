import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Kelime doğrulama yardımcıları
export function isValidTurkishWord(word: string): boolean {
  if (!word || word.length < 3 || word.length > 8) return false
  
  // Türkçe karakter kontrolü
  const turkishPattern = /^[a-zA-ZçÇğĞıİöÖşŞüÜ]+$/
  return turkishPattern.test(word)
}

// Oda kodu oluşturma
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Zaman formatlama
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Renk durumu hesaplama
export function calculateLetterStatus(
  letter: string, 
  position: number, 
  targetWord: string
): 'correct' | 'present' | 'absent' {
  if (letter.toLowerCase() === targetWord[position]?.toLowerCase()) {
    return 'correct'
  }
  
  if (targetWord.toLowerCase().includes(letter.toLowerCase())) {
    return 'present'
  }
  
  return 'absent'
}

// Puan hesaplama
export function calculateScore(
  guessCount: number,
  timeElapsed: number,
  difficulty: 'easy' | 'normal' | 'hard'
): number {
  const baseScore = 1000
  const guessBonus = Math.max(0, (7 - guessCount) * 100)
  const speedBonus = Math.max(0, (300 - timeElapsed) * 2)
  
  const difficultyMultiplier = {
    easy: 0.8,
    normal: 1.0,
    hard: 1.3
  }[difficulty]
  
  return Math.floor((baseScore + guessBonus + speedBonus) * difficultyMultiplier)
}

// Local storage yardımcıları
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Haptic feedback
export function triggerHapticFeedback(pattern: number | number[] = 50): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

// Sound effects
export function playSoundEffect(type: 'keypress' | 'correct' | 'wrong' | 'win'): void {
  // Bu fonksiyon daha sonra ses yöneticisi ile entegre edilecek
  console.log(`Playing sound: ${type}`)
}

// Performance monitoring
export function measurePerformance<T>(
  name: string, 
  fn: () => T
): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  console.log(`${name} took ${end - start}ms`)
  return result
}

// Error handling
export function handleError(error: unknown, context: string): void {
  console.error(`Error in ${context}:`, error)
  
  // Burada error reporting servisi entegrasyonu yapılabilir
  // Sentry, LogRocket vb.
}

// Validation helpers
export function validatePlayerName(name: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!name || name.trim().length === 0) {
    errors.push('Oyuncu adı boş olamaz')
  }
  
  if (name.length > 20) {
    errors.push('Oyuncu adı 20 karakterden uzun olamaz')
  }
  
  if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(name)) {
    errors.push('Oyuncu adı sadece harf ve boşluk içerebilir')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Game state helpers
export function isGameWon(guesses: string[], targetWord: string): boolean {
  return guesses.some(guess => 
    guess.toLowerCase() === targetWord.toLowerCase()
  )
}

export function isGameLost(guesses: string[], maxGuesses: number): boolean {
  return guesses.length >= maxGuesses && !isGameWon(guesses, guesses[guesses.length - 1])
}

// Mobile detection
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

// Touch detection
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Safe area detection
export function hasSafeArea(): boolean {
  if (typeof window === 'undefined') return false
  
  return CSS.supports('padding-top: env(safe-area-inset-top)')
}

