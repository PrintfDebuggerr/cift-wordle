# Çift Wordle - Oyun Fonksiyonları ve Dinamikleri

## 🎮 Temel Oyun Fonksiyonları

### 1. Oda Yönetimi Fonksiyonları

#### `createRoom()`
```typescript
interface CreateRoomConfig {
  playerName: string;
  gameMode: 'turn-based' | 'duel';
  wordLength: 4 | 5 | 6;
  difficulty: 'easy' | 'normal' | 'hard';
  timeLimit: number; // saniye
  maxGuesses: number;
}

function createRoom(config: CreateRoomConfig): Promise<RoomData> {
  // 1. Benzersiz oda kodu oluştur (6 karakter)
  // 2. Veritabanında oda kaydını oluştur
  // 3. Redis'te oda durumunu initialize et
  // 4. WebSocket room'una join et
  // 5. Oda bilgilerini döndür
}
```

#### `joinRoom()`
```typescript
function joinRoom(roomCode: string, playerName: string): Promise<RoomData> {
  // 1. Oda kodunun geçerliliğini kontrol et
  // 2. Oda kapasitesini kontrol et (max 2 oyuncu)
  // 3. Oyuncu isminin uygunluğunu kontrol et
  // 4. Oyuncuyu oda listesine ekle
  // 5. Diğer oyuncuya bildirim gönder
  // 6. Oda durumunu güncelle
}
```

#### `leaveRoom()`
```typescript
function leaveRoom(roomId: string, playerId: string): void {
  // 1. Oyuncuyu odadan çıkar
  // 2. Aktif oyun varsa duraklat/sonlandır
  // 3. Diğer oyuncuya bildirim gönder
  // 4. 30 saniye reconnect timeout başlat
  // 5. Oda boşsa temizle
}
```

### 2. Kelime Yönetimi Fonksiyonları

#### `getRandomWord()`
```typescript
interface WordConfig {
  length: number;
  difficulty: 'easy' | 'normal' | 'hard';
  category?: string;
  excludeWords?: string[];
}

function getRandomWord(config: WordConfig): Promise<string> {
  // 1. Veritabanından kriterlere uygun kelimeleri filtrele
  // 2. Zorluk seviyesine göre kelime seç
  // 3. Günlük kelime geçmişini kontrol et (tekrar önleme)
  // 4. Rastgele kelime döndür
}
```

#### `validateWord()`
```typescript
function validateWord(word: string): Promise<boolean> {
  // 1. Kelime uzunluğunu kontrol et
  // 2. Türkçe karakter kontrolü
  // 3. Kelime sözlük kontrolü
  // 4. Küfür filtresi kontrolü
  // 5. Geçerlilik durumunu döndür
}
```

#### `getWordHint()`
```typescript
interface WordHint {
  category: string;
  firstLetter?: string;
  syllableCount?: number;
  meaning?: string;
}

function getWordHint(targetWord: string, hintLevel: number): WordHint {
  // 1. Kelime kategorisini belirle
  // 2. Hint seviyesine göre ipucu miktarını ayarla
  // 3. İpucu objesi oluştur ve döndür
}
```

### 3. Tahmin Değerlendirme Fonksiyonları

#### `evaluateGuess()`
```typescript
interface LetterResult {
  letter: string;
  status: 'correct' | 'present' | 'absent';
  position: number;
}

function evaluateGuess(guess: string, targetWord: string): LetterResult[] {
  // 1. Her harfi hedef kelimeyle karşılaştır
  // 2. Doğru pozisyon kontrolü (yeşil)
  // 3. Mevcut ama yanlış pozisyon kontrolü (sarı)
  // 4. Olmayan harf kontrolü (gri)
  // 5. Sonuç dizisini döndür
}
```

#### `checkWinCondition()`
```typescript
function checkWinCondition(guess: string, targetWord: string): boolean {
  return guess.toLowerCase() === targetWord.toLowerCase();
}
```

#### `updateKeyboardState()`
```typescript
interface KeyboardState {
  [key: string]: 'correct' | 'present' | 'absent' | 'unused';
}

function updateKeyboardState(
  currentState: KeyboardState, 
  guessResult: LetterResult[]
): KeyboardState {
  // 1. Mevcut klavye durumunu al
  // 2. Yeni tahmin sonuçlarını entegre et
  // 3. Harf durumlarını güncelle (priority: correct > present > absent)
  // 4. Güncellenmiş keyboard state döndür
}
```

### 4. Oyun Akışı Fonksiyonları

#### `startGame()`
```typescript
function startGame(roomId: string): Promise<GameState> {
  // 1. Oda durumunu kontrol et (2 oyuncu hazır mı?)
  // 2. Oyun moduna göre hedef kelime(leri) seç
  // 3. Timer'ı başlat
  // 4. İlk sırayı belirle (turn-based mode)
  // 5. Oyun durumunu initialize et
  // 6. Tüm oyunculara oyun başlangıcını bildir
}
```

#### `processTurn()` - Sırayla Modu
```typescript
function processTurn(
  roomId: string, 
  playerId: string, 
  guess: string
): Promise<TurnResult> {
  // 1. Sıra kontrolü (oyuncunun sırası mı?)
  // 2. Kelime geçerliliği kontrolü
  // 3. Tahmini değerlendir
  // 4. Kazanma durumu kontrolü
  // 5. Sırayı diğer oyuncuya geçir
  // 6. Timer'ı sıfırla
  // 7. Sonucu tüm oyunculara gönder
}
```

#### `processSimultaneousGuess()` - Düello Modu
```typescript
function processSimultaneousGuess(
  roomId: string,
  playerId: string,
  guess: string
): Promise<GuessResult> {
  // 1. Tahmini değerlendir
  // 2. Oyuncu progresini güncelle
  // 3. Kazanma durumu kontrolü
  // 4. Rakibe sadece renk kodlarını gönder
  // 5. Oyun durumunu güncelle
}
```

#### `endGame()`
```typescript
interface GameEndData {
  winner: string;
  reason: 'correct-guess' | 'time-out' | 'forfeit';
  targetWord: string;
  statistics: GameStatistics;
  rewards: PlayerRewards;
}

function endGame(roomId: string, endData: GameEndData): Promise<void> {
  // 1. Oyun durumunu sonlandır
  // 2. İstatistikleri hesapla ve kaydet
  // 3. Puan ve ödülleri hesapla
  // 4. Veritabanında oyun kaydını güncelle
  // 5. Tüm oyunculara oyun sonucu gönder
  // 6. Oda durumunu temizle
}
```

## ⚡ Gerçek Zamanlı Dinamikler

### 1. WebSocket Event Handlers

#### Sunucu Tarafı Events
```typescript
// Oda yönetimi
socket.on('join-room', handleJoinRoom);
socket.on('leave-room', handleLeaveRoom);
socket.on('player-ready', handlePlayerReady);

// Oyun mekaniği
socket.on('make-guess', handleMakeGuess);
socket.on('request-hint', handleHintRequest);
socket.on('pause-game', handlePauseGame);

// Sosyal özellikler
socket.on('send-message', handleChatMessage);
socket.on('send-reaction', handleReaction);
socket.on('typing-start', handleTypingStart);
socket.on('typing-stop', handleTypingStop);
```

#### İstemci Tarafı Events
```typescript
// Oda durumu
socket.on('room-joined', updateRoomState);
socket.on('player-joined', showPlayerJoined);
socket.on('player-left', showPlayerLeft);

// Oyun durumu
socket.on('game-started', initializeGame);
socket.on('turn-changed', updateTurnIndicator);
socket.on('guess-result', processGuessResult);
socket.on('game-ended', showGameResult);

// Sosyal
socket.on('chat-message', displayChatMessage);
socket.on('player-typing', showTypingIndicator);
```

### 2. Durum Senkronizasyonu

#### `syncGameState()`
```typescript
function syncGameState(roomId: string): void {
  // 1. Redis'ten güncel oyun durumunu al
  // 2. Tüm oyunculara durum güncellemesi gönder
  // 3. Disconnect olan oyuncular için state'i hazır tut
}
```

#### `handleReconnection()`
```typescript
function handleReconnection(playerId: string, roomId: string): void {
  // 1. Oyuncunun disconnect süresini kontrol et
  // 2. Oyun hala devam ediyorsa durumu gönder
  // 3. Missed moves varsa özetle
  // 4. Diğer oyuncuya reconnection bildirimi gönder
}
```

## 🎯 Skorlama ve İstatistik Sistemleri

### 1. Puan Hesaplama Fonksiyonları

#### `calculateScore()`
```typescript
interface ScoreFactors {
  guessCount: number;
  timeElapsed: number;
  difficulty: string;
  gameMode: string;
  streakMultiplier: number;
}

function calculateScore(factors: ScoreFactors): number {
  const baseScore = 1000;
  const guessBonus = Math.max(0, (7 - factors.guessCount) * 100);
  const speedBonus = Math.max(0, (300 - factors.timeElapsed) * 2);
  const difficultyMultiplier = getDifficultyMultiplier(factors.difficulty);
  const modeMultiplier = getModeMultiplier(factors.gameMode);
  
  return Math.floor(
    (baseScore + guessBonus + speedBonus) * 
    difficultyMultiplier * 
    modeMultiplier * 
    factors.streakMultiplier
  );
}
```

#### `updatePlayerStats()`
```typescript
interface PlayerStats {
  totalGames: number;
  winRate: number;
  averageGuesses: number;
  averageTime: number;
  currentStreak: number;
  maxStreak: number;
  totalScore: number;
  rank: string;
}

function updatePlayerStats(
  playerId: string, 
  gameResult: GameResult
): Promise<PlayerStats> {
  // 1. Mevcut istatistikleri al
  // 2. Yeni oyun sonucunu entegre et
  // 3. Ortalama değerleri yeniden hesapla
  // 4. Seri durumunu güncelle
  // 5. Rank seviyesini kontrol et
  // 6. Güncellenmiş stats'ı kaydet ve döndür
}
```

### 2. Başarım Sistemi

#### `checkAchievements()`
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: PlayerStats, gameData: GameResult) => boolean;
  reward: number;
}

function checkAchievements(
  playerId: string, 
  gameResult: GameResult
): Promise<Achievement[]> {
  // 1. Oyuncu istatistiklerini al
  // 2. Tüm başarım koşullarını kontrol et
  // 3. Yeni kazanılan başarımları belirle
  // 4. Başarım bildirimlerini hazırla
  // 5. Ödülleri hesapla ve uygula
}
```

#### Başarım Örnekleri
```typescript
const achievements: Achievement[] = [
  {
    id: 'first_win',
    name: '🏆 İlk Zafer',
    description: 'İlk oyununuzu kazandınız!',
    condition: (stats) => stats.totalGames === 1 && stats.winRate === 100,
    reward: 100
  },
  {
    id: 'speed_demon',
    name: '⚡ Hızlı Çözüm',
    description: '2 dakika altında kazandınız!',
    condition: (_, game) => game.timeElapsed < 120 && game.isWin,
    reward: 250
  },
  {
    id: 'perfect_guess',
    name: '🎯 Mükemmel',
    description: 'Tek tahminde buldunuz!',
    condition: (_, game) => game.guessCount === 1 && game.isWin,
    reward: 500
  }
];
```

## 🔄 Oyun Modları Detayları

### 1. Sırayla Modu (Turn-Based)

#### Dinamikler
- **Sıra Sistemi:** Oyuncular dönüşümlü tahmin yapar
- **Görünürlük:** Her oyuncu diğerinin tahminlerini görür
- **Timer:** Her tahmin için 60 saniye süre
- **Kazanma:** İlk doğru tahmin eden kazanır

#### `manageTurnBasedGame()`
```typescript
function manageTurnBasedGame(roomId: string): void {
  // 1. Current player'ı belirle
  // 2. Turn timer'ı başlat
  // 3. Diğer oyuncuya bekleme durumu gönder
  // 4. Tahmin geldiğinde evaluate et
  // 5. Sırayı geçir veya oyunu sonlandır
}
```

### 2. Düello Modu (Duel)

#### Dinamikler
- **Paralel Oyun:** Her oyuncunun farklı hedef kelimesi
- **Gizlilik:** Sadece renk kodları görünür
- **Eş Zamanlı:** İkisi de aynı anda tahmin yapabilir
- **Yarış:** İlk bitiren kazanır

#### `manageDuelGame()`
```typescript
function manageDuelGame(roomId: string): void {
  // 1. Her oyuncu için farklı kelime seç
  // 2. Paralel progress tracking
  // 3. Sadece color hints paylaş
  // 4. Race condition yönetimi
  // 5. İlk bitiren kazanır mantığı
}
```

## 💬 Chat ve Sosyal Sistemler

### 1. Chat Fonksiyonları

#### `sendChatMessage()`
```typescript
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'emoji' | 'reaction' | 'system';
  timestamp: number;
}

function sendChatMessage(
  roomId: string, 
  message: ChatMessage
): Promise<void> {
  // 1. Mesaj içeriğini filtrele (küfür, spam)
  // 2. Rate limiting kontrolü
  // 3. Mesajı tüm oyunculara gönder
  // 4. Chat geçmişine kaydet
  // 5. Notification göster (focus dışındaysa)
}
```

#### `sendReaction()`
```typescript
function sendReaction(
  roomId: string, 
  playerId: string, 
  reactionType: string
): void {
  // 1. Reaction animation tetikle
  // 2. Diğer oyuncuya reaction göster
  // 3. Geçici olarak göster (3 saniye)
}
```

### 2. Anti-Spam ve Moderasyon

#### `moderateContent()`
```typescript
function moderateContent(content: string): {
  isAllowed: boolean;
  filteredContent: string;
  warnings: string[];
} {
  // 1. Küfür filtresi uygula
  // 2. Spam detection (repeated messages)
  // 3. Link ve zararlı içerik kontrolü
  // 4. Rate limiting uygulaması
}
```

## 🎵 Ses ve Efekt Sistemleri

### 1. Ses Yönetimi

#### `SoundManager` Class
```typescript
class SoundManager {
  private audioContext: AudioContext;
  private sounds: Map<string, AudioBuffer>;
  private volume: number = 0.7;
  
  async loadSound(name: string, url: string): Promise<void> {
    // Ses dosyasını yükle ve cache'le
  }
  
  playSound(name: string, volume?: number): void {
    // Ses çal, volume kontrolü ile
  }
  
  stopSound(name: string): void {
    // Belirli sesi durdur
  }
  
  setMasterVolume(volume: number): void {
    // Master volume ayarla
  }
}
```

### 2. Haptik Feedback

#### `HapticManager` Class
```typescript
class HapticManager {
  static isSupported(): boolean {
    return 'vibrate' in navigator;
  }
  
  static light(): void {
    if (this.isSupported()) {
      navigator.vibrate(50);
    }
  }
  
  static medium(): void {
    if (this.isSupported()) {
      navigator.vibrate(100);
    }
  }
  
  static heavy(): void {
    if (this.isSupported()) {
      navigator.vibrate([100, 50, 100]);
    }
  }
}
```

## 🔐 Güvenlik ve Validasyon

### 1. Input Validation

#### `validatePlayerInput()`
```typescript
function validatePlayerInput(input: string, type: 'guess' | 'name' | 'chat'): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} {
  // 1. Karakter uzunluğu kontrolü
  // 2. Zararlı karakter temizleme
  // 3. Türkçe karakter normalizasyonu
  // 4. SQL injection koruması
  // 5. XSS koruması
}
```

### 2. Rate Limiting

#### `RateLimiter` Class
```typescript
class RateLimiter {
  private limits: Map<string, number[]> = new Map();
  
  isAllowed(userId: string, action: string): boolean {
    // 1. User'ın action history'sini al
    // 2. Time window içindeki action sayısını kontrol et
    // 3. Limit aşılmışsa false döndür
    // 4. Allowed ise timestamp ekle
  }
  
  resetLimits(userId: string): void {
    // Kullanıcının tüm limitlerini sıfırla
  }
}
```

## 📊 Analytics ve Monitoring

### 1. Oyun Analytics

#### `trackGameEvent()`
```typescript
interface GameEvent {
  eventType: 'game_start' | 'game_end' | 'guess_made' | 'hint_used';
  playerId: string;
  roomId: string;
  gameMode: string;
  metadata: Record<string, any>;
  timestamp: number;
}

function trackGameEvent(event: GameEvent): void {
  // 1. Event'i formatla
  // 2. Analytics servisine gönder
  // 3. Real-time dashboard'u güncelle
  // 4. Error handling
}
```

### 2. Performance Monitoring

#### `PerformanceMonitor` Class
```typescript
class PerformanceMonitor {
  static measureResponseTime(operation: string, fn: () => Promise<any>): Promise<any> {
    const start = performance.now();
    return fn().finally(() => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    });
  }
  
  static recordMetric(metric: string, value: number): void {
    // Metriği monitoring servisine gönder
  }
}
```

## 🔄 State Management

### 1. Game State Structure

```typescript
interface GameState {
  roomId: string;
  mode: 'turn-based' | 'duel';
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  players: Player[];
  currentTurn?: string; // turn-based mode için
  targetWords: Record<string, string>; // playerId -> word
  guesses: Record<string, GuessHistory[]>;
  startTime: number;
  endTime?: number;
  settings: GameSettings;
}
```

### 2. State Mutations

#### `GameStateManager` Class
```typescript
class GameStateManager {
  private state: GameState;
  private subscribers: Function[] = [];
  
  subscribe(callback: Function): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      this.subscribers.splice(index, 1);
    };
  }
  
  updateState(mutation: Partial<GameState>): void {
    this.state = { ...this.state, ...mutation };
    this.notifySubscribers();
  }
  
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }
}
```

## 🎯 Error Handling ve Fallbacks

### 1. Network Error Handling

#### `NetworkErrorHandler` Class
```typescript
class NetworkErrorHandler {
  static async withRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
    
    throw lastError!;
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Graceful Degradation

#### `FeatureDetection` Class
```typescript
class FeatureDetection {
  static hasWebSocket(): boolean {
    return 'WebSocket' in window;
  }
  
  static hasLocalStorage(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }
  
  static hasNotificationAPI(): boolean {
    return 'Notification' in window;
  }
}
```

## 🚀 Performance Optimizations

### 1. Memoization ve Caching

#### `GameCache` Class
```typescript
class GameCache {
  private cache: Map<string, any> = new Map();
  private ttl: Map<string, number> = new Map();
  
  set(key: string, value: any, ttlMs: number = 300000): void {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }
  
  get(key: string): any | null {
    const expiry = this.ttl.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }
}
```

### 2. Debouncing ve Throttling

#### `InputManager` Class
```typescript
class InputManager {
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
  
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
```

---

## 📋 Sonuç

Bu dokümanda Çift Wordle oyununun tüm temel fonksiyonları, dinamikleri ve sistemleri detaylandırılmıştır. Her fonksiyon gerçek dünya senaryolarını göz önünde bulundurarak tasarlanmış ve performans, güvenlik ve kullanıcı deneyimi açısından optimize edilmiştir.

### Temel Özellikler:
- ✅ Real-time çok oyunculu sistem
- ✅ İki farklı oyun modu (Sırayla & Düello)
- ✅ Kapsamlı güvenlik önlemleri
- ✅ Gelişmiş skorlama sistemi
- ✅ Sosyal özellikler (chat, reactions)
- ✅ Analytics ve monitoring
- ✅ Mobile-first responsive tasarım
- ✅ Accessibility compliance
- ✅ Performance optimizations

Bu fonksiyonlar Next.js, TypeScript, Socket.io, Redis ve PostgreSQL teknolojileri kullanılarak implement edilebilir.