'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  OfflineDetector, 
  NetworkStatus, 
  OfflineData,
  getOfflineDetector,
  isOnline,
  isOffline,
  getConnectionInfo,
  onNetworkChange,
  addOfflineData,
  getOfflineDataCount,
  clearAllOfflineData
} from '@/lib/utils/offline-detector';

export interface UseOfflineStatusOptions {
  autoStart?: boolean;
  onStatusChange?: (status: NetworkStatus) => void;
  onOfflineDataChange?: (data: OfflineData[]) => void;
  syncInterval?: number; // ms
}

export interface UseOfflineStatusReturn {
  // Network status
  isOnline: boolean;
  isOffline: boolean;
  networkStatus: NetworkStatus;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  
  // Offline data management
  offlineData: OfflineData[];
  offlineDataCount: number;
  addOfflineData: (type: OfflineData['type'], data: any) => string;
  removeOfflineData: (id: string) => boolean;
  clearOfflineData: () => void;
  
  // Sync operations
  syncOfflineData: () => Promise<void>;
  isSyncing: boolean;
  syncProgress: number;
  
  // Connection prediction
  willGoOffline: boolean;
  offlineConfidence: number;
  
  // Manual controls
  startMonitoring: () => void;
  stopMonitoring: () => void;
  refreshStatus: () => void;
}

export function useOfflineStatus(options: UseOfflineStatusOptions = {}): UseOfflineStatusReturn {
  const {
    autoStart = true,
    onStatusChange,
    onOfflineDataChange,
    syncInterval = 30000 // 30 seconds
  } = options;

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isOffline: false
  });
  
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const detectorRef = useRef<OfflineDetector | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Network status derived values
  const isOnlineStatus = networkStatus.isOnline;
  const isOfflineStatus = networkStatus.isOffline;
  
  // Connection quality
  const connectionQuality = detectorRef.current?.getConnectionQuality() || 'unknown';
  
  // Offline prediction
  const offlinePrediction = detectorRef.current?.predictOfflineStatus() || { 
    willGoOffline: false, 
    confidence: 0.9 
  };

  // Initialize offline detector
  const initializeDetector = useCallback(() => {
    if (!detectorRef.current) {
      detectorRef.current = getOfflineDetector();
    }
  }, []);

  // Network status update handler
  const handleStatusChange = useCallback((status: NetworkStatus) => {
    setNetworkStatus(status);
    onStatusChange?.(status);
  }, [onStatusChange]);

  // Offline data update handler
  const handleOfflineDataChange = useCallback((data: OfflineData[]) => {
    setOfflineData(data);
    onOfflineDataChange?.(data);
  }, [onOfflineDataChange]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    initializeDetector();
    
    if (detectorRef.current) {
      // Network status listener
      unsubscribeRef.current = detectorRef.current.addListener(handleStatusChange);
      
      // Initial status
      const currentStatus = detectorRef.current.getNetworkStatus();
      handleStatusChange(currentStatus);
      
      // Offline data listener (polling)
      const updateOfflineData = () => {
        if (detectorRef.current) {
          const data = detectorRef.current.getOfflineData();
          handleOfflineDataChange(data);
        }
      };
      
      updateOfflineData();
      
      // Sync interval
      syncIntervalRef.current = setInterval(updateOfflineData, syncInterval);
      
      console.log('Offline status monitoring started');
    }
  }, [initializeDetector, handleStatusChange, handleOfflineDataChange, syncInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    console.log('Offline status monitoring stopped');
  }, []);

  // Refresh network status
  const refreshStatus = useCallback(() => {
    if (detectorRef.current) {
      const currentStatus = detectorRef.current.getNetworkStatus();
      handleStatusChange(currentStatus);
    }
  }, [handleStatusChange]);

  // Sync offline data
  const syncOfflineData = useCallback(async () => {
    if (!detectorRef.current || !isOnlineStatus) return;

    setIsSyncing(true);
    setSyncProgress(0);
    
    try {
      const data = detectorRef.current.getOfflineData();
      const totalItems = data.length;
      
      if (totalItems === 0) {
        setSyncProgress(100);
        return;
      }

      let completedItems = 0;
      
      for (const item of data) {
        try {
          // Sync işlemi (detector içinde yapılıyor)
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulated delay
          completedItems++;
          setSyncProgress((completedItems / totalItems) * 100);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }
      
      // Sync sonrası güncelle
      if (detectorRef.current) {
        const updatedData = detectorRef.current.getOfflineData();
        handleOfflineDataChange(updatedData);
      }
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [isOnlineStatus, handleOfflineDataChange]);

  // Add offline data
  const addOfflineDataItem = useCallback((type: OfflineData['type'], data: any): string => {
    if (detectorRef.current) {
      const id = detectorRef.current.addOfflineData({ type, data });
      
      // Local state'i güncelle
      const newOfflineData = detectorRef.current.getOfflineData();
      handleOfflineDataChange(newOfflineData);
      
      return id;
    }
    return '';
  }, [handleOfflineDataChange]);

  // Remove offline data
  const removeOfflineDataItem = useCallback((id: string): boolean => {
    if (detectorRef.current) {
      const success = detectorRef.current.removeOfflineData(id);
      
      if (success) {
        const updatedData = detectorRef.current.getOfflineData();
        handleOfflineDataChange(updatedData);
      }
      
      return success;
    }
    return false;
  }, [handleOfflineDataChange]);

  // Clear offline data
  const clearOfflineDataItems = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.clearOfflineData();
      handleOfflineDataChange([]);
    }
  }, [handleOfflineDataChange]);

  // Effect: Auto-start monitoring
  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [autoStart, startMonitoring, stopMonitoring]);

  // Effect: Auto-sync when coming back online
  useEffect(() => {
    if (isOnlineStatus && offlineData.length > 0) {
      // Online olduğumuzda offline data'yı sync et
      const timeoutId = setTimeout(() => {
        syncOfflineData();
      }, 1000); // 1 saniye bekle
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOnlineStatus, offlineData.length, syncOfflineData]);

  // Effect: Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    // Network status
    isOnline: isOnlineStatus,
    isOffline: isOfflineStatus,
    networkStatus,
    connectionQuality,
    
    // Offline data management
    offlineData,
    offlineDataCount: offlineData.length,
    addOfflineData: addOfflineDataItem,
    removeOfflineData: removeOfflineDataItem,
    clearOfflineData: clearOfflineDataItems,
    
    // Sync operations
    syncOfflineData,
    isSyncing,
    syncProgress,
    
    // Connection prediction
    willGoOffline: offlinePrediction.willGoOffline,
    offlineConfidence: offlinePrediction.confidence,
    
    // Manual controls
    startMonitoring,
    stopMonitoring,
    refreshStatus
  };
}

// Simplified offline status hook
export function useSimpleOfflineStatus(): {
  isOnline: boolean;
  isOffline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
} {
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');

  useEffect(() => {
    const updateStatus = () => {
      const online = navigator.onLine;
      setIsOnlineStatus(online);
      
      // Connection quality estimation
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection.effectiveType) {
          if (connection.effectiveType === '4g' && connection.downlink > 10) {
            setConnectionQuality('excellent');
          } else if (connection.effectiveType === '3g' || connection.downlink > 5) {
            setConnectionQuality('good');
          } else {
            setConnectionQuality('poor');
          }
        }
      }
    };

    // Initial status
    updateStatus();

    // Event listeners
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return {
    isOnline: isOnlineStatus,
    isOffline: !isOnlineStatus,
    connectionQuality
  };
}

// Offline data hook
export function useOfflineData(): {
  data: OfflineData[];
  count: number;
  add: (type: OfflineData['type'], data: any) => string;
  remove: (id: string) => boolean;
  clear: () => void;
  sync: () => Promise<void>;
} {
  const { offlineData, addOfflineData, removeOfflineData, clearOfflineData, syncOfflineData } = useOfflineStatus();

  return {
    data: offlineData,
    count: offlineData.length,
    add: addOfflineData,
    remove: removeOfflineData,
    clear: clearOfflineData,
    sync: syncOfflineData
  };
}

// Connection quality hook
export function useConnectionQuality(): {
  quality: 'excellent' | 'good' | 'poor' | 'unknown';
  details: {
    type: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null;
} {
  const [quality, setQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');
  const [details, setDetails] = useState<{
    type: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null>(null);

  useEffect(() => {
    const updateQuality = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        
        const connectionDetails = {
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        };
        
        setDetails(connectionDetails);
        
        // Quality assessment
        if (connectionDetails.downlink >= 10 && connectionDetails.rtt <= 50) {
          setQuality('excellent');
        } else if (connectionDetails.downlink >= 5 && connectionDetails.rtt <= 100) {
          setQuality('good');
        } else if (connectionDetails.downlink > 0) {
          setQuality('poor');
        } else {
          setQuality('unknown');
        }
      }
    };

    updateQuality();
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateQuality);
      
      return () => {
        connection.removeEventListener('change', updateQuality);
      };
    }
  }, []);

  return { quality, details };
}

