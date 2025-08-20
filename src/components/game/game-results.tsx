'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/game-store';
import { useGameActions } from '@/hooks/use-game-actions';
import { GameResult, Player, Achievement } from '@/types/game';
import { 
  Trophy, 
  Medal, 
  Star, 
  Share2, 
  RotateCcw,
  Home,
  BarChart3,
  Gift,
  Target,
  Clock,
  Zap,
  Heart
} from 'lucide-react';

interface GameResultsProps {
  result: GameResult;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onViewStats: () => void;
  className?: string;
}

export function GameResults({ 
  result, 
  onPlayAgain, 
  onGoHome, 
  onViewStats,
  className = '' 
}: GameResultsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  
  const { players, currentPlayer } = useGameStore();
  const { addAchievement } = useGameActions();

  // Determine winner and loser
  const winner = players.find(p => p.id === result.winnerId);
  const loser = players.find(p => p.id !== result.winnerId);
  const isWinner = result.winnerId === currentPlayer?.id;

  // Calculate game statistics
  const totalGuesses = players.reduce((sum, p) => sum + (p.score || 0), 0);
  const averageGuesses = totalGuesses / players.length;
  const gameDuration = Math.floor((Date.now() - result.timestamp) / 1000);

  // Share game results
  const shareResults = async () => {
    const shareText = `Çift Wordle'da ${isWinner ? 'kazandım' : 'kaybettim'}! 🎯\n` +
                     `Kelime: ${result.word}\n` +
                     `Skor: ${result.score}\n` +
                     `Oyna: [URL]`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Çift Wordle Sonucu',
          text: shareText
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        // Show toast or notification
      } catch (error) {
        console.error('Failed to copy to clipboard');
      }
    }
  };

  // Mock achievements (in real app, these would come from the server)
  const mockAchievements: Achievement[] = [
    {
      id: '1',
      name: 'İlk Zafer',
      description: 'İlk oyununuzu kazandınız!',
      icon: '🏆',
      unlocked: isWinner,
      rarity: 'common'
    },
    {
      id: '2',
      name: 'Hızlı Düşünür',
      description: '5 dakikadan kısa sürede oyunu bitirdiniz',
      icon: '⚡',
      unlocked: gameDuration < 300,
      rarity: 'rare'
    },
    {
      id: '3',
      name: 'Mükemmel Oyun',
      description: '3 tahmin veya daha azda kazandınız',
      icon: '⭐',
      unlocked: result.score <= 3,
      rarity: 'epic'
    }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-center text-white">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          {isWinner ? (
            <Trophy className="w-10 h-10 text-yellow-300" />
          ) : (
            <Medal className="w-10 h-10 text-gray-300" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-2">
          {isWinner ? 'Tebrikler! Kazandınız! 🎉' : 'Oyun Bitti'}
        </h2>
        
        <p className="text-purple-100">
          {isWinner 
            ? 'Harika bir oyun oynadınız!' 
            : 'Bir dahaki sefere daha iyi olacaksınız!'
          }
        </p>
      </div>

      {/* Game Summary */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kelime</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
              {result.word}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Skor</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {result.score}
            </p>
          </div>
        </div>

        {/* Players Results */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Oyuncu Sonuçları
          </h3>
          
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === result.winnerId
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-gray-100 dark:bg-gray-600/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    player.id === result.winnerId
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-400 text-gray-600 dark:text-gray-300'
                  }`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {player.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {player.id === result.winnerId ? 'Kazanan' : 'Kaybeden'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {player.score || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    tahmin
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Statistics */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Oyun İstatistikleri
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Süre</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {Math.floor(gameDuration / 60)}:{String(gameDuration % 60).padStart(2, '0')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ortalama</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {averageGuesses.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Achievements Preview */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Başarılar
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAchievements(!showAchievements)}
            >
              {showAchievements ? 'Gizle' : 'Göster'}
            </Button>
          </div>
          
          {showAchievements ? (
            <div className="space-y-3">
              {mockAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    achievement.unlocked
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-100 dark:bg-gray-600/50 opacity-50'
                  }`}
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      achievement.unlocked 
                        ? 'text-yellow-800 dark:text-yellow-200' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {achievement.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.unlocked && (
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <Gift className="w-4 h-4" />
              <span className="text-sm">
                {mockAchievements.filter(a => a.unlocked).length} başarı kazandınız
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Tekrar Oyna
          </Button>
          
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={shareResults}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Paylaş
            </Button>
            
            <Button
              onClick={onViewStats}
              variant="outline"
              className="flex-1"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              İstatistik
            </Button>
            
            <Button
              onClick={onGoHome}
              variant="outline"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-1" />
              Ana Sayfa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact results component for mobile
interface CompactGameResultsProps {
  result: GameResult;
  onPlayAgain: () => void;
  onGoHome: () => void;
  className?: string;
}

export function CompactGameResults({ result, onPlayAgain, onGoHome, className = '' }: CompactGameResultsProps) {
  const { players, currentPlayer } = useGameStore();
  const isWinner = result.winnerId === currentPlayer?.id;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
          isWinner ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          {isWinner ? (
            <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          ) : (
            <Heart className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {isWinner ? 'Kazandınız! 🎉' : 'Oyun Bitti'}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400">
          Kelime: <span className="font-mono font-bold">{result.word}</span>
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onPlayAgain}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          Tekrar Oyna
        </Button>
        
        <Button
          onClick={onGoHome}
          variant="outline"
          className="w-full"
        >
          Ana Sayfa
        </Button>
      </div>
    </div>
  );
}

// Results summary for leaderboards
interface ResultsSummaryProps {
  results: GameResult[];
  className?: string;
}

export function ResultsSummary({ results, className = '' }: ResultsSummaryProps) {
  const totalGames = results.length;
  const wins = results.filter(r => r.winnerId).length;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
  const averageScore = totalGames > 0 
    ? results.reduce((sum, r) => sum + r.score, 0) / totalGames 
    : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
        Genel İstatistikler
      </h3>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {totalGames}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Oyun</p>
        </div>
        
        <div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {winRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Kazanma</p>
        </div>
        
        <div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {averageScore.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Ortalama</p>
        </div>
      </div>
    </div>
  );
}

