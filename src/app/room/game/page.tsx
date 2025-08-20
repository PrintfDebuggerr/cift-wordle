'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { Button } from '@/components/ui/button';
import { WordGrid } from '@/components/game/word-grid';
import { MobileKeyboard } from '@/components/game/mobile-keyboard';
import { useGameSocket } from '@/hooks/use-game-socket';
import { useGameActions } from '@/hooks/use-game-actions';
import { useGameStore } from '@/stores/game-store';
import { 
  ArrowLeft, 
  Pause, 
  Play, 
  RotateCcw,
  MessageCircle,
  Users,
  Timer,
  Trophy,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function GamePage() {
  const router = useRouter();
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentGuess, setCurrentGuess] = useState('');

  const {
    isConnected,
    connectionError
  } = useGameSocket();

  const {
    gameState,
    players,
    currentPlayer,
    guesses,
    chatMessages
  } = useGameStore();

  const {
    makeGuess,
    pauseGame,
    resumeGame,
    leaveGame,
    sendChatMessage
  } = useGameActions({
    onGameAction: (action, data) => {
      console.log('Game action:', action, data);
    }
  });

  // Handle letter input
  const handleLetterInput = useCallback((letter: string) => {
    if (currentGuess.length < gameState.wordLength) {
      setCurrentGuess(prev => prev + letter);
    }
  }, [currentGuess.length, gameState.wordLength]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setCurrentGuess(prev => prev.slice(0, -1));
  }, []);

  // Handle guess submission
  const handleSubmitGuess = useCallback(async () => {
    if (currentGuess.length !== gameState.wordLength) {
      toast.error(`Kelime ${gameState.wordLength} harf olmalı`);
      return;
    }

    try {
      const result = await makeGuess(currentGuess);
      if (result.success) {
        setCurrentGuess('');
        toast.success('Tahmin gönderildi!');
      } else {
        toast.error(result.error || 'Tahmin gönderilemedi');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  }, [currentGuess, gameState.wordLength, makeGuess]);

  // Handle pause/resume
  const handlePauseToggle = () => {
    if (gameState.status === 'playing') {
      pauseGame();
      setShowPauseMenu(true);
    } else if (gameState.status === 'paused') {
      resumeGame();
      setShowPauseMenu(false);
    }
  };

  // Handle leave game
  const handleLeaveGame = () => {
    leaveGame();
    router.push('/');
  };

  // Handle restart game
  const handleRestartGame = () => {
    // This would typically be implemented with server-side logic
    toast.info('Yeniden başlatma özelliği yakında gelecek');
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if it's current player's turn
  const isPlayerTurn = gameState.currentPlayerId === currentPlayer?.id;
  const canMakeGuess = gameState.status === 'playing' && isPlayerTurn;

  if (!isConnected) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Bağlantı Hatası
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {connectionError || 'Sunucuya bağlanılamadı'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Tekrar Dene
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        {/* Game Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPauseMenu(true)}
              className="text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Çift Wordle
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{players.length}/2</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  <span>{formatTime(gameState.timeRemaining)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(!showChat)}
                className="text-gray-600 dark:text-gray-400"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePauseToggle}
                className="text-gray-600 dark:text-gray-400"
              >
                {gameState.status === 'playing' ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Game Status */}
        <div className="px-6 py-4">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  gameState.status === 'playing' ? 'bg-green-500' :
                  gameState.status === 'paused' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {gameState.status === 'playing' ? 'Oyun Devam Ediyor' :
                   gameState.status === 'paused' ? 'Duraklatıldı' :
                   'Oyun Bitti'}
                </span>
              </div>
              
              {gameState.status === 'playing' && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isPlayerTurn ? 'Sıra sizde' : 'Rakibin sırası'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Players Info */}
        <div className="px-6 mb-4">
          <div className="grid grid-cols-2 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-3 border-2 transition-all duration-200 ${
                  player.id === gameState.currentPlayerId
                    ? 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-900/20'
                    : 'border-gray-200/50 dark:border-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      player.id === gameState.currentPlayerId
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {player.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Skor: {player.score}
                      </p>
                    </div>
                  </div>
                  
                  {player.id === gameState.currentPlayerId && (
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Word Grid */}
        <div className="px-6 mb-6">
          <WordGrid
            guesses={guesses}
            wordLength={gameState.wordLength}
            maxGuesses={6}
            currentGuess={currentGuess}
            isPlayerTurn={isPlayerTurn}
            gameStatus={gameState.status}
          />
        </div>

        {/* Current Guess Display */}
        {currentGuess && (
          <div className="px-6 mb-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Mevcut Tahmin
                </p>
                <div className="font-mono text-2xl font-bold text-gray-900 dark:text-white tracking-wider">
                  {currentGuess}
                </div>
                <div className="mt-3 flex gap-2 justify-center">
                  <Button
                    onClick={handleBackspace}
                    variant="outline"
                    size="sm"
                    disabled={currentGuess.length === 0}
                  >
                    Sil
                  </Button>
                  <Button
                    onClick={handleSubmitGuess}
                    disabled={!canMakeGuess || currentGuess.length !== gameState.wordLength}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Gönder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Keyboard */}
        <div className="px-6 mb-6">
          <MobileKeyboard
            onLetterPress={handleLetterInput}
            onBackspace={handleBackspace}
            onEnter={handleSubmitGuess}
            disabled={!canMakeGuess}
            letterStates={guesses.flatMap(g => g.result || [])}
          />
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl p-6 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sohbet
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChat(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-3 mb-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.playerId === currentPlayer?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.playerId === currentPlayer?.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-xs opacity-75 mb-1">
                        {message.playerName}
                      </p>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        sendChatMessage(input.value.trim());
                        input.value = '';
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input') as HTMLInputElement;
                    if (input?.value.trim()) {
                      sendChatMessage(input.value.trim());
                      input.value = '';
                    }
                  }}
                  size="sm"
                >
                  Gönder
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pause Menu */}
        {showPauseMenu && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">
                  Oyun Duraklatıldı
                </h3>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      resumeGame();
                      setShowPauseMenu(false);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Devam Et
                  </Button>
                  
                  <Button
                    onClick={handleRestartGame}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Yeniden Başlat
                  </Button>
                  
                  <Button
                    onClick={handleLeaveGame}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Oyundan Çık
                  </Button>
                  
                  <Button
                    onClick={() => setShowPauseMenu(false)}
                    variant="ghost"
                    className="w-full"
                  >
                    İptal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState.status === 'finished' && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Oyun Bitti!
                </h3>
                
                {gameState.winnerId ? (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {gameState.winnerId === currentPlayer?.id ? 'Tebrikler! Kazandınız!' : 'Kaybettiniz!'}
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Süre doldu!
                  </p>
                )}
                
                <div className="space-y-3">
                  <Button
                    onClick={handleRestartGame}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tekrar Oyna
                  </Button>
                  
                  <Button
                    onClick={handleLeaveGame}
                    variant="outline"
                    className="w-full"
                  >
                    Ana Menüye Dön
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
