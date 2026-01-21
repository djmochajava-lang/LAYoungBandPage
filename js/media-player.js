// js/media-player.js

/**
 * Media Player Module
 * Handles custom music and video player controls
 */

const MediaPlayer = {
  players: [],

  /**
   * Initialize media players
   */
  init() {
    this.initAudioPlayers();
    this.initVideoPlayers();
    console.log('✅ Media players initialized');
  },

  /**
   * Initialize custom audio players
   */
  initAudioPlayers() {
    const audioPlayers = document.querySelectorAll('.custom-audio-player');

    audioPlayers.forEach((playerEl, index) => {
      const audio = playerEl.querySelector('audio');
      if (!audio) return;

      const player = {
        id: `audio-${index}`,
        element: playerEl,
        audio: audio,
        playBtn: playerEl.querySelector('.play-btn'),
        pauseBtn: playerEl.querySelector('.pause-btn'),
        progress: playerEl.querySelector('.progress'),
        progressBar: playerEl.querySelector('.progress-bar'),
        currentTime: playerEl.querySelector('.current-time'),
        duration: playerEl.querySelector('.duration'),
        volumeSlider: playerEl.querySelector('.volume-slider'),
      };

      this.setupAudioPlayer(player);
      this.players.push(player);
    });
  },

  /**
   * Setup individual audio player
   */
  setupAudioPlayer(player) {
    const {
      audio,
      playBtn,
      pauseBtn,
      progress,
      progressBar,
      currentTime,
      duration,
      volumeSlider,
    } = player;

    // Play/Pause
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        audio.play();
        playBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'block';

        if (typeof Analytics !== 'undefined') {
          Analytics.trackEvent('Audio', 'Play', audio.src);
        }
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        audio.pause();
        pauseBtn.style.display = 'none';
        if (playBtn) playBtn.style.display = 'block';
      });
    }

    // Update progress
    audio.addEventListener('timeupdate', () => {
      if (progress && audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${percent}%`;
      }

      if (currentTime) {
        currentTime.textContent = this.formatTime(audio.currentTime);
      }
    });

    // Set duration when loaded
    audio.addEventListener('loadedmetadata', () => {
      if (duration) {
        duration.textContent = this.formatTime(audio.duration);
      }
    });

    // Seek
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
      });
    }

    // Volume
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
      });
    }

    // When track ends
    audio.addEventListener('ended', () => {
      if (playBtn && pauseBtn) {
        pauseBtn.style.display = 'none';
        playBtn.style.display = 'block';
      }
      if (progress) progress.style.width = '0%';
    });
  },

  /**
   * Initialize video players
   */
  initVideoPlayers() {
    const videoPlayers = document.querySelectorAll('.custom-video-player');

    videoPlayers.forEach((playerEl) => {
      const video = playerEl.querySelector('video');
      if (!video) return;

      // Add play overlay
      const overlay = document.createElement('div');
      overlay.className = 'video-overlay';
      overlay.innerHTML = '<div class="play-icon">▶</div>';
      playerEl.appendChild(overlay);

      overlay.addEventListener('click', () => {
        video.play();
        overlay.style.display = 'none';

        if (typeof Analytics !== 'undefined') {
          Analytics.trackEvent('Video', 'Play', video.src);
        }
      });

      video.addEventListener('pause', () => {
        overlay.style.display = 'flex';
      });

      video.addEventListener('ended', () => {
        overlay.style.display = 'flex';
      });
    });
  },

  /**
   * Format time in MM:SS
   */
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Pause all players
   */
  pauseAll() {
    this.players.forEach((player) => {
      if (player.audio && !player.audio.paused) {
        player.audio.pause();
      }
    });
  },

  /**
   * Stop all players
   */
  stopAll() {
    this.players.forEach((player) => {
      if (player.audio) {
        player.audio.pause();
        player.audio.currentTime = 0;
      }
    });
  },

  /**
   * Get player by ID
   */
  getPlayer(id) {
    return this.players.find((p) => p.id === id);
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MediaPlayer.init());
  } else {
    MediaPlayer.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MediaPlayer;
}
