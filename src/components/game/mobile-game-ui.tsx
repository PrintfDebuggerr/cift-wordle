'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { WordGrid } from './word-grid';
import { MobileKeyboard } from './mobile-keyboard';
import { ChatPanel } from './chat-panel';
import { useGameStore } from '@/stores/game-store';
import { useGameActions } from '@/hooks/use-game-actions';
import { 
  MessageCircle, 
  Pause, 
  Play, 
  RotateCcw,
  Home,
  Settings,
  Volume2,
  VolumeX,
  HelpCircle,
  Trophy,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MobileGameUIProps {
  onPause: () => void;
  onResume: () => void;
  onLeave: () => void;
  onRestart: () => void;
  onGoHome: () => void;
  onViewStats: () => void;
  className?: string;
}

export function MobileGameUI({
  onPause,
  onResume,
  onLeave,
  onRestart,
  onGoHome,
  onViewStats,
  className = ''
}: MobileGameUIProps) {
  const [showChat, setShowChat] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentGuess, setCurrentGuess] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

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
    sendChatMessage
  } = useGameActions();

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

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if it's current player's turn
  const isPlayerTurn = gameState.currentPlayerId === currentPlayer?.id;
  const canMakeGuess = gameState.status === 'playing' && isPlayerTurn;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      {/* Game Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPauseMenu(true)}
            className="text-gray-600 dark:text-gray-400"
          >
            <Pause className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Çift Wordle
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span>{players.length}/2</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{formatTime(gameState.timeRemaining)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(!showChat)}
              className="text-gray-600 dark:text-gray-400 relative"
            >
              <MessageCircle className="w-5 h-5" />
              {chatMessages.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {Math.min(chatMessages.length, 9)}
                </div>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-600 dark:text-gray-400"
            >
              <Settings className="w-5 h-5" />
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
                      : 'bg-gray-400 text-gray-600 dark:text-gray-300'
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
      <ChatPanel
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

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
                    onResume();
                    setShowPauseMenu(false);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Devam Et
                </Button>
                
                <Button
                  onClick={() => {
                    onRestart();
                    setShowPauseMenu(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Yeniden Başlat
                </Button>
                
                <Button
                  onClick={() => {
                    onLeave();
                    setShowPauseMenu(false);
                  }}
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

      {/* Settings Menu */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl p-6 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ayarlar
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
              >
                <span className="text-2xl">×</span>
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Sound Settings */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-purple-600" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-gray-900 dark:text-white">Ses Efektleri</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={soundEnabled ? 'text-purple-600' : 'text-gray-400'}
                >
                  {soundEnabled ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
              
              {/* Haptics Settings */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 ${hapticsEnabled ? 'text-purple-600' : 'text-gray-400'}`}>
                    📳
                  </div>
                  <span className="text-gray-900 dark:text-white">Titreşim</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setHapticsEnabled(!hapticsEnabled)}
                  className={hapticsEnabled ? 'text-purple-600' : 'text-gray-400'}
                >
                  {hapticsEnabled ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
              
              {/* Help */}
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 dark:text-gray-400"
                onClick={() => {
                  // Show help modal
                  toast.info('Yardım özelliği yakında gelecek');
                }}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Yardım
              </Button>
              
              {/* Stats */}
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 dark:text-gray-400"
                onClick={() => {
                  onViewStats();
                  setShowSettings(false);
                }}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                İstatistikler
              </Button>
              
              {/* Achievements */}
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 dark:text-gray-400"
                onClick={() => {
                  // Show achievements
                  toast.info('Başarılar özelliği yakında gelecek');
                }}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Başarılar
              </Button>
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
                  onClick={() => {
                    onRestart();
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tekrar Oyna
                </Button>
                
                <Button
                  onClick={() => {
                    onGoHome();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ana Sayfa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
