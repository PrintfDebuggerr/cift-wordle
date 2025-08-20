'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  X,
  Info
} from 'lucide-react';
import { useOfflineStatus } from '@/hooks/use-offline-status';

interface OfflineBannerProps {
  showOfflineData?: boolean;
  showConnectionQuality?: boolean;
  showSyncProgress?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

export function OfflineBanner({
  showOfflineData = true,
  showConnectionQuality = true,
  showSyncProgress = true,
  autoHide = true,
  autoHideDelay = 5000,
  className = ''
}: OfflineBannerProps) {
  const {
    isOnline,
    isOffline,
    networkStatus,
    connectionQuality,
    offlineData,
    offlineDataCount,
    syncOfflineData,
    isSyncing,
    syncProgress,
    willGoOffline,
    offlineConfidence
  } = useOfflineStatus();

  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-hide logic
  useEffect(() => {
    if (autoHide && isOnline && isVisible) {
      const timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [autoHide, autoHideDelay, isOnline, isVisible]);

  // Show banner when status changes
  useEffect(() => {
    if (isOffline || offlineDataCount > 0 || willGoOffline) {
      setIsVisible(true);
    }
  }, [isOffline, offlineDataCount, willGoOffline]);

  // Connection quality color mapping
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Connection quality icon mapping
  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'good':
        return <Info className="w-4 h-4 text-yellow-400" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  // Banner type determination
  const getBannerType = () => {
    if (isOffline) return 'offline';
    if (offlineDataCount > 0) return 'pending';
    if (willGoOffline) return 'warning';
    return 'online';
  };

  const bannerType = getBannerType();

  // Banner content based on type
  const getBannerContent = () => {
    switch (bannerType) {
      case 'offline':
        return {
          icon: <WifiOff className="w-5 h-5" />,
          title: 'İnternet Bağlantısı Yok',
          message: 'Çevrimdışı moddasınız. Bazı özellikler kullanılamayabilir.',
          color: 'bg-red-600/90 border-red-400/30',
          textColor: 'text-red-100'
        };
      
      case 'pending':
        return {
          icon: <RefreshCw className="w-5 h-5" />,
          title: 'Senkronizasyon Bekliyor',
          message: `${offlineDataCount} işlem senkronizasyon bekliyor.`,
          color: 'bg-yellow-600/90 border-yellow-400/30',
          textColor: 'text-yellow-100'
        };
      
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Bağlantı Sorunu',
          message: `İnternet bağlantınız zayıf. %${Math.round(offlineConfidence * 100)} ihtimalle çevrimdışı olabilirsiniz.`,
          color: 'bg-orange-600/90 border-orange-400/30',
          textColor: 'text-orange-100'
        };
      
      default:
        return {
          icon: <Wifi className="w-5 h-5" />,
          title: 'Çevrimiçi',
          message: 'İnternet bağlantınız aktif.',
          color: 'bg-green-600/90 border-green-400/30',
          textColor: 'text-green-100'
        };
    }
  };

  const content = getBannerContent();

  // Banner görünür değilse hiçbir şey gösterme
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top-4 duration-300 ${className}`}>
      <div className={`${content.color} backdrop-blur-xl border-b ${content.color.includes('border') ? '' : 'border-gray-400/30'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Status info */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {content.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`${content.textColor} font-semibold text-sm`}>
                  {content.title}
                </h3>
                <p className={`${content.textColor} text-xs opacity-90`}>
                  {content.message}
                </p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              {/* Connection quality indicator */}
              {showConnectionQuality && connectionQuality !== 'unknown' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-black/20 rounded-lg">
                  {getQualityIcon(connectionQuality)}
                  <span className={`text-xs ${getQualityColor(connectionQuality)}`}>
                    {connectionQuality === 'excellent' ? 'Mükemmel' :
                     connectionQuality === 'good' ? 'İyi' :
                     connectionQuality === 'poor' ? 'Zayıf' : 'Bilinmiyor'}
                  </span>
                </div>
              )}

              {/* Sync button for pending data */}
              {bannerType === 'pending' && (
                <Button
                  onClick={syncOfflineData}
                  disabled={isSyncing}
                  size="sm"
                  variant="ghost"
                  className={`${content.textColor} hover:bg-white/20 disabled:opacity-50`}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Senkronize...' : 'Senkronize Et'}
                </Button>
              )}

              {/* Details toggle */}
              {(showOfflineData || showConnectionQuality) && (
                <Button
                  onClick={() => setShowDetails(!showDetails)}
                  size="sm"
                  variant="ghost"
                  className={`${content.textColor} hover:bg-white/20`}
                >
                  {showDetails ? 'Gizle' : 'Detaylar'}
                </Button>
              )}

              {/* Close button */}
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
                className={`${content.textColor} hover:bg-white/20`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Details section */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Connection details */}
                {showConnectionQuality && (
                  <div className="space-y-2">
                    <h4 className={`${content.textColor} font-medium text-xs`}>
                      Bağlantı Bilgileri
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className={`${content.textColor} opacity-75`}>Tip:</span>
                        <span className={content.textColor}>
                          {networkStatus.connectionType || 'Bilinmiyor'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${content.textColor} opacity-75`}>Hız:</span>
                        <span className={content.textColor}>
                          {networkStatus.downlink ? `${networkStatus.downlink} Mbps` : 'Bilinmiyor'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${content.textColor} opacity-75`}>Gecikme:</span>
                        <span className={content.textColor}>
                          {networkStatus.rtt ? `${networkStatus.rtt}ms` : 'Bilinmiyor'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Offline data details */}
                {showOfflineData && offlineDataCount > 0 && (
                  <div className="space-y-2">
                    <h4 className={`${content.textColor} font-medium text-xs`}>
                      Bekleyen İşlemler ({offlineDataCount})
                    </h4>
                    <div className="space-y-1 text-xs">
                      {offlineData.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <span className={`${content.textColor} opacity-75`}>
                            {item.type === 'game_action' ? 'Oyun Aksiyonu' :
                             item.type === 'chat_message' ? 'Chat Mesajı' :
                             item.type === 'score_update' ? 'Skor Güncelleme' : 'Bilinmeyen'}
                          </span>
                          <span className={`${content.textColor} text-xs opacity-75`}>
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      {offlineDataCount > 3 && (
                        <div className={`${content.textColor} opacity-75 text-xs`}>
                          +{offlineDataCount - 3} daha...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sync progress */}
                {showSyncProgress && isSyncing && (
                  <div className="col-span-full space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`${content.textColor} text-xs`}>Senkronizasyon İlerlemesi</span>
                      <span className={`${content.textColor} text-xs`}>{Math.round(syncProgress)}%</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simplified offline indicator
export function OfflineIndicator({ className = '' }: { className?: string }) {
  const { isOnline, isOffline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Çevrimdışı</span>
      </div>
    </div>
  );
}

// Connection quality indicator
export function ConnectionQualityIndicator({ className = '' }: { className?: string }) {
  const { connectionQuality } = useOfflineStatus();

  if (connectionQuality === 'unknown') return null;

  const getQualityInfo = () => {
    switch (connectionQuality) {
      case 'excellent':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400', text: 'Mükemmel' };
      case 'good':
        return { icon: <Info className="w-4 h-4" />, color: 'text-yellow-400', text: 'İyi' };
      case 'poor':
        return { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400', text: 'Zayıf' };
      default:
        return { icon: <Info className="w-4 h-4" />, color: 'text-gray-400', text: 'Bilinmiyor' };
    }
  };

  const qualityInfo = getQualityInfo();

  return (
    <div className={`fixed top-4 left-4 z-50 ${className}`}>
      <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
        {qualityInfo.icon}
        <span className={`text-sm font-medium ${qualityInfo.color}`}>
          {qualityInfo.text}
        </span>
      </div>
    </div>
  );
}
