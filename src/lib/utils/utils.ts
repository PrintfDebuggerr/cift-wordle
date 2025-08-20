// Utility functions
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind CSS class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Turkish word validation
export function isValidTurkishWord(word: string): boolean {
  if (!word || typeof word !== 'string') return false;
  
  // Basic Turkish word validation
  const turkishWordRegex = /^[A-Za-zÇĞIİÖŞÜçğıiöşü]+$/;
  return turkishWordRegex.test(word) && word.length >= 3;
}

// Room code generation
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Time formatting
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Letter status calculation
export function calculateLetterStatus(letter: string, position: number, targetWord: string): 'correct' | 'present' | 'absent' {
  if (targetWord[position] === letter) {
    return 'correct';
  }
  
  if (targetWord.includes(letter)) {
    return 'present';
  }
  
  return 'absent';
}

// Score calculation
export function calculateScore(guesses: string[], targetWord: string, gameStartTime: number, maxGuesses: number = 6): number {
  if (guesses.length === 0) return 0;
  
  const correctGuess = guesses.find(guess => 
    guess.length > 0 && guess.every((letter, index) => 
      letter === targetWord[index]
    )
  );
  
  if (!correctGuess) return 0;
  
  const guessIndex = guesses.indexOf(correctGuess);
  const baseScore = 1000;
  const penalty = guessIndex * 100;
  const timeBonus = Math.max(0, 500 - (Date.now() - gameStartTime) / 1000);
  
  return Math.max(0, baseScore - penalty + timeBonus);
}

// Local storage utilities
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

// Session storage utilities
export function getSessionStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading sessionStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setSessionStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting sessionStorage key "${key}":`, error);
  }
}

export function removeSessionStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing sessionStorage key "${key}":`, error);
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
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

// Device detection utilities
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
}

export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  
  return !isMobile() && !isTablet();
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Screen size utilities
export function getScreenSize(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  if (typeof window === 'undefined') return 'md';
  
  const width = window.innerWidth;
  
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
}

// Color utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function getContrastColor(hexColor: string): 'black' | 'white' {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'black';
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? 'black' : 'white';
}

// Animation utilities
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

// Random utilities
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// String utilities
export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Date utilities
export function formatDate(date: Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (format === 'relative') {
    return formatRelativeDate(date);
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'long' ? 'long' : 'short',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('tr-TR', options);
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Az önce';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
  
  return formatDate(date, 'short');
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Error handling utilities
export function handleError(error: unknown, context?: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
  
  console.error(fullMessage);
  
  // You can add error reporting logic here (e.g., Sentry)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'exception', {
      description: fullMessage,
      fatal: false
    });
  }
}

// Performance utilities
export function measurePerformance<T>(fn: () => T, label: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${label} took ${(end - start).toFixed(2)}ms`);
  return result;
}

export async function measureAsyncPerformance<T>(
  fn: () => Promise<T>, 
  label: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`${label} took ${(end - start).toFixed(2)}ms`);
  return result;
}

// Game-specific utilities
export function isGameWon(guesses: string[], targetWord: string): boolean {
  return guesses.some(guess => guess === targetWord);
}

export function isGameLost(guesses: string[], maxGuesses: number = 6): boolean {
  return guesses.length >= maxGuesses && !isGameWon(guesses, guesses[guesses.length - 1]);
}

export function validatePlayerName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Oyuncu adı boş olamaz' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Oyuncu adı en az 2 karakter olmalıdır' };
  }
  
  if (name.trim().length > 20) {
    return { isValid: false, error: 'Oyuncu adı en fazla 20 karakter olabilir' };
  }
  
  if (!/^[a-zA-ZÇĞIİÖŞÜçğıiöşü\s]+$/.test(name.trim())) {
    return { isValid: false, error: 'Oyuncu adı sadece harf ve boşluk içerebilir' };
  }
  
  return { isValid: true };
}

// Sound and haptic utilities
export { 
  playSoundEffect, 
  playMusicTrack, 
  stopMusic, 
  pauseMusic, 
  resumeMusic,
  SOUND_EFFECTS,
  MUSIC_TRACKS
} from './sound-manager';

export { 
  triggerHapticFeedback, 
  triggerLightHaptic, 
  triggerMediumHaptic, 
  triggerHeavyHaptic,
  triggerSuccessHaptic, 
  triggerWarningHaptic, 
  triggerErrorHaptic,
  HAPTIC_PATTERNS
} from './haptic-manager';
