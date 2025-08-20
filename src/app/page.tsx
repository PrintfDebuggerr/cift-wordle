"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MobileLayout, GameContainer } from '@/components/layout/mobile-layout'
import { CreateRoomModal } from '@/components/game/create-room-modal'
import { JoinRoomModal } from '@/components/game/join-room-modal'

export default function HomePage() {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

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
            className="text-lg py-4 h-14"
          >
            🚀 ODA OLUŞTUR
          </Button>
          
          <Button
            variant="secondary"
            size="full"
            onClick={() => setShowJoinModal(true)}
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
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-gray-400">
            Hazır
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
