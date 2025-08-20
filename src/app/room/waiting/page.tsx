'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { Button } from '@/components/ui/button';
import { useRoom } from '@/hooks/use-room';
import { 
  Users, 
  Copy, 
  Check, 
  Play, 
  Settings,
  ArrowLeft,
  Crown,
  Clock,
  Gamepad2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WaitingRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('code');
  
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Oda kodu yoksa ana sayfaya yönlendir
  if (!roomCode) {
    router.push('/');
    return null;
  }

  // useRoom hook'unu kullan
  const {
    players,
    isHost,
    canStart,
    isConnected,
    toggleReady,
    startGame,
    leaveRoom
  } = useRoom(roomCode);

  // Auto-start countdown when both players are ready
  useEffect(() => {
    if (canStart) {
      setCountdown(5);
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            if (prev === 1) {
              startGame();
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [canStart, startGame]);

  // Copy room code to clipboard
  const copyRoomCode = async () => {
    if (roomCode) {
      try {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        toast.success('Oda kodu kopyalandı!');
        
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Kopyalama başarısız');
      }
    }
  };

  // Share room
  const shareRoom = async () => {
    if (navigator.share && roomCode) {
      try {
        await navigator.share({
          title: 'Çift Wordle - Odaya Katıl!',
          text: `Çift Wordle oyununa katılmak için bu kodu kullan: ${roomCode}`,
          url: `${window.location.origin}/room/waiting?code=${roomCode}`
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy URL
      await copyRoomCode();
    }
  };

  // Handle leave game
  const handleLeaveGame = () => {
    leaveRoom();
    router.push('/');
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-safe-area-inset-top pb-safe-area-inset-bottom">
        {/* Header */}
        <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveGame}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Çık
            </Button>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-white">Bekleme Odası</h1>
              <p className="text-sm text-gray-400">Oda: {roomCode}</p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-6 space-y-6">
          {/* Connection Status */}
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white font-medium">
                {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
              </span>
            </div>
          </div>

          {/* Room Code Section */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">Oda Kodu</h2>
              <p className="text-gray-400 text-sm">Arkadaşınızla paylaşın</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-xl mb-4">
              <div className="text-3xl font-bold text-white tracking-widest text-center">
                {roomCode}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={copyRoomCode}
                size="full"
                className="bg-green-600 hover:bg-green-700"
              >
                {copied ? '✅ Kopyalandı!' : '📋 Kodu Kopyala'}
              </Button>
              
              <Button
                onClick={shareRoom}
                variant="secondary"
                size="full"
              >
                📤 Paylaş
              </Button>
            </div>
          </div>

          {/* Players Section */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Oyuncular</h2>
              <div className="flex items-center text-gray-400">
                <Users className="w-5 h-5 mr-2" />
                <span>{players.length}/2</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    player.isReady
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 bg-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    {isHost && <Crown className="w-4 h-4 text-yellow-400 mr-2" />}
                    <span className="text-white font-medium">{player.name}</span>
                  </div>
                  
                  <div className="flex items-center">
                    {player.isReady ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
              
              {players.length < 2 && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>İkinci oyuncu bekleniyor...</p>
                  <p className="text-sm mt-1">Oda kodunu arkadaşınızla paylaşın</p>
                </div>
              )}
            </div>
          </div>

          {/* Game Controls */}
          {players.length === 2 && (
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <div className="space-y-4">
                {/* Ready Button */}
                <Button
                  onClick={toggleReady}
                  size="full"
                  variant="secondary"
                >
                  ⏳ Hazır Değilim
                </Button>
                
                {/* Start Game Button */}
                {canStart && (
                  <Button
                    onClick={startGame}
                    size="full"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Oyunu Başlat
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Countdown */}
          {countdown !== null && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="text-8xl font-bold text-white mb-4">{countdown}</div>
                <p className="text-xl text-gray-300">Oyun başlıyor...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
