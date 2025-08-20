// Offline detection utilities
export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface OfflineData {
  id: string;
  type: 'game_action' | 'chat_message' | 'score_update';
  data: any;
  timestamp: number;
  retryCount: number;
}

export class OfflineDetector {
  private isOnline: boolean = navigator.onLine;
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private offlineData: OfflineData[] = [];
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Online/offline event listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Network information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }

    // Service Worker message handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    }

    // Initial status check
    this.updateStatus();
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.updateStatus();
    this.syncOfflineData();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.updateStatus();
  }

  private handleConnectionChange(): void {
    this.updateStatus();
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    if (event.data.type === 'NETWORK_STATUS_CHANGE') {
      this.isOnline = event.data.isOnline;
      this.updateStatus();
    }
  }

  private updateStatus(): void {
    const status = this.getNetworkStatus();
    
    // Listeners'ları güncelle
    this.listeners.forEach(listener => listener(status));
    
    // Console'da log
    console.log('Network status changed:', status);
  }

  public getNetworkStatus(): NetworkStatus {
    const baseStatus: NetworkStatus = {
      isOnline: this.isOnline,
      isOffline: !this.isOnline
    };

    // Network Information API varsa ek bilgileri al
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      return {
        ...baseStatus,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };
    }

    return baseStatus;
  }

  public addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Immediate callback with current status
    listener(this.getNetworkStatus());
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public removeListener(listener: (status: NetworkStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Offline data management
  public addOfflineData(data: Omit<OfflineData, 'id' | 'timestamp' | 'retryCount'>): string {
    const id = crypto.randomUUID();
    const offlineData: OfflineData = {
      ...data,
      id,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.offlineData.push(offlineData);
    this.saveOfflineDataToStorage();
    
    console.log('Added offline data:', offlineData);
    return id;
  }

  public removeOfflineData(id: string): boolean {
    const index = this.offlineData.findIndex(data => data.id === id);
    if (index > -1) {
      this.offlineData.splice(index, 1);
      this.saveOfflineDataToStorage();
      return true;
    }
    return false;
  }

  public getOfflineData(): OfflineData[] {
    return [...this.offlineData];
  }

  public clearOfflineData(): void {
    this.offlineData = [];
    this.saveOfflineDataToStorage();
  }

  private saveOfflineDataToStorage(): void {
    try {
      localStorage.setItem('offline_data', JSON.stringify(this.offlineData));
    } catch (error) {
      console.error('Failed to save offline data to storage:', error);
    }
  }

  private loadOfflineDataFromStorage(): void {
    try {
      const stored = localStorage.getItem('offline_data');
      if (stored) {
        this.offlineData = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline data from storage:', error);
    }
  }

  // Sync queue management
  public addToSyncQueue(syncFunction: () => Promise<void>): void {
    this.syncQueue.push(syncFunction);
    
    // Online ise hemen sync et
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    console.log(`Processing sync queue with ${this.syncQueue.length} items`);

    try {
      while (this.syncQueue.length > 0) {
        const syncFunction = this.syncQueue.shift();
        if (syncFunction) {
          try {
            await syncFunction();
          } catch (error) {
            console.error('Sync function failed:', error);
            // Başarısız olanı tekrar kuyruğa ekle
            this.syncQueue.unshift(syncFunction);
            break;
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  // Offline data synchronization
  private async syncOfflineData(): Promise<void> {
    if (!this.isOnline || this.offlineData.length === 0) return;

    console.log(`Syncing ${this.offlineData.length} offline data items`);

    const itemsToRemove: string[] = [];

    for (const item of this.offlineData) {
      try {
        await this.syncOfflineItem(item);
        itemsToRemove.push(item.id);
      } catch (error) {
        console.error(`Failed to sync offline item ${item.id}:`, error);
        
        // Retry count'u artır
        item.retryCount++;
        
        // Max retry sayısını aştıysa sil
        if (item.retryCount >= 3) {
          console.warn(`Max retry count exceeded for item ${item.id}, removing`);
          itemsToRemove.push(item.id);
        }
      }
    }

    // Başarıyla sync edilenleri kaldır
    itemsToRemove.forEach(id => this.removeOfflineData(id));
  }

  private async syncOfflineItem(item: OfflineData): Promise<void> {
    // Item type'a göre sync işlemi
    switch (item.type) {
      case 'game_action':
        await this.syncGameAction(item.data);
        break;
      case 'chat_message':
        await this.syncChatMessage(item.data);
        break;
      case 'score_update':
        await this.syncScoreUpdate(item.data);
        break;
      default:
        throw new Error(`Unknown offline data type: ${item.type}`);
    }
  }

  private async syncGameAction(data: any): Promise<void> {
    // Game action'ı sunucuya gönder
    const response = await fetch('/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync game action: ${response.statusText}`);
    }
  }

  private async syncChatMessage(data: any): Promise<void> {
    // Chat mesajını sunucuya gönder
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync chat message: ${response.statusText}`);
    }
  }

  private async syncScoreUpdate(data: any): Promise<void> {
    // Score update'i sunucuya gönder
    const response = await fetch('/api/score/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync score update: ${response.statusText}`);
    }
  }

  // Connection quality assessment
  public getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'unknown' {
    const status = this.getNetworkStatus();
    
    if (!status.downlink || !status.rtt) {
      return 'unknown';
    }

    // Downlink ve RTT'e göre kalite değerlendirmesi
    if (status.downlink >= 10 && status.rtt <= 50) {
      return 'excellent';
    } else if (status.downlink >= 5 && status.rtt <= 100) {
      return 'good';
    } else {
      return 'poor';
    }
  }

  // Predictive offline detection
  public predictOfflineStatus(): { willGoOffline: boolean; confidence: number } {
    const status = this.getNetworkStatus();
    
    if (status.connectionType === 'cellular') {
      // Cellular bağlantıda sinyal kalitesi düşükse offline olabilir
      if (status.effectiveType === 'slow-2g' || status.effectiveType === '2g') {
        return { willGoOffline: true, confidence: 0.8 };
      }
    }

    // RTT yüksekse bağlantı sorunlu olabilir
    if (status.rtt && status.rtt > 200) {
      return { willGoOffline: true, confidence: 0.6 };
    }

    return { willGoOffline: false, confidence: 0.9 };
  }

  // Cleanup
  public destroy(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.removeEventListener('change', this.handleConnectionChange.bind(this));
    }

    this.listeners = [];
    this.offlineData = [];
    this.syncQueue = [];
  }
}

// Singleton instance
let offlineDetectorInstance: OfflineDetector | null = null;

export function getOfflineDetector(): OfflineDetector {
  if (!offlineDetectorInstance) {
    offlineDetectorInstance = new OfflineDetector();
  }
  return offlineDetectorInstance;
}

// Utility functions
export function isOnline(): boolean {
  return navigator.onLine;
}

export function isOffline(): boolean {
  return !navigator.onLine;
}

export function getConnectionInfo(): NetworkStatus | null {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      isOnline: navigator.onLine,
      isOffline: !navigator.onLine,
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }
  
  return {
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine
  };
}

// Network change detection
export function onNetworkChange(callback: (status: NetworkStatus) => void): () => void {
  const detector = getOfflineDetector();
  return detector.addListener(callback);
}

// Offline data helpers
export function addOfflineData(type: OfflineData['type'], data: any): string {
  const detector = getOfflineDetector();
  return detector.addOfflineData({ type, data });
}

export function getOfflineDataCount(): number {
  const detector = getOfflineDetector();
  return detector.getOfflineData().length;
}

export function clearAllOfflineData(): void {
  const detector = getOfflineDetector();
  detector.clearOfflineData();
}

