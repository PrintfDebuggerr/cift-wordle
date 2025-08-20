// Sound manager utilities
export interface SoundEffect {
  id: string;
  url: string;
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

export interface MusicTrack {
  id: string;
  url: string;
  title: string;
  artist?: string;
  volume?: number;
  loop?: boolean;
}

export interface SoundManagerConfig {
  masterVolume?: number;
  effectsVolume?: number;
  musicVolume?: number;
  enableSounds?: boolean;
  enableMusic?: boolean;
  preloadSounds?: boolean;
}

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private music: Map<string, HTMLAudioElement> = new Map();
  private currentMusic: HTMLAudioElement | null = null;
  
  private config: SoundManagerConfig = {
    masterVolume: 1.0,
    effectsVolume: 0.8,
    musicVolume: 0.6,
    enableSounds: true,
    enableMusic: true,
    preloadSounds: true
  };

  private isInitialized = false;

  constructor(config?: Partial<SoundManagerConfig>) {
    this.config = { ...this.config, ...config };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize AudioContext
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        this.audioContext = new AudioContext();
        
        // Resume AudioContext on user interaction
        const resumeAudioContext = () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
          document.removeEventListener('click', resumeAudioContext);
          document.removeEventListener('keydown', resumeAudioContext);
          document.removeEventListener('touchstart', resumeAudioContext);
        };

        document.addEventListener('click', resumeAudioContext);
        document.addEventListener('keydown', resumeAudioContext);
        document.addEventListener('touchstart', resumeAudioContext);
      }

      this.isInitialized = true;
      console.log('SoundManager initialized');
    } catch (error) {
      console.error('Failed to initialize SoundManager:', error);
    }
  }

  // Load and preload sound effects
  async loadSound(sound: SoundEffect): Promise<void> {
    try {
      const audio = new Audio();
      audio.preload = sound.preload ? 'auto' : 'none';
      audio.volume = (sound.volume || 1.0) * this.config.effectsVolume! * this.config.masterVolume!;
      audio.loop = sound.loop || false;

      if (this.config.preloadSounds) {
        audio.src = sound.url;
        await audio.load();
      }

      this.sounds.set(sound.id, audio);
    } catch (error) {
      console.error(`Failed to load sound ${sound.id}:`, error);
    }
  }

  // Load music tracks
  async loadMusic(track: MusicTrack): Promise<void> {
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = (track.volume || 1.0) * this.config.musicVolume! * this.config.masterVolume!;
      audio.loop = track.loop || false;

      audio.src = track.url;
      await audio.load();

      this.music.set(track.id, audio);
    } catch (error) {
      console.error(`Failed to load music ${track.id}:`, error);
    }
  }

  // Play sound effect
  async playSound(soundId: string): Promise<void> {
    if (!this.config.enableSounds || !this.isInitialized) return;

    try {
      const sound = this.sounds.get(soundId);
      if (sound) {
        // Reset to beginning if already playing
        if (!sound.paused) {
          sound.currentTime = 0;
        }
        
        // Set volume based on current config
        sound.volume = (sound.volume || 1.0) * this.config.effectsVolume! * this.config.masterVolume!;
        
        await sound.play();
      } else {
        console.warn(`Sound ${soundId} not found`);
      }
    } catch (error) {
      console.error(`Failed to play sound ${soundId}:`, error);
    }
  }

  // Play music track
  async playMusic(trackId: string, fadeIn: boolean = true): Promise<void> {
    if (!this.config.enableMusic || !this.isInitialized) return;

    try {
      const track = this.music.get(trackId);
      if (track) {
        // Stop current music
        if (this.currentMusic && this.currentMusic !== track) {
          await this.stopMusic(fadeIn);
        }

        this.currentMusic = track;
        
        // Set volume based on current config
        track.volume = (track.volume || 1.0) * this.config.musicVolume! * this.config.masterVolume!;
        
        if (fadeIn) {
          track.volume = 0;
          await track.play();
          this.fadeIn(track, track.volume, 1000);
        } else {
          await track.play();
        }
      } else {
        console.warn(`Music track ${trackId} not found`);
      }
    } catch (error) {
      console.error(`Failed to play music ${trackId}:`, error);
    }
  }

  // Stop current music
  async stopMusic(fadeOut: boolean = true): Promise<void> {
    if (!this.currentMusic) return;

    try {
      if (fadeOut) {
        await this.fadeOut(this.currentMusic, 1000);
      }
      
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    } catch (error) {
      console.error('Failed to stop music:', error);
    }
  }

  // Pause current music
  pauseMusic(): void {
    if (this.currentMusic && !this.currentMusic.paused) {
      this.currentMusic.pause();
    }
  }

  // Resume current music
  resumeMusic(): void {
    if (this.currentMusic && this.currentMusic.paused) {
      this.currentMusic.play().catch(console.error);
    }
  }

  // Fade in effect
  private async fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number): Promise<void> {
    const startVolume = 0;
    const startTime = Date.now();
    
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      audio.volume = startVolume + (targetVolume - startVolume) * progress;
      
      if (progress >= 1) {
        clearInterval(fadeInterval);
      }
    }, 16);
  }

  // Fade out effect
  private async fadeOut(audio: HTMLAudioElement, duration: number): Promise<void> {
    const startVolume = audio.volume;
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const fadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        audio.volume = startVolume * (1 - progress);
        
        if (progress >= 1) {
          clearInterval(fadeInterval);
          resolve();
        }
      }, 16);
    });
  }

  // Update configuration
  updateConfig(newConfig: Partial<SoundManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update volumes for all loaded sounds and music
    this.sounds.forEach(sound => {
      sound.volume = (sound.volume || 1.0) * this.config.effectsVolume! * this.config.masterVolume!;
    });
    
    this.music.forEach(track => {
      track.volume = (track.volume || 1.0) * this.config.musicVolume! * this.config.masterVolume!;
    });
  }

  // Get current configuration
  getConfig(): SoundManagerConfig {
    return { ...this.config };
  }

  // Check if sound is loaded
  isSoundLoaded(soundId: string): boolean {
    return this.sounds.has(soundId);
  }

  // Check if music is loaded
  isMusicLoaded(trackId: string): boolean {
    return this.music.has(trackId);
  }

  // Get loaded sounds count
  getLoadedSoundsCount(): number {
    return this.sounds.size;
  }

  // Get loaded music count
  getLoadedMusicCount(): number {
    return this.music.size;
  }

  // Clear all sounds
  clearSounds(): void {
    this.sounds.forEach(sound => {
      sound.pause();
      sound.src = '';
    });
    this.sounds.clear();
  }

  // Clear all music
  clearMusic(): void {
    this.music.forEach(track => {
      track.pause();
      track.src = '';
    });
    this.music.clear();
    this.currentMusic = null;
  }

  // Destroy sound manager
  destroy(): void {
    this.clearSounds();
    this.clearMusic();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(config?: Partial<SoundManagerConfig>): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager(config);
  }
  return soundManagerInstance;
}

// Utility functions for common sound effects
export async function playSoundEffect(soundId: string): Promise<void> {
  const manager = getSoundManager();
  await manager.playSound(soundId);
}

export async function playMusicTrack(trackId: string): Promise<void> {
  const manager = getSoundManager();
  await manager.playMusic(trackId);
}

export function stopMusic(): Promise<void> {
  const manager = getSoundManager();
  return manager.stopMusic();
}

export function pauseMusic(): void {
  const manager = getSoundManager();
  manager.pauseMusic();
}

export function resumeMusic(): void {
  const manager = getSoundManager();
  manager.resumeMusic();
}

// Predefined sound effects
export const SOUND_EFFECTS = {
  // Game sounds
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  GAME_WIN: 'game_win',
  GAME_LOSE: 'game_lose',
  
  // UI sounds
  BUTTON_CLICK: 'button_click',
  BUTTON_HOVER: 'button_hover',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  
  // Gameplay sounds
  LETTER_ADDED: 'letter_added',
  LETTER_REMOVED: 'letter_removed',
  GUESS_SUBMITTED: 'guess_submitted',
  GUESS_CORRECT: 'guess_correct',
  GUESS_INCORRECT: 'guess_incorrect',
  
  // Notification sounds
  NOTIFICATION: 'notification',
  ACHIEVEMENT: 'achievement',
  ERROR: 'error',
  SUCCESS: 'success'
};

// Predefined music tracks
export const MUSIC_TRACKS = {
  // Background music
  MAIN_THEME: 'main_theme',
  GAME_LOOP: 'game_loop',
  MENU_AMBIENT: 'menu_ambient',
  
  // Mood music
  TENSION: 'tension',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  CALM: 'calm'
};

// Sound effect configurations
export const SOUND_CONFIGS: Record<string, SoundEffect> = {
  [SOUND_EFFECTS.GAME_START]: {
    id: SOUND_EFFECTS.GAME_START,
    url: '/sounds/game-start.mp3',
    volume: 0.8
  },
  [SOUND_EFFECTS.GAME_END]: {
    id: SOUND_EFFECTS.GAME_END,
    url: '/sounds/game-end.mp3',
    volume: 0.9
  },
  [SOUND_EFFECTS.BUTTON_CLICK]: {
    id: SOUND_EFFECTS.BUTTON_CLICK,
    url: '/sounds/button-click.mp3',
    volume: 0.6
  },
  [SOUND_EFFECTS.LETTER_ADDED]: {
    id: SOUND_EFFECTS.LETTER_ADDED,
    url: '/sounds/letter-added.mp3',
    volume: 0.5
  },
  [SOUND_EFFECTS.GUESS_CORRECT]: {
    id: SOUND_EFFECTS.GUESS_CORRECT,
    url: '/sounds/guess-correct.mp3',
    volume: 0.8
  }
};

// Music track configurations
export const MUSIC_CONFIGS: Record<string, MusicTrack> = {
  [MUSIC_TRACKS.MAIN_THEME]: {
    id: MUSIC_TRACKS.MAIN_THEME,
    url: '/music/main-theme.mp3',
    title: 'Ana Tema',
    volume: 0.7,
    loop: true
  },
  [MUSIC_TRACKS.GAME_LOOP]: {
    id: MUSIC_TRACKS.GAME_LOOP,
    url: '/music/game-loop.mp3',
    title: 'Oyun Döngüsü',
    volume: 0.6,
    loop: true
  },
  [MUSIC_TRACKS.VICTORY]: {
    id: MUSIC_TRACKS.VICTORY,
    url: '/music/victory.mp3',
    title: 'Zafer',
    volume: 0.8,
    loop: false
  }
};

// Initialize sound manager with predefined sounds
export async function initializeSoundManager(): Promise<SoundManager> {
  const manager = getSoundManager();
  
  // Load all sound effects
  for (const sound of Object.values(SOUND_CONFIGS)) {
    await manager.loadSound(sound);
  }
  
  // Load all music tracks
  for (const track of Object.values(MUSIC_CONFIGS)) {
    await manager.loadMusic(track);
  }
  
  return manager;
}

// Volume control utilities
export function setMasterVolume(volume: number): void {
  const manager = getSoundManager();
  manager.updateConfig({ masterVolume: Math.max(0, Math.min(1, volume)) });
}

export function setEffectsVolume(volume: number): void {
  const manager = getSoundManager();
  manager.updateConfig({ effectsVolume: Math.max(0, Math.min(1, volume)) });
}

export function setMusicVolume(volume: number): void {
  const manager = getSoundManager();
  manager.updateConfig({ musicVolume: Math.max(0, Math.min(1, volume)) });
}

export function toggleSounds(): void {
  const manager = getSoundManager();
  const config = manager.getConfig();
  manager.updateConfig({ enableSounds: !config.enableSounds });
}

export function toggleMusic(): void {
  const manager = getSoundManager();
  const config = manager.getConfig();
  manager.updateConfig({ enableMusic: !config.enableMusic });
}
