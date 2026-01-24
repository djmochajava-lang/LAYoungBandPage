// js/sound-effects.js - MOBILE FIXED VERSION

/**
 * Sound Effects Module
 * Adds audio feedback to user interactions
 */

const SoundEffects = {
  sounds: {},
  enabled: true,
  volume: 0.5,
  initialized: false,
  unlocked: false, // Track if sounds are unlocked on mobile

  /**
   * Initialize sound effects
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load sound files
    this.sounds = {
      whoosh: this.loadSound('sounds/whoosh.wav'),
      click: this.loadSound('sounds/click.wav'),
      menuOpen: this.loadSound('sounds/menu-open.wav'),
      menuClose: this.loadSound('sounds/menu-close.wav'),
    };

    // Check user preference
    this.enabled = this.getSoundPreference();

    // Unlock audio on first user interaction (for mobile)
    this.unlockAudio();

    // Setup event listeners
    this.setupListeners();

    console.log('🔊 Sound effects initialized');
  },

  /**
   * Unlock audio context for mobile browsers
   */
  unlockAudio() {
    const unlock = () => {
      if (this.unlocked) return;

      // Play and immediately pause all sounds to unlock them
      Object.values(this.sounds).forEach((sound) => {
        if (sound) {
          sound
            .play()
            .then(() => {
              sound.pause();
              sound.currentTime = 0;
            })
            .catch(() => {});
        }
      });

      this.unlocked = true;
      console.log('🔓 Audio unlocked for mobile');

      // Remove the unlock listeners
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };

    // Listen for first user interaction
    document.addEventListener('touchstart', unlock, {
      once: true,
      passive: true,
    });
    document.addEventListener('touchend', unlock, {
      once: true,
      passive: true,
    });
    document.addEventListener('click', unlock, { once: true });
  },

  /**
   * Load a sound file
   */
  loadSound(src) {
    const audio = new Audio(src);
    audio.volume = this.volume;
    audio.preload = 'auto';

    audio.addEventListener('error', () => {
      console.warn(`Failed to load sound: ${src}`);
    });

    return audio;
  },

  /**
   * Play a sound
   */
  play(soundName) {
    if (!this.enabled || !this.unlocked) return;

    const sound = this.sounds[soundName];
    if (!sound) return;

    try {
      sound.currentTime = 0;
      sound.play().catch((err) => {
        console.debug('Sound play prevented:', err);
      });
    } catch (error) {
      console.debug('Sound playback error:', error);
    }
  },

  /**
   * Setup event listeners for automatic sound triggers
   */
  setupListeners() {
    // Page navigation (whoosh sound)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link && link.getAttribute('href') !== '#') {
        this.play('whoosh');
      }
    });

    // Button clicks
    document.addEventListener('click', (e) => {
      const button = e.target.closest(
        '.btn, button:not(.menu-toggle):not(.mobile-menu-close)',
      );
      if (button) {
        this.play('click');
      }
    });

    // Mobile menu open/close
    document.addEventListener('click', (e) => {
      const menuToggle = e.target.closest('.menu-toggle');
      if (menuToggle) {
        const isOpening = !menuToggle.classList.contains('active');
        this.play(isOpening ? 'menuOpen' : 'menuClose');
      }
    });

    // Mobile menu close button
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.mobile-menu-close');
      if (closeBtn) {
        this.play('menuClose');
      }
    });

    // Mobile touch events for better responsiveness
    if ('ontouchstart' in window) {
      document.addEventListener('touchend', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (link && link.getAttribute('href') !== '#') {
          this.play('whoosh');
        }
      });
    }
  },

  /**
   * Toggle sound effects on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    this.saveSoundPreference(this.enabled);
    console.log(`🔊 Sound effects ${this.enabled ? 'enabled' : 'disabled'}`);
    return this.enabled;
  },

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    Object.values(this.sounds).forEach((sound) => {
      if (sound) sound.volume = this.volume;
    });
  },

  /**
   * Get sound preference from localStorage
   */
  getSoundPreference() {
    const saved = localStorage.getItem('soundEffectsEnabled');
    return saved === null ? true : saved === 'true';
  },

  /**
   * Save sound preference to localStorage
   */
  saveSoundPreference(enabled) {
    localStorage.setItem('soundEffectsEnabled', enabled);
  },
};

// Auto-initialize
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SoundEffects.init());
  } else {
    SoundEffects.init();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundEffects;
}
