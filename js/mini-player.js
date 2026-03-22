// js/mini-player.js
// Global mini music player bar — shown when music player is active on other pages

(function () {
  'use strict';

  var bar       = document.getElementById('mini-player');
  var trackEl   = document.getElementById('miniPlayerTrack');
  var playBtn   = document.getElementById('miniPlayBtn');
  var prevBtn   = document.getElementById('miniPrevBtn');
  var nextBtn   = document.getElementById('miniNextBtn');
  var openBtn   = document.getElementById('miniOpenBtn');
  var stopBtn   = document.getElementById('miniStopBtn');

  if (!bar) return;

  var HIDDEN_CLASS = 'mini-player--hidden';

  function isPlayerPage() {
    var hash = window.location.hash.substring(1);
    return hash === 'LAYoungMusicPlayer' || hash === 'music';
  }

  function updateBar(state) {
    var audio = window.__musicPlayerAudio;

    // Hide if: no audio, paused, or already on the player page
    if (!audio || audio.paused || isPlayerPage()) {
      bar.classList.add(HIDDEN_CLASS);
      return;
    }

    bar.classList.remove(HIDDEN_CLASS);

    // Track name
    if (state && state.playlist && state.currentIndex >= 0) {
      trackEl.textContent = state.playlist[state.currentIndex].title;
    }

    // Play/Pause icon
    playBtn.innerHTML = audio.paused ? '&#9654;' : '&#9646;&#9646;';
  }

  /* ---- Controls ---- */

  playBtn.addEventListener('click', function () {
    var audio = window.__musicPlayerAudio;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(function () {});
    } else {
      audio.pause();
    }
    setTimeout(function () { updateBar(window.__musicPlayerState); }, 80);
  });

  prevBtn.addEventListener('click', function () {
    if (window.__musicPlayer) {
      window.__musicPlayer.prev();
    } else {
      window.dispatchEvent(new CustomEvent('layoung:player-prev'));
    }
    setTimeout(function () { updateBar(window.__musicPlayerState); }, 200);
  });

  nextBtn.addEventListener('click', function () {
    if (window.__musicPlayer) {
      window.__musicPlayer.next();
    } else {
      window.dispatchEvent(new CustomEvent('layoung:player-next'));
    }
    setTimeout(function () { updateBar(window.__musicPlayerState); }, 200);
  });

  openBtn.addEventListener('click', function () {
    // Navigate to music player page
    if (typeof Router !== 'undefined') {
      Router.navigateTo('LAYoungMusicPlayer');
    } else {
      window.location.hash = '#LAYoungMusicPlayer';
    }
  });

  stopBtn.addEventListener('click', function () {
    var audio = window.__musicPlayerAudio;
    if (audio) {
      audio.pause();
      audio.src = '';
      window.__musicPlayerAudio = null;
      window.__musicPlayerInitialized = false;
      window.__musicPlayer = null;
    }
    bar.classList.add(HIDDEN_CLASS);
    // Let background music resume
    if (typeof BackgroundMusic !== 'undefined') {
      BackgroundMusic.handlePageChange();
    }
  });

  /* ---- Event listeners ---- */

  // Player broadcasts its state on every change
  window.addEventListener('layoung:player-state', function (e) {
    updateBar(e.detail);
  });

  // Bind audio events when audio element becomes available
  function bindAudio(audio) {
    audio.addEventListener('play', function () { updateBar(window.__musicPlayerState); });
    audio.addEventListener('pause', function () { updateBar(window.__musicPlayerState); });
    audio.addEventListener('ended', function () {
      setTimeout(function () { updateBar(window.__musicPlayerState); }, 600);
    });
  }

  // Poll until audio element exists (created dynamically on first player visit)
  var pollInterval = setInterval(function () {
    if (window.__musicPlayerAudio) {
      bindAudio(window.__musicPlayerAudio);
      updateBar(window.__musicPlayerState);
      clearInterval(pollInterval);
    }
  }, 500);

  // Re-check on page navigation
  window.addEventListener('hashchange', function () {
    setTimeout(function () { updateBar(window.__musicPlayerState); }, 150);
  });

  console.log('🎵 Mini player initialized');
})();
