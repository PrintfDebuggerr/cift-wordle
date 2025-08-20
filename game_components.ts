// components/game/letter-tile.tsx
"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface LetterTileProps {
  letter: string
  status: 'empty' | 'filled' | 'correct' | 'present' | 'absent'
  index: number
  isFlipping?: boolean
}

export function LetterTile({ letter, status, index, isFlipping }: LetterTileProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'correct':
        return 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white shadow-lg shadow-green-500/25'
      case 'present':
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-400 text-white shadow-lg shadow-yellow-500/25'
      case 'absent':
        return 'bg-gradient-to-br from-gray-600 to-gray-700 border-gray-500 text-white'
      case 'filled':
        return 'bg-gray-800 border-gray-600 text-white scale-105'
      default:
        return 'bg-gray-900 border-gray-700 text-gray-400'
    }
  }

  return (
    <motion.div
      className={cn(
        // Base tile styles - mobil-first
        "relative flex items-center justify-center rounded-lg border-2 font-bold transition-all duration-200",
        // Mobil boyutlar (44px minimum touch target)
        "w-12 h-12 text-lg",
        // Tablet boyutlar
        "sm:w-14 sm:h-14 sm:text-xl",
        // Desktop boyutlar
        "lg:w-16 lg:h-16 lg:text-2xl",
        getStatusStyles()
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: status === 'filled' ? 1.05 : 1, 
        opacity: 1,
        rotateY: isFlipping ? 180 : 0
      }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="select-none">
        {letter.toUpperCase()}
      </span>
      
      {/* Glow effect for correct letters */}
      {status === 'correct' && (
        <div className="absolute inset-0 bg-green-400/20 rounded-lg blur-md -z-10" />
      )}
    </motion.div>
  )
}

// components/game/word-grid.tsx
"use client"

import { LetterTile } from "./letter-tile"
import { motion } from "framer-motion"

interface WordGridProps {
  guesses: string[]
  currentGuess: string
  evaluations: Array<Array<'correct' | 'present' | 'absent'>>
  maxGuesses: number
  wordLength: number
  isFlipping?: boolean
}

export function WordGrid({ 
  guesses, 
  currentGuess, 
  evaluations, 
  maxGuesses, 
  wordLength,
  isFlipping 
}: WordGridProps) {
  const emptyRows = maxGuesses - guesses.length - (currentGuess ? 1 : 0)
  
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      {/* Tamamlanan tahminler */}
      {guesses.map((guess, rowIndex) => (
        <motion.div
          key={rowIndex}
          className="flex gap-1 sm:gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rowIndex * 0.1 }}
        >
          {Array.from({ length: wordLength }).map((_, colIndex) => (
            <LetterTile
              key={colIndex}
              letter={guess[colIndex] || ''}
              status={evaluations[rowIndex]?.[colIndex] || 'absent'}
              index={colIndex}
              isFlipping={isFlipping && rowIndex === guesses.length - 1}
            />
          ))}
        </motion.div>
      ))}
      
      {/* Aktif tahmin satırı */}
      {currentGuess !== undefined && (
        <motion.div
          className="flex gap-1 sm:gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {Array.from({ length: wordLength }).map((_, colIndex) => (
            <LetterTile
              key={colIndex}
              letter={currentGuess[colIndex] || ''}
              status={currentGuess[colIndex] ? 'filled' : 'empty'}
              index={colIndex}
            />
          ))}
        </motion.div>
      )}
      
      {/* Boş satırlar */}
      {Array.from({ length: emptyRows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-2">
          {Array.from({ length: wordLength }).map((_, colIndex) => (
            <LetterTile
              key={colIndex}
              letter=""
              status="empty"
              index={colIndex}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// components/game/mobile-keyboard.tsx
"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface KeyboardProps {
  onKeyPress: (key: string) => void
  onEnter: () => void
  onDelete: () => void
  keyStates: Record<string, 'correct' | 'present' | 'absent' | 'unused'>
  disabled?: boolean
}

const TURKISH_KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç']
]

export function MobileKeyboard({ 
  onKeyPress, 
  onEnter, 
  onDelete, 
  keyStates, 
  disabled 
}: KeyboardProps) {
  const getKeyStatus = (key: string) => {
    return keyStates[key.toLowerCase()] || 'unused'
  }

  const getKeyStyles = (status: string) => {
    switch (status) {
      case 'correct':
        return 'bg-green-600 text-white border-green-500'
      case 'present':
        return 'bg-yellow-600 text-white border-yellow-500'
      case 'absent':
        return 'bg-gray-700 text-gray-300 border-gray-600'
      default:
        return 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700'
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-2">
      {TURKISH_KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-center gap-1"
        >
          {/* Enter tuşu (sadece son satırda) */}
          {rowIndex === 2 && (
            <Button
              onClick={onEnter}
              disabled={disabled}
              className={cn(
                "h-12 px-3 text-xs font-semibold rounded border-2",
                "bg-purple-600 text-white border-purple-500 hover:bg-purple-700",
                "touch-manipulation"
              )}
            >
              ✓
            </Button>
          )}
          
          {row.map((key) => {
            const status = getKeyStatus(key)
            return (
              <motion.button
                key={key}
                onClick={() => onKeyPress(key)}
                disabled={disabled}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  // Base styles - mobil dokunma hedefi
                  "flex items-center justify-center rounded border-2 font-semibold transition-all duration-200 touch-manipulation",
                  // Mobil boyutlar
                  "h-12 min-w-[28px] text-sm",
                  // Tablet boyutlar
                  "sm:h-14 sm:min-w-[36px] sm:text-base",
                  // Desktop boyutlar
                  "lg:h-12 lg:min-w-[44px]",
                  getKeyStyles(status)
                )}
              >
                {key}
              </motion.button>
            )
          })}
          
          {/* Delete tuşu (sadece son satırda) */}
          {rowIndex === 2 && (
            <Button
              onClick={onDelete}
              disabled={disabled}
              className={cn(
                "h-12 px-3 text-xs font-semibold rounded border-2",
                "bg-red-600 text-white border-red-500 hover:bg-red-700",
                "touch-manipulation"
              )}
            >
              ⌫
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}