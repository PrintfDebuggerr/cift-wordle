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

