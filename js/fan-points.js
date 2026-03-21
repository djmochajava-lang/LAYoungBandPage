// js/fan-points.js

/**
 * Fan Points — Gamification System
 * Awards points for site engagement (page visits, activities).
 * Stores locally in localStorage; syncs to Firestore on sign-in.
 * "Fan of the Month" — top monthly earner wins free merch.
 */

const FanPoints = {
  initialized: false,
  _points: 0,
  _earned: {},
  _monthKey: '',
  _monthlyPoints: 0,
  _counterEl: null,
  _counterValueEl: null,
  _joinBarEl: null,
  _firebaseUser: null,
  _db: null,
  // True during the window between page load and onAuthStateChanged resolution.
  // Prevents the join bar from flashing for users who are already signed in.
  _authPending: false,

  STORAGE_KEY: 'layoung-fan-points',
  EARNED_KEY: 'layoung-fan-earned',
  MONTH_KEY: 'layoung-fan-month',
  MONTHLY_PTS_KEY: 'layoung-fan-monthly-pts',
  DISMISS_KEY: 'layoung-fan-join-dismissed',
  GAME_FLAG: 'layoung-game-played',
  // Persisted across sessions — set when user signs in, cleared on sign-out.
  // Lets us suppress the join bar before async Firebase auth state resolves.
  HAS_AUTH_KEY: 'layoung-fan-authed',

  // ── Point Values ──────────────────────────────────

  POINT_VALUES: {
    'page:home':                  { points: 5,  label: 'Explored Home' },
    'page:bio':                   { points: 10, label: 'Read the Bio' },
    'page:music':                 { points: 10, label: 'Checked the Music' },
    'page:projects':              { points: 10, label: 'Explored Projects' },
    'page:gallery':               { points: 10, label: 'Visited Gallery' },
    'page:shows':                 { points: 10, label: 'Checked Live Shows' },
    'page:performances':          { points: 10, label: 'Explored Performances' },
    'page:LAYoungMusicPlayer':    { points: 15, label: 'Opened the Player' },
    // 'page:merch':                 { points: 10, label: 'Browsed Merch' },  // Hidden until merch is live
    'page:support':               { points: 10, label: 'Visited Support' },
    'page:contact':               { points: 10, label: 'Found Connect' },
    'page:fanwall':               { points: 10, label: 'Hit the Fan Wall' },
    'activity:play-track':        { points: 20, label: 'Played a Track \u266B' },
    'activity:gallery-lightbox':  { points: 15, label: 'Opened Lightbox' },
    'activity:fanwall-post':      { points: 25, label: 'Posted on Wall' },
    'activity:contact-form':      { points: 20, label: 'Sent a Message' },
    'activity:email-signup':      { points: 20, label: 'Joined the Fam' },
    'activity:read-support-article': { points: 15, label: 'Read the Story' },
    'activity:play-game':         { points: 25, label: 'Played the Game' },
  },

  // ── Init ──────────────────────────────────────────

  init: function() {
    if (this.initialized) return;

    // Load saved state
    this._load();

    // If the user has signed in before, mark auth as pending until Firebase
    // resolves onAuthStateChanged. This prevents the join bar from flashing
    // on page load or SPA navigation for users who are already signed in.
    try {
      if (localStorage.getItem(this.HAS_AUTH_KEY)) {
        this._authPending = true;
      }
    } catch(e) {}

    // Check for month rollover
    this._checkMonthRollover();

    // Create persistent UI
    this._createCounter();
    this._createJoinBar();

    // Listen for SPA page navigations
    var self = this;
    document.addEventListener('layoung:page-loaded', function(e) {
      var pageName = e.detail && e.detail.page;
      if (!pageName) return;
      var key = 'page:' + pageName;
      var pv = self.POINT_VALUES[key];
      if (pv) {
        self.award(key, pv.points, pv.label);
      }
      // Show/hide join bar based on current page (home only)
      if (pageName === 'home') {
        var earnedCount = Object.keys(self._earned).length;
        if (earnedCount >= 3 && !self._firebaseUser) {
          self._showJoinBar();
        }
      } else {
        self._hideJoinBar();
      }
    });

    // Check for game-played flag (GroovyBandRush sets this)
    this._checkGameFlag();

    // Initialize Firebase sync
    this._initFirebaseSync();

    this.initialized = true;
    console.log('\u2705 FanPoints initialized (' + this._points + ' pts)');
  },

  // ── Award Points ──────────────────────────────────

  award: function(activityKey, points, label) {
    // One-time guard — skip if already earned
    if (this._earned[activityKey]) return;

    // Mark as earned
    this._earned[activityKey] = true;
    this._points += points;
    this._monthlyPoints += points;

    // Persist
    this._save();

    // Show floating animation
    this._showFloating(points, label);

    // Update counter badge
    this._updateCounter();

    // Play subtle sound (reuse existing click sound)
    if (typeof SoundEffects !== 'undefined' && SoundEffects.play) {
      SoundEffects.play('click');
    }

    // Show join bar after 3+ activities (not annoying on first visit)
    var earnedCount = Object.keys(this._earned).length;
    if (earnedCount >= 3 && !this._firebaseUser) {
      this._showJoinBar();
    }

    // Sync to Firestore if signed in
    if (this._firebaseUser && this._db) {
      this._syncToFirestore();
    }

    console.log('\uD83C\uDFC6 +' + points + ' pts: ' + label + ' (total: ' + this._points + ')');
  },

  // ── Floating Animation ────────────────────────────

  _showFloating: function(points, label) {
    var el = document.createElement('div');
    el.className = 'fp-floating';
    el.innerHTML = '<span class="fp-floating-points">+' + points + '</span>' +
                   '<span class="fp-floating-label">' + this._escapeHtml(label) + '</span>';

    // Random slight horizontal offset for visual variety
    var offsetX = (Math.random() - 0.5) * 60;
    el.style.left = 'calc(50% + ' + offsetX + 'px)';

    document.body.appendChild(el);

    // Clean up after animation
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2000);
  },

  // ── Counter Badge ─────────────────────────────────

  _createCounter: function() {
    // Don't duplicate
    if (document.getElementById('fp-counter')) return;

    var el = document.createElement('div');
    el.className = 'fp-counter';
    el.id = 'fp-counter';
    el.title = 'Your Fan Points';
    el.innerHTML = '<span class="fp-counter-icon">\u2605</span>' +
                   '<span class="fp-counter-value" id="fp-counter-value">0</span>' +
                   '<span class="fp-counter-label">pts</span>';
    document.body.appendChild(el);

    this._counterEl = el;
    this._counterValueEl = document.getElementById('fp-counter-value');

    // Show if already has points
    if (this._points > 0) {
      this._counterValueEl.textContent = this._points;
      el.classList.add('visible');
    }
  },

  _updateCounter: function() {
    if (!this._counterValueEl || !this._counterEl) return;

    this._counterValueEl.textContent = this._points;
    this._counterEl.classList.add('visible');

    // Bump animation
    this._counterEl.classList.remove('fp-bump');
    // Force reflow to restart animation
    void this._counterEl.offsetWidth;
    this._counterEl.classList.add('fp-bump');
  },

  // ── Join Bar ──────────────────────────────────────

  _createJoinBar: function() {
    if (document.getElementById('fp-join-bar')) return;

    var el = document.createElement('div');
    el.className = 'fp-join-bar';
    el.id = 'fp-join-bar';
    el.innerHTML =
      '<span class="fp-join-text">' +
        '\u2605 You have <strong id="fp-join-count">0</strong> fan points! ' +
        'Sign in to save them and become a <strong>Top Fan</strong>.' +
      '</span>' +
      '<button class="fp-join-btn" id="fp-join-signin">Join</button>' +
      '<button class="fp-join-close" id="fp-join-close" aria-label="Dismiss">&times;</button>';

    document.body.appendChild(el);
    this._joinBarEl = el;

    var self = this;

    // Join button — Firebase sign-in
    document.getElementById('fp-join-signin').addEventListener('click', function() {
      self._handleJoinClick();
    });

    // Close button — dismiss for this session
    document.getElementById('fp-join-close').addEventListener('click', function() {
      self._hideJoinBar();
      try { sessionStorage.setItem(self.DISMISS_KEY, 'true'); } catch(e) {}
    });
  },

  _showJoinBar: function() {
    if (!this._joinBarEl) return;

    // Only show on home page
    var currentPage = window.location.hash.substring(1) || 'home';
    if (currentPage !== 'home') {
      this._hideJoinBar();
      return;
    }

    // Don't show while waiting for Firebase to resolve auth state — avoids
    // flashing the bar at signed-in users on page load or SPA navigation.
    if (this._authPending) return;

    // Don't show if already signed in
    if (this._firebaseUser) return;

    // Don't show if dismissed this session
    try {
      if (sessionStorage.getItem(this.DISMISS_KEY) === 'true') return;
    } catch(e) {}

    var countEl = document.getElementById('fp-join-count');
    if (countEl) countEl.textContent = this._points;
    this._joinBarEl.classList.add('visible');

    // Shift counter up
    if (this._counterEl) this._counterEl.style.bottom = '60px';
  },

  _hideJoinBar: function() {
    if (!this._joinBarEl) return;
    this._joinBarEl.classList.remove('visible');

    // Restore counter position
    if (this._counterEl) this._counterEl.style.bottom = '';
  },

  // ── Firebase Auth & Firestore ─────────────────────

  // ── Lazy-load Firebase SDK (no CDN on page load) ──────────
  _firebaseLoaded: false,
  _firebaseLoading: false,
  _firebaseCallbacks: [],

  _loadFirebase: function(callback) {
    if (this._firebaseLoaded && typeof firebase !== 'undefined') {
      callback();
      return;
    }
    this._firebaseCallbacks.push(callback);
    if (this._firebaseLoading) return;
    this._firebaseLoading = true;

    var scripts = [
      'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
      'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js'
    ];
    var loaded = 0;
    var self = this;

    function loadNext() {
      if (loaded >= scripts.length) {
        self._firebaseLoaded = true;
        self._firebaseLoading = false;
        var cbs = self._firebaseCallbacks.slice();
        self._firebaseCallbacks = [];
        cbs.forEach(function(cb) { cb(); });
        return;
      }
      var s = document.createElement('script');
      s.src = scripts[loaded];
      s.onload = function() { loaded++; loadNext(); };
      s.onerror = function() {
        console.warn('FanPoints: Failed to load Firebase SDK');
        self._firebaseLoading = false;
      };
      document.head.appendChild(s);
    }
    loadNext();
  },

  _initFirebaseSync: function() {
    // Only load Firebase if user has previously signed in
    var hasAuth = false;
    try { hasAuth = !!localStorage.getItem(this.HAS_AUTH_KEY); } catch(e) {}
    if (!hasAuth) return;

    var self = this;
    this._loadFirebase(function() {
      self._connectFirebase();
    });
  },

  _connectFirebase: function() {
    if (typeof firebase === 'undefined') return;

    try {
      // Initialize Firebase app if not already done
      if (!firebase.apps.length) {
        var config = (typeof window.SITE_CONFIG !== 'undefined') ? window.SITE_CONFIG.firebase : null;
        if (!config) return;
        firebase.initializeApp(config);
      }

      this._db = firebase.firestore();

      // Listen for auth state changes
      var self = this;
      firebase.auth().onAuthStateChanged(function(user) {
        self._firebaseUser = user;
        self._authPending = false; // Auth state resolved — safe to show/hide join bar

        if (user) {
          // Persist that this user has signed in so the join bar stays hidden
          // on future page loads / SPA navigations until auth resolves.
          try { localStorage.setItem(self.HAS_AUTH_KEY, '1'); } catch(e) {}
          self._hideJoinBar();
          self._syncToFirestore();
        } else {
          // Signed out — remove the persistent flag so the join bar can appear again
          try { localStorage.removeItem(self.HAS_AUTH_KEY); } catch(e) {}
        }
      });

      // Handle redirect result (mobile sign-in flow)
      firebase.auth().getRedirectResult()
        .then(function(result) {
          if (result && result.user) {
            console.log('\uD83C\uDF89 Fan signed in via redirect: ' + (result.user.displayName || 'Anonymous'));
          }
        })
        .catch(function(err) {
          if (err.code !== 'auth/popup-closed-by-user') {
            console.warn('FanPoints redirect result error:', err.message);
          }
        });
    } catch(err) {
      console.warn('FanPoints Firebase init skipped:', err.message);
    }
  },

  _syncToFirestore: function() {
    if (!this._firebaseUser || !this._db) return;

    var uid = this._firebaseUser.uid;
    var docRef = this._db.collection('layoung-fans').doc(uid);
    var self = this;

    docRef.get().then(function(doc) {
      var localEarned = self._earned;
      var currentMonthKey = self._getCurrentMonthKey();

      if (doc.exists) {
        var remote = doc.data();
        // Merge earned maps (union)
        var mergedEarned = {};
        var k;
        if (remote.earned) {
          for (k in remote.earned) {
            if (remote.earned.hasOwnProperty(k)) mergedEarned[k] = true;
          }
        }
        for (k in localEarned) {
          if (localEarned.hasOwnProperty(k)) mergedEarned[k] = true;
        }

        // Recalculate total from merged
        var mergedTotal = 0;
        var mergedMonthly = 0;
        for (k in mergedEarned) {
          if (self.POINT_VALUES[k]) {
            mergedTotal += self.POINT_VALUES[k].points;
            // Monthly: only count if same month
            // (can't perfectly distinguish when each was earned, so use total)
          }
        }

        // Handle monthly points: if remote has same month, merge; otherwise reset
        if (remote.monthKey === currentMonthKey) {
          mergedMonthly = Math.max(remote.monthlyPoints || 0, self._monthlyPoints);
        } else {
          mergedMonthly = self._monthlyPoints;
        }

        // Update local state
        self._earned = mergedEarned;
        self._points = mergedTotal;
        self._monthlyPoints = mergedMonthly;
        self._monthKey = currentMonthKey;
        self._save();
        self._updateCounter();

        // Write merged state back
        docRef.update({
          points: mergedTotal,
          earned: mergedEarned,
          monthKey: currentMonthKey,
          monthlyPoints: mergedMonthly,
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
          displayName: self._firebaseUser.displayName || ''
        });
      } else {
        // First sync — create document
        docRef.set({
          displayName: self._firebaseUser.displayName || '',
          photoURL: self._firebaseUser.photoURL || '',
          points: self._points,
          earned: self._earned,
          monthKey: currentMonthKey,
          monthlyPoints: self._monthlyPoints,
          joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }).catch(function(err) {
      console.warn('FanPoints Firestore sync failed:', err.message);
    });
  },

  _handleJoinClick: function() {
    var self = this;
    this._loadFirebase(function() {
      self._doSignIn();
    });
  },

  _doSignIn: function() {
    if (typeof firebase === 'undefined') return;

    try {
      if (!firebase.apps.length) {
        var config = (typeof window.SITE_CONFIG !== 'undefined') ? window.SITE_CONFIG.firebase : null;
        if (!config) return;
        firebase.initializeApp(config);
      }

      // Set up auth listener if not already connected
      if (!this._db) {
        this._connectFirebase();
      }

      var provider = new firebase.auth.GoogleAuthProvider();
      var isMobile = (typeof MobileDetect !== 'undefined' && MobileDetect.isMobile);

      if (isMobile) {
        firebase.auth().signInWithRedirect(provider);
      } else {
        firebase.auth().signInWithPopup(provider)
          .then(function(result) {
            console.log('\uD83C\uDF89 Fan signed in: ' + (result.user.displayName || 'Anonymous'));
          })
          .catch(function(err) {
            if (err.code !== 'auth/popup-closed-by-user') {
              console.error('Fan sign-in error:', err.message);
            }
          });
      }
    } catch(err) {
      console.warn('FanPoints sign-in failed:', err.message);
    }
  },

  // ── Leaderboard (for Fan Wall page) ───────────────

  renderLeaderboard: function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (!this._db) {
      container.innerHTML =
        '<div class="fp-leaderboard">' +
          '<div class="fp-leaderboard-title">\uD83C\uDFC6 Top Fans This Month</div>' +
          '<div class="fp-lb-empty">Sign in to join the leaderboard and compete for Fan of the Month!</div>' +
        '</div>';
      return;
    }

    var currentMonth = this._getCurrentMonthKey();
    var self = this;

    this._db.collection('layoung-fans')
      .orderBy('monthlyPoints', 'desc')
      .limit(20)
      .get()
      .then(function(snapshot) {
        var fans = [];
        snapshot.forEach(function(doc) {
          var data = doc.data();
          // Only include fans from the current month with points
          if (data.monthKey === currentMonth && data.monthlyPoints > 0) {
            fans.push(data);
          }
        });
        // Keep top 10
        fans = fans.slice(0, 10);

        var html = '<div class="fp-leaderboard">' +
          '<div class="fp-leaderboard-title">\uD83C\uDFC6 Top Fans This Month</div>';

        if (fans.length === 0) {
          html += '<div class="fp-lb-empty">No fans on the leaderboard yet this month. Be the first!</div>';
        } else {
          html += '<div class="fp-leaderboard-grid">';
          for (var i = 0; i < fans.length; i++) {
            var fan = fans[i];
            var isFirst = (i === 0);
            var initial = fan.displayName ? fan.displayName.charAt(0).toUpperCase() : '?';
            var crown = isFirst ? '<span class="fp-lb-crown">\uD83D\uDC51</span>' : '';

            html += '<div class="fp-lb-card' + (isFirst ? ' fp-lb-first' : '') + '">' +
              '<div class="fp-lb-rank">#' + (i + 1) + '</div>' +
              '<div class="fp-lb-avatar">' + initial + '</div>' +
              '<div class="fp-lb-info">' +
                '<div class="fp-lb-name">' + self._escapeHtml(fan.displayName || 'Anonymous') + crown + '</div>' +
                '<div class="fp-lb-pts">' + fan.monthlyPoints + ' pts this month</div>' +
              '</div>' +
            '</div>';
          }
          html += '</div>';
        }

        // Show CTA if not signed in
        if (!self._firebaseUser) {
          html += '<div class="fp-lb-join-cta">' +
            '<button class="fp-lb-join-btn" onclick="FanPoints._handleJoinClick()">Sign in to join the leaderboard</button>' +
          '</div>';
        }

        html += '<div style="text-align:center;margin-top:8px;font-size:0.7rem;color:#8b949e">' +
          '\uD83C\uDFC5 Fan of the Month wins free merch!' +
        '</div>';

        html += '</div>';
        container.innerHTML = html;
      })
      .catch(function(err) {
        console.warn('Leaderboard fetch failed:', err.message);
        container.innerHTML =
          '<div class="fp-leaderboard">' +
            '<div class="fp-leaderboard-title">\uD83C\uDFC6 Top Fans This Month</div>' +
            '<div class="fp-lb-empty">Leaderboard loading... Sign in to join!</div>' +
          '</div>';
      });
  },

  // ── Month Tracking ────────────────────────────────

  _getCurrentMonthKey: function() {
    var d = new Date();
    var month = d.getMonth() + 1;
    return d.getFullYear() + '-' + (month < 10 ? '0' : '') + month;
  },

  _checkMonthRollover: function() {
    var currentMonth = this._getCurrentMonthKey();
    if (this._monthKey && this._monthKey !== currentMonth) {
      // New month — reset monthly points
      this._monthlyPoints = 0;
      this._monthKey = currentMonth;
      this._save();
    } else if (!this._monthKey) {
      this._monthKey = currentMonth;
    }
  },

  // ── Game Integration ──────────────────────────────

  _checkGameFlag: function() {
    try {
      if (localStorage.getItem(this.GAME_FLAG) === 'true') {
        var pv = this.POINT_VALUES['activity:play-game'];
        if (pv) this.award('activity:play-game', pv.points, pv.label);
        localStorage.removeItem(this.GAME_FLAG);
      }
    } catch(e) {}
  },

  // ── Persistence ───────────────────────────────────

  _load: function() {
    try {
      var pts = localStorage.getItem(this.STORAGE_KEY);
      this._points = pts ? parseInt(pts, 10) || 0 : 0;

      var earned = localStorage.getItem(this.EARNED_KEY);
      this._earned = earned ? JSON.parse(earned) : {};

      var mk = localStorage.getItem(this.MONTH_KEY);
      this._monthKey = mk || this._getCurrentMonthKey();

      var mp = localStorage.getItem(this.MONTHLY_PTS_KEY);
      this._monthlyPoints = mp ? parseInt(mp, 10) || 0 : 0;
    } catch(e) {
      this._points = 0;
      this._earned = {};
      this._monthKey = this._getCurrentMonthKey();
      this._monthlyPoints = 0;
    }
  },

  _save: function() {
    try {
      localStorage.setItem(this.STORAGE_KEY, String(this._points));
      localStorage.setItem(this.EARNED_KEY, JSON.stringify(this._earned));
      localStorage.setItem(this.MONTH_KEY, this._monthKey);
      localStorage.setItem(this.MONTHLY_PTS_KEY, String(this._monthlyPoints));
    } catch(e) {}
  },

  // ── Public Getters ────────────────────────────────

  getPoints: function() { return this._points; },
  getMonthlyPoints: function() { return this._monthlyPoints; },
  getEarned: function() { return Object.assign({}, this._earned); },

  // ── Utilities ─────────────────────────────────────

  _escapeHtml: function(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // ── Fan Wall Comments ───────────────────────────

  // Content filter patterns (profanity, spam, URL spam)
  _BLOCKED_PATTERNS: [
    /\b(f+u+c+k+|sh+i+t+|a+ss+h+o+l+e+|b+i+t+c+h+|d+a+m+n+|c+u+n+t+|d+i+c+k+|p+u+s+s+y+|n+i+g+g+|f+a+g+)\w*/i,
    /\b(buy now|click here|free money|earn \$|make \$|casino|viagra|crypto pump)\b/i,
    /https?:\/\/\S{30,}/i
  ],

  _isInappropriate: function(text) {
    for (var i = 0; i < this._BLOCKED_PATTERNS.length; i++) {
      if (this._BLOCKED_PATTERNS[i].test(text)) return true;
    }
    if (text.length > 20) {
      var upper = text.replace(/[^A-Z]/g, '').length;
      var alpha = text.replace(/[^A-Za-z]/g, '').length;
      if (alpha > 0 && upper / alpha > 0.8) return true;
    }
    return false;
  },

  /**
   * Save (or replace) the signed-in fan's comment.
   * Auto-screens content: clean comments are visible immediately,
   * flagged comments are saved but hidden (commentVisible = false).
   * Returns a Promise that resolves with { status: 'posted' | 'review' }.
   */
  saveComment: function(commentText) {
    if (!this._firebaseUser || !this._db) {
      return Promise.reject(new Error('Must be signed in to comment'));
    }
    if (!commentText || !commentText.trim()) {
      return Promise.reject(new Error('Comment cannot be empty'));
    }

    var trimmed = commentText.trim().substring(0, 500);
    var flagged = this._isInappropriate(trimmed);
    var uid = this._firebaseUser.uid;
    var docRef = this._db.collection('layoung-fans').doc(uid);
    var self = this;

    return docRef.set({
      comment: trimmed,
      commentedAt: firebase.firestore.FieldValue.serverTimestamp(),
      commentVisible: !flagged,
      displayName: this._firebaseUser.displayName || '',
      photoURL: this._firebaseUser.photoURL || '',
      lastActive: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(function() {
      // Award points for posting (one-time)
      var pv = self.POINT_VALUES['activity:fanwall-post'];
      if (pv) self.award('activity:fanwall-post', pv.points, pv.label);
      return { status: flagged ? 'review' : 'posted' };
    });
  },

  /**
   * Fetch the 100 most recent visible fan comments from Firestore.
   * Only returns comments where commentVisible == true.
   * Returns a Promise resolving to an array of { displayName, photoURL, comment, commentedAt }.
   */
  getRecentComments: function(limit) {
    if (!this._db) return Promise.resolve([]);

    limit = limit || 100;

    return this._db.collection('layoung-fans')
      .where('commentVisible', '==', true)
      .orderBy('commentedAt', 'desc')
      .limit(limit)
      .get()
      .then(function(snapshot) {
        var comments = [];
        snapshot.forEach(function(doc) {
          var data = doc.data();
          if (data.comment && data.commentedAt) {
            comments.push({
              displayName: data.displayName || 'Anonymous',
              photoURL: data.photoURL || '',
              comment: data.comment,
              commentedAt: data.commentedAt.toDate ? data.commentedAt.toDate() : new Date(data.commentedAt),
              points: data.monthlyPoints || 0
            });
          }
        });
        return comments;
      });
  },

  /**
   * Check if the current user is signed in to Firebase.
   */
  isSignedIn: function() {
    return !!this._firebaseUser;
  },

  /**
   * Get the current Firebase user info.
   */
  getCurrentUser: function() {
    if (!this._firebaseUser) return null;
    return {
      displayName: this._firebaseUser.displayName || 'Anonymous',
      photoURL: this._firebaseUser.photoURL || '',
      uid: this._firebaseUser.uid
    };
  },

  // Debug only — reset all points
  reset: function() {
    this._points = 0;
    this._earned = {};
    this._monthlyPoints = 0;
    this._monthKey = this._getCurrentMonthKey();
    this._save();
    if (this._counterValueEl) this._counterValueEl.textContent = '0';
    if (this._counterEl) this._counterEl.classList.remove('visible');
    this._hideJoinBar();
    console.log('FanPoints reset to 0');
  }
};

// Auto-init
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { FanPoints.init(); });
  } else {
    FanPoints.init();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FanPoints;
}
