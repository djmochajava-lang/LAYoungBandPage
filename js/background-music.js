// js/background-music.js - FIXED VERSION

/**
 * Background Music Module
 * Plays different music on different pages with global control
 */

const BackgroundMusic = {
  currentAudio: null,
  enabled: true,
  volume: 0.3, // 30% volume
  fadeInterval: null,

  // Map pages to music files
  pageTracks: {
    home: 'music/IntroductiongroveSoft.mp3',
    bio: 'music/DaydreamingInSoundsoft.mp3',
    music: 'music/MidnightMelodySoft.mp3',
    videos: 'music/ShopaholicTeaserSoft.mp3',
    gallery: 'music/IntroductiongroveSoft.mp3',
    tour: 'music/MidnightMelodySoft.mp3',
    merch: 'music/ShopaholicTeaserSoft.mp3',
    contact: 'music/DaydreamingInSoundsoft.mp3',
  },

  /**
   * Initialize background music
   */
  init() {
    // Check user preference
    this.enabled = this.getMusicPreference();

    // Listen for page changes
    this.setupPageListeners();

    // Create global toggle button
    this.createToggleButton();

    console.log('🎵 Background music initialized');
  },

  /**
   * Setup listeners for page navigation
   */
  setupPageListeners() {
    // Listen for hash changes (page navigation)
    window.addEventListener('hashchange', () => {
      this.handlePageChange();
    });

    // Initial page load
    setTimeout(() => {
      this.handlePageChange();
    }, 1000); // Wait 1 second after page loads
  },

  /**
   * Handle page changes
   */
  handlePageChange() {
    const hash = window.location.hash.substring(1) || 'home';
    const trackPath = this.pageTracks[hash];

    // Don't play music on Music or Videos pages
    if (hash === 'music' || hash === 'videos') {
      console.log(`🔇 No background music on ${hash} page`);
      this.stopMusic();
      return;
    }

    if (!this.enabled) {
      // If muted, stop any playing music
      this.stopMusic();
      return;
    }

    if (trackPath) {
      // ALWAYS stop current track when changing pages
      if (this.currentAudio) {
        this.stopCurrentTrack(() => {
          this.playTrack(trackPath);
        });
      } else {
        this.playTrack(trackPath);
      }
    }
  },

  /**
   * Play a music track
   */
  playTrack(trackPath) {
    // If same track is already playing, don't restart
    if (this.currentAudio && this.currentAudio.src.includes(trackPath)) {
      if (this.currentAudio.paused) {
        this.currentAudio.play().catch((err) => {
          console.debug('Music play prevented:', err);
        });
      }
      return;
    }

    // Fade out current track
    if (this.currentAudio) {
      this.fadeOut(this.currentAudio, () => {
        this.currentAudio.pause();
        this.currentAudio = null;
        this.startNewTrack(trackPath);
      });
    } else {
      this.startNewTrack(trackPath);
    }
  },

  /**
   * Start playing a new track
   */
  startNewTrack(trackPath) {
    const audio = new Audio(trackPath);
    audio.volume = 0;
    audio.loop = true;

    audio.addEventListener('canplaythrough', () => {
      audio
        .play()
        .then(() => {
          this.currentAudio = audio;
          this.fadeIn(audio);
          console.log(`🎵 Playing: ${trackPath}`);
        })
        .catch((err) => {
          console.debug('Music play prevented:', err);
        });
    });

    audio.load();
  },

  /**
   * Fade in audio
   */
  fadeIn(audio) {
    const targetVolume = this.volume;
    const step = targetVolume / 20; // 20 steps

    clearInterval(this.fadeInterval);

    this.fadeInterval = setInterval(() => {
      if (audio.volume < targetVolume - step) {
        audio.volume = Math.min(audio.volume + step, targetVolume);
      } else {
        audio.volume = targetVolume;
        clearInterval(this.fadeInterval);
      }
    }, 50); // 50ms intervals = 1 second total fade
  },

  /**
   * Fade out audio
   */
  fadeOut(audio, callback) {
    const step = audio.volume / 20;

    clearInterval(this.fadeInterval);

    this.fadeInterval = setInterval(() => {
      if (audio.volume > step) {
        audio.volume = Math.max(audio.volume - step, 0);
      } else {
        audio.volume = 0;
        clearInterval(this.fadeInterval);
        if (callback) callback();
      }
    }, 50);
  },

  /**
   * Toggle music on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    this.saveMusicPreference(this.enabled);

    if (this.enabled) {
      this.handlePageChange();
    } else {
      this.stopMusic();
    }

    this.updateToggleButton();
    return this.enabled;
  },

  /**
   * Stop all music
   */
  stopMusic() {
    if (this.currentAudio) {
      this.fadeOut(this.currentAudio, () => {
        this.currentAudio.pause();
        this.currentAudio = null;
      });
    }
  },

  /**
   * Create global toggle button
   */
  createToggleButton() {
    const button = document.createElement('button');
    button.id = 'music-toggle';
    button.className = 'music-toggle-btn';
    button.setAttribute('aria-label', 'Toggle background music');

    document.body.appendChild(button);

    button.addEventListener('click', () => {
      this.toggle();

      // Play sound effect when toggling
      if (typeof SoundEffects !== 'undefined') {
        SoundEffects.play('click');
      }
    });

    this.updateToggleButton();
  },

  /**
   * Update toggle button appearance - WITH CUSTOM IMAGE
   */
  updateToggleButton() {
    const button = document.getElementById('music-toggle');
    if (!button) return;

    if (this.enabled) {
      button.innerHTML = `
        <img src="images/icons/speaker.png" alt="Music On" class="music-icon music-on" />
        <span>On</span>
      `;
      button.classList.remove('disabled');
      button.classList.add('enabled');
    } else {
      button.innerHTML = `
        <img src="images/icons/speaker.png" alt="Music Off" class="music-icon music-off" />
        <span>Off</span>
      `;
      button.classList.add('disabled');
      button.classList.remove('enabled');
    }
  },

  /**
   * Set volume
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  },

  /**
   * Get music preference from localStorage
   */
  getMusicPreference() {
    const saved = localStorage.getItem('backgroundMusicEnabled');
    return saved === null ? false : saved === 'true'; // Changed true to FALSE
  },

  /**
   * Save music preference to localStorage
   */
  saveMusicPreference(enabled) {
    localStorage.setItem('backgroundMusicEnabled', enabled);
  },
};

// Auto-initialize
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BackgroundMusic.init());
  } else {
    BackgroundMusic.init();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundMusic;
}
