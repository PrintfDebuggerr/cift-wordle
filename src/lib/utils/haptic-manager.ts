// Haptic feedback manager utilities
export interface HapticPattern {
  id: string;
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  duration?: number;
  intensity?: number;
}

export interface HapticManagerConfig {
  enabled?: boolean;
  defaultIntensity?: number;
  defaultDuration?: number;
  fallbackToVibration?: boolean;
  customPatterns?: Record<string, HapticPattern>;
}

export class HapticManager {
  private config: HapticManagerConfig = {
    enabled: true,
    defaultIntensity: 0.5,
    defaultDuration: 100,
    fallbackToVibration: true,
    customPatterns: {}
  };

  private isSupported: boolean;
  private hapticActuator: any = null;

  constructor(config?: Partial<HapticManagerConfig>) {
    this.config = { ...this.config, ...config };
    this.isSupported = this.checkSupport();
    this.initialize();
  }

  private checkSupport(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for Haptic Actuator API
    if ('vibrate' in navigator) {
      return true;
    }

    // Check for Gamepad Haptic Actuator
    if ('getGamepads' in navigator) {
      const gamepads = navigator.getGamepads();
      for (const gamepad of gamepads) {
        if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
          return true;
        }
      }
    }

    return false;
  }

  private initialize(): void {
    if (!this.isSupported) {
      console.warn('Haptic feedback not supported on this device');
      return;
    }

    // Try to get haptic actuator from gamepad
    if ('getGamepads' in navigator) {
      const gamepads = navigator.getGamepads();
      for (const gamepad of gamepads) {
        if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
          this.hapticActuator = gamepad.hapticActuators[0];
          break;
        }
      }
    }

    console.log('HapticManager initialized', { 
      supported: this.isSupported, 
      hasActuator: !!this.hapticActuator 
    });
  }

  // Trigger haptic feedback
  async trigger(pattern: HapticPattern | string): Promise<void> {
    if (!this.config.enabled || !this.isSupported) return;

    try {
      let hapticPattern: HapticPattern;

      if (typeof pattern === 'string') {
        hapticPattern = this.getPredefinedPattern(pattern) || this.getCustomPattern(pattern);
      } else {
        hapticPattern = pattern;
      }

      if (!hapticPattern) {
        console.warn(`Haptic pattern not found: ${pattern}`);
        return;
      }

      await this.executeHapticPattern(hapticPattern);
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
    }
  }

  // Execute haptic pattern
  private async executeHapticPattern(pattern: HapticPattern): Promise<void> {
    const { type, duration = this.config.defaultDuration, intensity = this.config.defaultIntensity } = pattern;

    // Try Haptic Actuator first
    if (this.hapticActuator && this.hapticActuator.playEffect) {
      try {
        const effect = this.createHapticEffect(type, duration, intensity);
        await this.hapticActuator.playEffect('dual-rumble', effect);
        return;
      } catch (error) {
        console.warn('Haptic actuator failed, falling back to vibration:', error);
      }
    }

    // Fallback to vibration API
    if (this.config.fallbackToVibration && 'vibrate' in navigator) {
      const vibrationPattern = this.createVibrationPattern(type, duration, intensity);
      navigator.vibrate(vibrationPattern);
    }
  }

  // Create haptic effect for actuator
  private createHapticEffect(type: string, duration: number, intensity: number): any {
    const baseEffect = {
      duration: duration,
      strongMagnitude: intensity,
      weakMagnitude: intensity * 0.5
    };

    switch (type) {
      case 'light':
        return { ...baseEffect, strongMagnitude: intensity * 0.3, weakMagnitude: intensity * 0.2 };
      case 'medium':
        return baseEffect;
      case 'heavy':
        return { ...baseEffect, strongMagnitude: intensity, weakMagnitude: intensity * 0.8 };
      case 'success':
        return { ...baseEffect, strongMagnitude: intensity * 0.8, weakMagnitude: intensity * 0.4 };
      case 'warning':
        return { ...baseEffect, strongMagnitude: intensity * 0.6, weakMagnitude: intensity * 0.3 };
      case 'error':
        return { ...baseEffect, strongMagnitude: intensity, weakMagnitude: intensity * 0.6 };
      default:
        return baseEffect;
    }
  }

  // Create vibration pattern
  private createVibrationPattern(type: string, duration: number, intensity: number): number | number[] {
    const baseDuration = Math.round(duration * intensity);

    switch (type) {
      case 'light':
        return [baseDuration * 0.3];
      case 'medium':
        return [baseDuration];
      case 'heavy':
        return [baseDuration, baseDuration * 0.5, baseDuration];
      case 'success':
        return [baseDuration * 0.5, baseDuration * 0.3, baseDuration * 0.5];
      case 'warning':
        return [baseDuration * 0.7, baseDuration * 0.3, baseDuration * 0.7];
      case 'error':
        return [baseDuration, baseDuration * 0.2, baseDuration, baseDuration * 0.2, baseDuration];
      default:
        return [baseDuration];
    }
  }

  // Get predefined haptic patterns
  private getPredefinedPattern(type: string): HapticPattern | null {
    const patterns: Record<string, HapticPattern> = {
      light: { id: 'light', type: 'light', duration: 50, intensity: 0.3 },
      medium: { id: 'medium', type: 'medium', duration: 100, intensity: 0.5 },
      heavy: { id: 'heavy', type: 'heavy', duration: 150, intensity: 0.8 },
      success: { id: 'success', type: 'success', duration: 120, intensity: 0.6 },
      warning: { id: 'warning', type: 'warning', duration: 100, intensity: 0.5 },
      error: { id: 'error', type: 'error', duration: 200, intensity: 0.9 }
    };

    return patterns[type] || null;
  }

  // Get custom haptic pattern
  private getCustomPattern(id: string): HapticPattern | null {
    return this.config.customPatterns?.[id] || null;
  }

  // Add custom haptic pattern
  addCustomPattern(pattern: HapticPattern): void {
    this.config.customPatterns = {
      ...this.config.customPatterns,
      [pattern.id]: pattern
    };
  }

  // Remove custom haptic pattern
  removeCustomPattern(id: string): void {
    if (this.config.customPatterns) {
      delete this.config.customPatterns[id];
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<HapticManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): HapticManagerConfig {
    return { ...this.config };
  }

  // Check if haptic feedback is supported
  isHapticSupported(): boolean {
    return this.isSupported;
  }

  // Check if haptic feedback is enabled
  isHapticEnabled(): boolean {
    return this.config.enabled && this.isSupported;
  }

  // Enable haptic feedback
  enable(): void {
    this.config.enabled = true;
  }

  // Disable haptic feedback
  disable(): void {
    this.config.enabled = false;
  }

  // Test haptic feedback
  async test(): Promise<void> {
    if (!this.isHapticEnabled()) {
      console.warn('Haptic feedback is disabled');
      return;
    }

    console.log('Testing haptic feedback...');
    
    // Test different patterns
    await this.trigger('light');
    await this.delay(200);
    await this.trigger('medium');
    await this.delay(200);
    await this.trigger('heavy');
    await this.delay(200);
    await this.trigger('success');
    await this.delay(200);
    await this.trigger('warning');
    await this.delay(200);
    await this.trigger('error');
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  destroy(): void {
    this.config.enabled = false;
    this.hapticActuator = null;
  }
}

// Singleton instance
let hapticManagerInstance: HapticManager | null = null;

export function getHapticManager(config?: Partial<HapticManagerConfig>): HapticManager {
  if (!hapticManagerInstance) {
    hapticManagerInstance = new HapticManager(config);
  }
  return hapticManagerInstance;
}

// Utility functions for common haptic patterns
export async function triggerHapticFeedback(pattern: HapticPattern | string): Promise<void> {
  const manager = getHapticManager();
  await manager.trigger(pattern);
}

export async function triggerLightHaptic(): Promise<void> {
  await triggerHapticFeedback('light');
}

export async function triggerMediumHaptic(): Promise<void> {
  await triggerHapticFeedback('medium');
}

export async function triggerHeavyHaptic(): Promise<void> {
  await triggerHapticFeedback('heavy');
}

export async function triggerSuccessHaptic(): Promise<void> {
  await triggerHapticFeedback('success');
}

export async function triggerWarningHaptic(): Promise<void> {
  await triggerHapticFeedback('warning');
}

export async function triggerErrorHaptic(): Promise<void> {
  await triggerHapticFeedback('error');
}

// Predefined haptic patterns for common game actions
export const HAPTIC_PATTERNS = {
  // Game actions
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  GAME_WIN: 'game_win',
  GAME_LOSE: 'game_lose',
  
  // UI interactions
  BUTTON_PRESS: 'button_press',
  BUTTON_RELEASE: 'button_release',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  
  // Gameplay actions
  LETTER_ADDED: 'letter_added',
  LETTER_REMOVED: 'letter_removed',
  GUESS_SUBMITTED: 'guess_submitted',
  GUESS_CORRECT: 'guess_correct',
  GUESS_INCORRECT: 'guess_incorrect',
  
  // Notifications
  NOTIFICATION: 'notification',
  ACHIEVEMENT: 'achievement',
  ERROR: 'error',
  SUCCESS: 'success'
};

// Custom haptic pattern configurations
export const CUSTOM_HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  [HAPTIC_PATTERNS.GAME_START]: {
    id: HAPTIC_PATTERNS.GAME_START,
    type: 'success',
    duration: 150,
    intensity: 0.7
  },
  [HAPTIC_PATTERNS.GAME_END]: {
    id: HAPTIC_PATTERNS.GAME_END,
    type: 'medium',
    duration: 200,
    intensity: 0.6
  },
  [HAPTIC_PATTERNS.GAME_WIN]: {
    id: HAPTIC_PATTERNS.GAME_WIN,
    type: 'success',
    duration: 300,
    intensity: 0.8
  },
  [HAPTIC_PATTERNS.GAME_LOSE]: {
    id: HAPTIC_PATTERNS.GAME_LOSE,
    type: 'error',
    duration: 250,
    intensity: 0.7
  },
  [HAPTIC_PATTERNS.BUTTON_PRESS]: {
    id: HAPTIC_PATTERNS.BUTTON_PRESS,
    type: 'light',
    duration: 30,
    intensity: 0.4
  },
  [HAPTIC_PATTERNS.BUTTON_RELEASE]: {
    id: HAPTIC_PATTERNS.BUTTON_RELEASE,
    type: 'light',
    duration: 20,
    intensity: 0.2
  },
  [HAPTIC_PATTERNS.LETTER_ADDED]: {
    id: HAPTIC_PATTERNS.LETTER_ADDED,
    type: 'light',
    duration: 40,
    intensity: 0.3
  },
  [HAPTIC_PATTERNS.LETTER_REMOVED]: {
    id: HAPTIC_PATTERNS.LETTER_REMOVED,
    type: 'light',
    duration: 35,
    intensity: 0.25
  },
  [HAPTIC_PATTERNS.GUESS_SUBMITTED]: {
    id: HAPTIC_PATTERNS.GUESS_SUBMITTED,
    type: 'medium',
    duration: 80,
    intensity: 0.5
  },
  [HAPTIC_PATTERNS.GUESS_CORRECT]: {
    id: HAPTIC_PATTERNS.GUESS_CORRECT,
    type: 'success',
    duration: 120,
    intensity: 0.6
  },
  [HAPTIC_PATTERNS.GUESS_INCORRECT]: {
    id: HAPTIC_PATTERNS.GUESS_INCORRECT,
    type: 'warning',
    duration: 100,
    intensity: 0.4
  },
  [HAPTIC_PATTERNS.NOTIFICATION]: {
    id: HAPTIC_PATTERNS.NOTIFICATION,
    type: 'light',
    duration: 60,
    intensity: 0.3
  },
  [HAPTIC_PATTERNS.ACHIEVEMENT]: {
    id: HAPTIC_PATTERNS.ACHIEVEMENT,
    type: 'success',
    duration: 200,
    intensity: 0.7
  }
};

// Initialize haptic manager with custom patterns
export function initializeHapticManager(config?: Partial<HapticManagerConfig>): HapticManager {
  const manager = getHapticManager(config);
  
  // Add custom patterns
  Object.values(CUSTOM_HAPTIC_PATTERNS).forEach(pattern => {
    manager.addCustomPattern(pattern);
  });
  
  return manager;
}

// Check if device supports haptic feedback
export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'vibrate' in navigator || 'getGamepads' in navigator;
}

// Check if haptic feedback is enabled
export function isHapticEnabled(): boolean {
  const manager = getHapticManager();
  return manager.isHapticEnabled();
}

// Enable haptic feedback
export function enableHaptic(): void {
  const manager = getHapticManager();
  manager.enable();
}

// Disable haptic feedback
export function disableHaptic(): void {
  const manager = getHapticManager();
  manager.disable();
}

// Test haptic feedback
export function testHaptic(): Promise<void> {
  const manager = getHapticManager();
  return manager.test();
}
