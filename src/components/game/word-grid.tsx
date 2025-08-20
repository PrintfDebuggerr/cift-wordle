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
