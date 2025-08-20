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
