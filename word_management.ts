// lib/database/words.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface WordFilter {
  length?: number
  difficulty?: 'easy' | 'normal' | 'hard'
  category?: string
  excludeWords?: string[]
}

// Rastgele kelime seçme
export async function getRandomWord(filter: WordFilter): Promise<string> {
  const where: any = {}
  
  if (filter.length) where.length = filter.length
  if (filter.difficulty) where.difficulty = filter.difficulty
  if (filter.category) where.category = filter.category
  if (filter.excludeWords?.length) {
    where.word = { notIn: filter.excludeWords }
  }

  // Toplam kelime sayısını al
  const totalCount = await prisma.word.count({ where })
  
  if (totalCount === 0) {
    throw new Error('Uygun kelime bulunamadı')
  }

  // Rastgele bir offset hesapla
  const randomOffset = Math.floor(Math.random() * totalCount)
  
  // Rastgele kelimeyi getir
  const word = await prisma.word.findFirst({
    where,
    skip: randomOffset,
    select: { word: true }
  })

  return word?.word || ''
}

// Kelime doğrulama
export async function validateWord(word: string): Promise<boolean> {
  if (!word || word.length < 3 || word.length > 8) {
    return false
  }

  // Türkçe karakter kontrolü
  const turkishPattern = /^[a-zA-ZçÇğĞıİöÖşŞüÜ]+$/
  if (!turkishPattern.test(word)) {
    return false
  }

  // Veritabanında kelime var mı kontrol et
  const existingWord = await prisma.word.findUnique({
    where: { word: word.toLowerCase() }
  })

  return !!existingWord
}

// Kelime ipucu alma
export async function getWordHint(targetWord: string): Promise<{
  category?: string
  firstLetter?: string
  length: number
}> {
  const word = await prisma.word.findUnique({
    where: { word: targetWord.toLowerCase() },
    select: { category: true }
  })

  return {
    category: word?.category || undefined,
    firstLetter: targetWord[0].toUpperCase(),
    length: targetWord.length
  }
}

// Kelime istatistikleri
export async function getWordStats() {
  const stats = await prisma.word.groupBy({
    by: ['length', 'difficulty'],
    _count: {
      _all: true
    }
  })

  return stats.reduce((acc, stat) => {
    const key = `${stat.length}_${stat.difficulty}`
    acc[key] = stat._count._all
    return acc
  }, {} as Record<string, number>)
}

// app/api/words/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateWord } from '@/lib/database/words'

export async function POST(request: NextRequest) {
  try {
    const { word } = await request.json()
    
    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Geçersiz kelime' },
        { status: 400 }
      )
    }

    const isValid = await validateWord(word)
    
    return NextResponse.json({ 
      isValid,
      word: word.toLowerCase()
    })
  } catch (error) {
    console.error('Word validation error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

// app/api/words/random/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getRandomWord } from '@/lib/database/words'

export async function POST(request: NextRequest) {
  try {
    const filter = await request.json()
    
    const word = await getRandomWord(filter)
    
    return NextResponse.json({ word })
  } catch (error) {
    console.error('Random word error:', error)
    return NextResponse.json(
      { error: 'Kelime alınamadı' },
      { status: 500 }
    )
  }
}

// lib/game/word-evaluation.ts
export interface LetterResult {
  letter: string
  status: 'correct' | 'present' | 'absent'
  position: number
}

// Tahmin değerlendirme algoritması
export function evaluateGuess(guess: string, targetWord: string): LetterResult[] {
  const guessArray = guess.toLowerCase().split('')
  const targetArray = targetWord.toLowerCase().split('')
  const result: LetterResult[] = []
  
  // İlk geçiş: Doğru pozisyondaki harfleri işaretle
  const targetCounts: Record<string, number> = {}
  const guessCounts: Record<string, number> = {}
  
  // Hedef kelimede harf sayılarını hesapla
  targetArray.forEach(letter => {
    targetCounts[letter] = (targetCounts[letter] || 0) + 1
  })
  
  // İlk geçiş: Doğru konumdaki harfler (yeşil)
  guessArray.forEach((letter, index) => {
    if (letter === targetArray[index]) {
      result[index] = {
        letter: letter.toUpperCase(),
        status: 'correct',
        position: index
      }
      targetCounts[letter]--
    } else {
      result[index] = {
        letter: letter.toUpperCase(),
        status: 'absent',
        position: index
      }
      guessCounts[letter] = (guessCounts[letter] || 0) + 1
    }
  })
  
  // İkinci geçiş: Yanlış konumdaki harfler (sarı)
  guessArray.forEach((letter, index) => {
    if (result[index].status === 'absent' && targetCounts[letter] > 0) {
      result[index].status = 'present'
      targetCounts[letter]--
    }
  })
  
  return result
}

// Klavye durumu güncelleme
export function updateKeyboardState(
  currentState: Record<string, 'correct' | 'present' | 'absent' | 'unused'>,
  guessResult: LetterResult[]
): Record<string, 'correct' | 'present' | 'absent' | 'unused'> {
  const newState = { ...currentState }
  
  guessResult.forEach(({ letter, status }) => {
    const key = letter.toLowerCase()
    const currentStatus = newState[key] || 'unused'
    
    // Priority: correct > present > absent > unused
    if (currentStatus === 'unused' || 
        (currentStatus === 'absent' && status !== 'absent') ||
        (currentStatus === 'present' && status === 'correct')) {
      newState[key] = status
    }
  })
  
  return newState
}

// Kelime veritabanı başlatma scripti
// scripts/seed-words.ts
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface WordData {
  word: string
  length: number
  difficulty: 'easy' | 'normal' | 'hard'
  category?: string
  frequency?: number
}

async function seedWords() {
  try {
    // words.json dosyasından kelimeleri oku
    const wordsPath = path.join(process.cwd(), 'data', 'words.json')
    const wordsData: WordData[] = JSON.parse(fs.readFileSync(wordsPath, 'utf8'))
    
    console.log(`${wordsData.length} kelime yükleniyor...`)
    
    // Mevcut kelimeleri temizle
    await prisma.word.deleteMany()
    
    // Yeni kelimeleri ekle (batch işlemi)
    const batchSize = 1000
    for (let i = 0; i < wordsData.length; i += batchSize) {
      const batch = wordsData.slice(i, i + batchSize)
      await prisma.word.createMany({
        data: batch.map(word => ({
          word: word.word.toLowerCase(),
          length: word.length,
          difficulty: word.difficulty,
          category: word.category,
          frequency: word.frequency || 0
        })),
        skipDuplicates: true
      })
      
      console.log(`${Math.min(i + batchSize, wordsData.length)} / ${wordsData.length} kelime işlendi`)
    }
    
    console.log('Kelime veritabanı başarıyla oluşturuldu!')
    
    // İstatistikleri göster
    const stats = await prisma.word.groupBy({
      by: ['length', 'difficulty'],
      _count: { _all: true }
    })
    
    console.log('\nKelime İstatistikleri:')
    stats.forEach(stat => {
      console.log(`${stat.length} harf, ${stat.difficulty}: ${stat._count._all} kelime`)
    })
    
  } catch (error) {
    console.error('Kelime yükleme hatası:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Script çalıştırma
if (require.main === module) {
  seedWords()
}

export { seedWords }