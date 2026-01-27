// js/background-music.js
const BackgroundMusic = {
  currentAudio: null,
  enabled: false, // start muted - safer for mobile
  volume: 0.25,
  fadeInterval: null,
  audioContextUnlocked: false,

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

  init() {
    this.enabled = this.getMusicPreference();
    this.unlockAudioContext(); // Critical for iOS/Android
    this.setupPageListeners();
    this.createToggleButton();
    console.log('🎵 Background music module loaded (starts muted)');
  },

  unlockAudioContext() {
    const unlock = () => {
      if (this.audioContextUnlocked) return;

      // Create silent oscillator to force AudioContext resume
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        oscillator.connect(ctx.destination);
        oscillator.start();
        oscillator.stop();
      }

      // Also try playing/pausing a silent audio
      const silent = new Audio(
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
      );
      silent
        .play()
        .catch(() => {})
        .finally(() => silent.pause());

      this.audioContextUnlocked = true;
      document.removeEventListener('touchstart', unlock, { passive: true });
      document.removeEventListener('touchend', unlock, { passive: true });
      document.removeEventListener('click', unlock);
      console.log('🔓 Audio context unlocked');
    };

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

  setupPageListeners() {
    const handler = () => this.handlePageChange();
    window.addEventListener('hashchange', handler);
    // Initial load (give DOM time to settle)
    setTimeout(handler, 800);
  },

  handlePageChange() {
    const hash = window.location.hash.substring(1) || 'home';
    const trackPath = this.pageTracks[hash];

    // Never play background music on music/videos pages
    if (hash === 'music' || hash === 'videos') {
      this.stop();
      return;
    }

    if (!this.enabled) {
      this.stop();
      return;
    }

    if (!trackPath) return;

    // Stop anything playing before starting new
    this.stop(() => this.play(trackPath));
  },

  play(trackPath) {
    // Already playing this track?
    if (
      this.currentAudio?.src.includes(trackPath) &&
      !this.currentAudio.paused
    ) {
      return;
    }

    // Clean up old audio first
    this.stop(() => {
      const audio = new Audio(trackPath);
      audio.loop = true;
      audio.volume = 0;
      audio.preload = 'auto';

      audio.addEventListener(
        'canplaythrough',
        () => {
          if (!this.enabled) {
            audio.pause();
            return;
          }
          audio
            .play()
            .then(() => {
              this.currentAudio = audio;
              this.fadeIn(audio);
              console.log(`▶ Playing: ${trackPath.split('/').pop()}`);
            })
            .catch((e) => console.debug('Play blocked:', e));
        },
        { once: true },
      );

      audio.load();
    });
  },

  stop(callback = null) {
    if (!this.currentAudio) {
      if (callback) callback();
      return;
    }

    this.fadeOut(this.currentAudio, () => {
      this.currentAudio.pause();
      this.currentAudio.remove(); // Really help GC
      this.currentAudio = null;
      if (callback) callback();
    });
  },

  fadeIn(audio) {
    clearInterval(this.fadeInterval);
    let vol = 0;
    this.fadeInterval = setInterval(() => {
      vol = Math.min(vol + 0.025, this.volume);
      audio.volume = vol;
      if (vol >= this.volume) clearInterval(this.fadeInterval);
    }, 40);
  },

  fadeOut(audio, callback) {
    clearInterval(this.fadeInterval);
    let vol = audio.volume;
    this.fadeInterval = setInterval(() => {
      vol = Math.max(vol - 0.025, 0);
      audio.volume = vol;
      if (vol <= 0) {
        clearInterval(this.fadeInterval);
        if (callback) callback();
      }
    }, 40);
  },

  toggle() {
    this.enabled = !this.enabled;
    this.saveMusicPreference(this.enabled);

    if (this.enabled) {
      this.handlePageChange(); // start playing current page track
    } else {
      this.stop();
    }

    this.updateToggleButton();
    return this.enabled;
  },

  createToggleButton() {
    const btn = document.createElement('button');
    btn.id = 'music-toggle';
    btn.className = 'music-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle background music');
    btn.innerHTML = `<img src="images/icons/speaker.png" class="music-icon" alt="">`;
    document.body.appendChild(btn);

    // Use both click + touchend for mobile reliability
    const handleToggle = (e) => {
      e.preventDefault();
      this.toggle();
    };

    btn.addEventListener('click', handleToggle);
    btn.addEventListener('touchend', handleToggle, { passive: false });

    this.updateToggleButton();
  },

  updateToggleButton() {
    const btn = document.getElementById('music-toggle');
    if (!btn) return;

    const img = btn.querySelector('.music-icon');
    if (this.enabled) {
      btn.classList.add('enabled');
      btn.classList.remove('disabled');
      if (img) img.style.filter = 'none';
    } else {
      btn.classList.add('disabled');
      btn.classList.remove('enabled');
      if (img) img.style.filter = 'grayscale(80%) opacity(0.7)';
    }
  },

  getMusicPreference() {
    return localStorage.getItem('backgroundMusicEnabled') === 'true';
  },

  saveMusicPreference(enabled) {
    localStorage.setItem('backgroundMusicEnabled', enabled);
  },
};

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BackgroundMusic.init());
} else {
  BackgroundMusic.init();
}
