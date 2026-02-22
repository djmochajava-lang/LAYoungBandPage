// js/music-player-app.js — L.A. Young Music Player logic
// Extracted from inline <script> in pages/LAYoungMusicPlayer.html
// to avoid Live Server / dev-server script injection corruption.
(function () {
  'use strict';

  // Guard against multiple initializations (Live Server re-injects scripts)
  if (window.__musicPlayerInitialized) {
    console.log('🎵 Music player already initialized, skipping');
    return;
  }
  window.__musicPlayerInitialized = true;

  /* ---- Playlist data ---- */
  // Paths are relative to the page URL (player.html or index.html, both at root)
  var playlist = [
    { title: 'Introduction Groove', src: 'music/IntroductiongroveSoft.mp3' },
    { title: 'No One Can Love You More', src: 'Media/no_one_can_love_you_more.mp3' },
    { title: 'Daydreaming In Sound', src: 'music/DaydreamingInSoundsoft.mp3' },
    { title: 'The Woman In Me', src: 'Media/The_Woman_In_Me_warm_polish.mp3' },
    { title: 'Midnight Melody', src: 'music/MidnightMelodySoft.mp3' },
    { title: 'Shopaholic Teaser', src: 'music/ShopaholicTeaserSoft.mp3' }
  ];

  var currentIndex = -1;
  // IMPORTANT: use createElement('audio') instead of new Audio().
  // new Audio() created inside dynamically-injected scripts doesn't
  // properly connect to Chrome's media resource manager, causing
  // permanent stalls (readyState=0, networkState=2).
  var audio = document.createElement('audio');
  audio.preload = 'metadata';
  var isPlaying = false;
  var bgMusicWasEnabled = false;
  var isShuffled = false;
  var repeatMode = 0; // 0 = off, 1 = repeat all, 2 = repeat one
  var shuffleOrder = [];

  /* ---- DOM Refs ---- */
  var trackItems = document.querySelectorAll('#spTrackList .sp-track-item');
  var mainPlayBtn = document.getElementById('spMainPlayBtn');
  var progressWrap = document.getElementById('spProgressWrap');
  var progressFill = document.getElementById('spProgressFill');
  var progressBar = document.getElementById('spProgressBar');
  var timeCurrent = document.getElementById('spTimeCurrent');
  var timeTotal = document.getElementById('spTimeTotal');
  var followBtn = document.getElementById('spFollowBtn');
  var shuffleBtn = document.getElementById('spShuffleBtn');
  var repeatBtn = document.getElementById('spRepeatBtn');
  var prevBtn = document.getElementById('spPrevBtn');
  var nextBtn = document.getElementById('spNextBtn');

  function fmt(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /* ---- Preload durations ---- */
  playlist.forEach(function (track, i) {
    var tmp = document.createElement('audio');
    tmp.preload = 'metadata';
    tmp.src = track.src;
    tmp.addEventListener('loadedmetadata', function () {
      var durEls = trackItems[i] ? trackItems[i].querySelectorAll('.sp-dur') : [];
      for (var d = 0; d < durEls.length; d++) {
        durEls[d].textContent = fmt(tmp.duration);
      }
      playlist[i].duration = tmp.duration;
    });
  });

  /* ---- Background Music Integration ---- */
  function stopBgMusic() {
    if (typeof BackgroundMusic !== 'undefined' && BackgroundMusic.currentAudio) {
      bgMusicWasEnabled = BackgroundMusic.enabled;
      BackgroundMusic.stop();
    }
  }
  function resumeBgMusic() {
    if (typeof BackgroundMusic !== 'undefined' && bgMusicWasEnabled) {
      BackgroundMusic.handlePageChange();
    }
  }

  /* ---- Shuffle helpers ---- */
  function generateShuffleOrder() {
    shuffleOrder = [];
    for (var i = 0; i < playlist.length; i++) shuffleOrder.push(i);
    // Fisher-Yates shuffle
    for (var j = shuffleOrder.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = shuffleOrder[j];
      shuffleOrder[j] = shuffleOrder[k];
      shuffleOrder[k] = tmp;
    }
  }

  function getNextIndex() {
    if (isShuffled) {
      var pos = shuffleOrder.indexOf(currentIndex);
      if (pos < shuffleOrder.length - 1) return shuffleOrder[pos + 1];
      return -1; // end of shuffle
    }
    if (currentIndex < playlist.length - 1) return currentIndex + 1;
    return -1; // end of list
  }

  function getPrevIndex() {
    if (isShuffled) {
      var pos = shuffleOrder.indexOf(currentIndex);
      if (pos > 0) return shuffleOrder[pos - 1];
      return -1;
    }
    if (currentIndex > 0) return currentIndex - 1;
    return -1;
  }

  /* ---- EQ bars state ---- */
  function updateEqState() {
    for (var i = 0; i < trackItems.length; i++) {
      if (i === currentIndex && isPlaying) {
        trackItems[i].classList.add('sp-playing');
      } else {
        trackItems[i].classList.remove('sp-playing');
      }
    }
  }

  /* ---- Load & Play ---- */
  function loadTrack(index, autoplay) {
    if (index < 0 || index >= playlist.length) return;

    // Stop the single audio channel completely before loading anything new
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    updatePlayBtn();
    updateEqState();

    currentIndex = index;

    // Update active highlight
    for (var i = 0; i < trackItems.length; i++) {
      trackItems[i].classList.toggle('sp-active', i === index);
    }

    // Position progress bar after the active track
    var activeItem = trackItems[index];
    if (activeItem && activeItem.parentNode) {
      activeItem.parentNode.insertBefore(progressWrap, activeItem.nextSibling);
    }

    progressFill.style.width = '0%';
    timeCurrent.textContent = '0:00';

    audio.src = playlist[index].src;
    audio.load();

    if (autoplay) {
      stopBgMusic();
      audio.play().then(function () {
        isPlaying = true;
        updatePlayBtn();
        updateEqState();
        progressWrap.classList.add('sp-visible');
      }).catch(function () {});
    }
  }

  function toggleCurrent() {
    if (currentIndex < 0) {
      if (isShuffled) {
        generateShuffleOrder();
        loadTrack(shuffleOrder[0], true);
      } else {
        loadTrack(0, true);
      }
      return;
    }
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      updatePlayBtn();
      updateEqState();
      resumeBgMusic();
    } else {
      stopBgMusic();
      audio.play();
      isPlaying = true;
      updatePlayBtn();
      updateEqState();
      progressWrap.classList.add('sp-visible');
    }
  }

  var playSVG = '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="#000"/></svg>';
  var pauseSVG = '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="4" height="18" fill="#000"/><rect x="15" y="3" width="4" height="18" fill="#000"/></svg>';

  function updatePlayBtn() {
    mainPlayBtn.innerHTML = isPlaying ? pauseSVG : playSVG;
  }

  /* ---- Track click handlers ---- */
  for (var t = 0; t < trackItems.length; t++) {
    (function (idx) {
      trackItems[idx].addEventListener('click', function () {
        if (idx === currentIndex) {
          toggleCurrent();
        } else {
          loadTrack(idx, true);
        }
      });
    })(t);
  }

  /* ---- Main play button ---- */
  mainPlayBtn.addEventListener('click', function () {
    toggleCurrent();
  });

  /* ---- Previous track ---- */
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      // If more than 3 seconds in, restart current track
      if (audio.currentTime > 3 && currentIndex >= 0) {
        audio.currentTime = 0;
        progressFill.style.width = '0%';
        timeCurrent.textContent = '0:00';
        return;
      }
      var prev = getPrevIndex();
      if (prev >= 0) {
        loadTrack(prev, true);
      } else if (repeatMode >= 1 && currentIndex >= 0) {
        // Wrap to last track
        if (isShuffled) {
          loadTrack(shuffleOrder[shuffleOrder.length - 1], true);
        } else {
          loadTrack(playlist.length - 1, true);
        }
      }
    });
  }

  /* ---- Next track ---- */
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      var next = getNextIndex();
      if (next >= 0) {
        loadTrack(next, true);
      } else if (repeatMode >= 1) {
        // Wrap to first track
        if (isShuffled) {
          generateShuffleOrder();
          loadTrack(shuffleOrder[0], true);
        } else {
          loadTrack(0, true);
        }
      }
    });
  }

  /* ---- Shuffle toggle ---- */
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', function () {
      isShuffled = !isShuffled;
      shuffleBtn.classList.toggle('sp-ctrl-active', isShuffled);
      if (isShuffled) {
        generateShuffleOrder();
        // Move current track to front of shuffle
        if (currentIndex >= 0) {
          var pos = shuffleOrder.indexOf(currentIndex);
          if (pos > 0) {
            shuffleOrder.splice(pos, 1);
            shuffleOrder.unshift(currentIndex);
          }
        }
      }
      console.log('🎵 Shuffle ' + (isShuffled ? 'ON' : 'OFF'));
    });
  }

  /* ---- Repeat toggle (off → all → one → off) ---- */
  if (repeatBtn) {
    repeatBtn.addEventListener('click', function () {
      repeatMode = (repeatMode + 1) % 3;
      repeatBtn.classList.toggle('sp-ctrl-active', repeatMode > 0);
      // Show "1" badge for repeat-one
      if (repeatMode === 2) {
        repeatBtn.title = 'Repeat One';
        repeatBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="currentColor"/></svg><span style="position:absolute;font-size:8px;font-weight:700;color:currentColor;top:50%;left:50%;transform:translate(-50%,-50%);">1</span>';
      } else {
        repeatBtn.title = repeatMode === 1 ? 'Repeat All' : 'Repeat';
        repeatBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="currentColor"/></svg>';
      }
      console.log('🎵 Repeat mode: ' + ['OFF', 'ALL', 'ONE'][repeatMode]);
    });
  }

  /* ---- Audio events ---- */
  audio.addEventListener('loadedmetadata', function () {
    timeTotal.textContent = fmt(audio.duration);
  });

  audio.addEventListener('timeupdate', function () {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    timeCurrent.textContent = fmt(audio.currentTime);
  });

  audio.addEventListener('ended', function () {
    // Repeat One — replay same track
    if (repeatMode === 2) {
      audio.currentTime = 0;
      audio.play().catch(function () {});
      return;
    }

    // Get next track
    var next = getNextIndex();

    if (next >= 0) {
      // Play next track
      loadTrack(next, true);
    } else if (repeatMode === 1) {
      // Repeat All — wrap to beginning
      if (isShuffled) {
        generateShuffleOrder();
        loadTrack(shuffleOrder[0], true);
      } else {
        loadTrack(0, true);
      }
    } else {
      // End of playlist — reset
      isPlaying = false;
      audio.currentTime = 0;
      progressFill.style.width = '0%';
      timeCurrent.textContent = '0:00';
      progressWrap.classList.remove('sp-visible');
      updatePlayBtn();
      updateEqState();
      for (var i = 0; i < trackItems.length; i++) {
        trackItems[i].classList.remove('sp-active');
      }
      currentIndex = -1;
      resumeBgMusic();
    }
  });

  /* ---- Seek ---- */
  progressBar.addEventListener('click', function (e) {
    if (!audio.duration) return;
    var rect = progressBar.getBoundingClientRect();
    var pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  /* ---- Follow / Mailing List (Firebase) ---- */
  var _fbApp = null;
  var _fbDb = null;
  var _fbAuth = null;
  var _fbProviders = {};

  function initFirebase() {
    if (_fbApp) return;
    try {
      var cfg = window.SITE_CONFIG && window.SITE_CONFIG.firebase;
      if (!cfg || typeof firebase === 'undefined') {
        console.warn('[Follow] Firebase not available');
        return;
      }
      _fbApp = firebase.initializeApp(cfg);
      _fbDb = firebase.firestore();
      _fbAuth = firebase.auth();

      // Providers
      var goog = new firebase.auth.GoogleAuthProvider();
      goog.setCustomParameters({ prompt: 'select_account' });
      _fbProviders.google = goog;

      var apple = new firebase.auth.OAuthProvider('apple.com');
      apple.addScope('email');
      apple.addScope('name');
      _fbProviders.apple = apple;

      var ms = new firebase.auth.OAuthProvider('microsoft.com');
      ms.setCustomParameters({ prompt: 'select_account' });
      _fbProviders.microsoft = ms;

      console.log('[Follow] Firebase initialized');
    } catch (err) {
      console.error('[Follow] Firebase init error:', err);
    }
  }

  // DOM refs
  var overlay = document.getElementById('spFollowOverlay');
  var closeBtn = document.getElementById('spFollowClose');
  var followForm = document.getElementById('spFollowForm');
  var followEmail = document.getElementById('spFollowEmail');
  var followPhone = document.getElementById('spFollowPhone');
  var followSubmitBtn = document.getElementById('spFollowSubmit');
  var followMsg = document.getElementById('spFollowMsg');
  var googleBtn = document.getElementById('spGoogleBtn');
  var appleBtn = document.getElementById('spAppleBtn');
  var microsoftBtn = document.getElementById('spMicrosoftBtn');

  function showFollowMsg(text, type) {
    if (!followMsg) return;
    followMsg.textContent = text;
    followMsg.className = 'sp-follow-msg ' + type;
  }
  function clearFollowMsg() {
    if (!followMsg) return;
    followMsg.textContent = '';
    followMsg.className = 'sp-follow-msg';
  }

  function setFollowingState(on) {
    if (!followBtn) return;
    if (on) {
      followBtn.textContent = 'Following';
      followBtn.style.borderColor = '#ffd700';
      followBtn.style.color = '#ffd700';
      localStorage.setItem('la-young-following', 'true');
    } else {
      followBtn.textContent = 'Follow';
      followBtn.style.borderColor = 'rgba(255,255,255,0.35)';
      followBtn.style.color = '#fff';
      localStorage.removeItem('la-young-following');
    }
  }

  // Restore follow state on load
  if (localStorage.getItem('la-young-following') === 'true') {
    setFollowingState(true);
  }

  function openModal() {
    if (!overlay) return;
    initFirebase();
    clearFollowMsg();
    if (followEmail) followEmail.value = '';
    if (followPhone) followPhone.value = '';
    overlay.classList.add('active');
  }
  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('active');
  }

  // Open/close modal
  if (followBtn) {
    followBtn.addEventListener('click', function () {
      if (followBtn.textContent === 'Following') {
        setFollowingState(false);
        return;
      }
      openModal();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
  }

  // Save follower to Firestore
  function saveFollower(email, phone, displayName, provider) {
    if (!_fbDb) {
      showFollowMsg('Service unavailable. Please try again later.', 'error');
      return Promise.reject('No Firestore');
    }
    // Check for duplicate
    return _fbDb.collection('followers')
      .where('email', '==', email.toLowerCase())
      .get()
      .then(function (snap) {
        if (!snap.empty) {
          showFollowMsg("You're already following! Welcome back.", 'info');
          setFollowingState(true);
          setTimeout(closeModal, 1800);
          return;
        }
        // Write new follower
        return _fbDb.collection('followers').add({
          email: email.toLowerCase(),
          phone: phone || null,
          displayName: displayName || null,
          source: 'music-player',
          authProvider: provider,
          followedAt: firebase.firestore.FieldValue.serverTimestamp(),
          notifyNewSongs: true,
          notifyShows: true,
          notifyTickets: true
        }).then(function () {
          showFollowMsg('Welcome to the family! \ud83c\udfb6', 'success');
          setFollowingState(true);
          setTimeout(closeModal, 1800);
        });
      })
      .catch(function (err) {
        console.error('[Follow] Firestore error:', err);
        showFollowMsg('Something went wrong. Please try again.', 'error');
      });
  }

  // Social sign-in handler
  function socialFollow(providerKey) {
    if (!_fbAuth || !_fbProviders[providerKey]) {
      showFollowMsg('Sign-in not available. Use email below.', 'error');
      return;
    }
    clearFollowMsg();
    showFollowMsg('Signing in...', 'info');

    _fbAuth.signInWithPopup(_fbProviders[providerKey])
      .then(function (result) {
        var user = result.user;
        var email = user.email;
        var name = user.displayName || null;
        if (!email) {
          showFollowMsg('Could not get email. Please use the form below.', 'error');
          return;
        }
        return saveFollower(email, null, name, providerKey);
      })
      .then(function () {
        // Sign out — we don't need a persistent session
        if (_fbAuth.currentUser) _fbAuth.signOut();
      })
      .catch(function (err) {
        console.error('[Follow] Social sign-in error:', err);
        if (err.code === 'auth/popup-closed-by-user') {
          clearFollowMsg();
        } else {
          showFollowMsg('Sign-in failed. Try email below.', 'error');
        }
      });
  }

  if (googleBtn) googleBtn.addEventListener('click', function () { socialFollow('google'); });
  if (appleBtn) appleBtn.addEventListener('click', function () { socialFollow('apple'); });
  if (microsoftBtn) microsoftBtn.addEventListener('click', function () { socialFollow('microsoft'); });

  // Manual email form
  if (followForm) {
    followForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = followEmail.value.trim();
      var phone = followPhone.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFollowMsg('Please enter a valid email address.', 'error');
        return;
      }
      clearFollowMsg();
      followSubmitBtn.disabled = true;
      followSubmitBtn.textContent = 'Joining...';
      saveFollower(email, phone, null, 'email')
        .finally(function () {
          followSubmitBtn.disabled = false;
          followSubmitBtn.textContent = 'Join the List';
        });
    });
  }

  /* ---- Volume Knob ---- */
  var knob = document.getElementById('spKnob');
  var knobIndicator = document.getElementById('spKnobIndicator');
  var volIcon = document.getElementById('spVolIcon');
  var volPct = document.getElementById('spVolPct');

  // Knob rotation: -135deg (min/mute) to +135deg (max)
  var knobAngle = 135;    // Start at max (135 = 100%)
  var prevVolume = 1;
  var isMuted = false;

  function angleToVolume(angle) {
    // -135 = 0%, +135 = 100%
    return Math.max(0, Math.min(1, (angle + 135) / 270));
  }

  function volumeToAngle(vol) {
    return (vol * 270) - 135;
  }

  function setKnobAngle(angle) {
    knobAngle = Math.max(-135, Math.min(135, angle));
    knobIndicator.style.transform = 'translateX(-50%) rotate(' + knobAngle + 'deg)';
    var vol = angleToVolume(knobAngle);
    audio.volume = vol;
    var pct = Math.round(vol * 100);
    volPct.textContent = pct;

    // Update icon
    if (vol === 0) {
      volIcon.innerHTML = '&#x1f507;';
      volIcon.classList.add('sp-muted');
    } else if (vol < 0.5) {
      volIcon.innerHTML = '&#x1f509;';
      volIcon.classList.remove('sp-muted');
    } else {
      volIcon.innerHTML = '&#x1f50a;';
      volIcon.classList.remove('sp-muted');
    }
  }

  // Initialize knob position
  setKnobAngle(135);

  // Drag interaction
  var isDragging = false;
  var dragStartY, dragStartAngle;

  knob.addEventListener('mousedown', startDrag);
  knob.addEventListener('touchstart', startDrag, { passive: false });

  function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    var point = e.touches ? e.touches[0] : e;
    dragStartY = point.clientY;
    dragStartAngle = knobAngle;
    knob.style.cursor = 'grabbing';
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  }

  function onDrag(e) {
    if (!isDragging) return;
    e.preventDefault();
    var point = e.touches ? e.touches[0] : e;
    // Dragging up = louder, down = quieter
    var deltaY = dragStartY - point.clientY;
    var newAngle = dragStartAngle + (deltaY * 1.8);
    setKnobAngle(newAngle);
    isMuted = false;
  }

  function endDrag() {
    isDragging = false;
    knob.style.cursor = 'grab';
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
  }

  // Mute toggle via icon click
  volIcon.addEventListener('click', function () {
    if (isMuted) {
      isMuted = false;
      setKnobAngle(volumeToAngle(prevVolume));
    } else {
      prevVolume = angleToVolume(knobAngle);
      if (prevVolume < 0.05) prevVolume = 0.5;
      isMuted = true;
      setKnobAngle(-135);
    }
  });

  /* ---- About Toggle ---- */
  window.toggleAbout = function () {
    var text = document.getElementById('spAboutText');
    var btn = document.getElementById('spShowMoreBtn');
    if (text.classList.contains('sp-collapsed')) {
      text.classList.remove('sp-collapsed');
      btn.textContent = 'Show less';
    } else {
      text.classList.add('sp-collapsed');
      btn.textContent = 'Show more';
    }
  };

  console.log('🎵 Music player app initialized');
})();
