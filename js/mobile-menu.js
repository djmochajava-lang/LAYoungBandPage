// js/mobile-menu.js

/**
 * Simple Mobile Menu Controller
 * Handles opening/closing the mobile menu overlay
 */

const MobileMenu = {
  menu: null,
  hamburger: null,
  closeBtn: null,
  menuLinks: null,

  /** localStorage key for cached fan profile */
  FAN_PROFILE_KEY: 'layoung_fan_profile',
  /** Cookie name for fan profile (survives iOS Safari ITP localStorage clears) */
  FAN_COOKIE_KEY: 'layoung_fan',

  /** Save profile to cookie — 30-day expiry, same-site */
  _saveCookie: function(profile) {
    try {
      var val = encodeURIComponent(JSON.stringify(profile));
      var maxAge = 30 * 24 * 60 * 60;
      document.cookie = this.FAN_COOKIE_KEY + '=' + val +
        '; max-age=' + maxAge + '; path=/; SameSite=Lax';
    } catch(e) {}
  },

  /** Read profile from cookie, returns object or null */
  _readCookie: function() {
    try {
      var match = document.cookie.match(
        new RegExp('(^| )' + this.FAN_COOKIE_KEY + '=([^;]+)')
      );
      return match ? JSON.parse(decodeURIComponent(match[2])) : null;
    } catch(e) { return null; }
  },

  /** Clear fan cookie on sign-out */
  _clearCookie: function() {
    document.cookie = this.FAN_COOKIE_KEY + '=; max-age=0; path=/';
  },

  /**
   * Initialize mobile menu
   */
  init() {
    console.log('🍔 Initializing Mobile Menu...');

    // Get elements
    this.menu = document.getElementById('mobile-menu-overlay');
    this.hamburger = document.querySelector('.menu-toggle');
    this.closeBtn = document.querySelector('.mobile-menu-close');
    this.menuLinks = document.querySelectorAll('.mobile-menu-link');

    // Check if elements exist
    if (!this.menu) {
      console.error('❌ Mobile menu overlay not found!');
      return;
    }

    if (!this.hamburger) {
      console.error('❌ Hamburger button not found!');
      return;
    }

    console.log('✅ Mobile menu elements found');

    // Setup event listeners
    this.setupEventListeners();

    // Fan profile card — restore from cache, then live-update when auth resolves
    this.initFanProfile();

    // Hide subscribe CTA immediately if fan profile is cached (localStorage or cookie)
    try {
      var hasCached = !!localStorage.getItem(this.FAN_PROFILE_KEY) || !!this._readCookie();
      if (hasCached) {
        var cta = document.getElementById('mm-subscribe-cta');
        if (cta) cta.style.display = 'none';
      }
    } catch (e) { /* ignore */ }

    // Arriving from GBE Band Portal (?from=portal)
    // Band members aren't fans — hide the subscribe CTA entirely
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get('from') === 'portal' || params.get('menu') === 'open') {
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.hash);
        }
        var cta = document.getElementById('mm-subscribe-cta');
        if (cta) cta.style.display = 'none';
      }
    } catch (e) { /* ignore */ }

    console.log('✅ Mobile menu initialized successfully');
  },

  /**
   * Fan profile card
   * - Loads cached profile from localStorage immediately (no Firebase wait)
   * - Updates and re-saves cache whenever layoung:fan-signed-in fires
   */
  initFanProfile() {
    var self = this;

    /** Populate the card DOM from a plain profile object */
    function renderProfile(profile) {
      if (!profile) return;

      var card = document.getElementById('mm-fan-profile');

      var name = profile.displayName || profile.email || 'Fan';
      var pts  = typeof profile.points === 'number' ? profile.points : 0;

      // First name only keeps it tidy
      var firstName = name.split(' ')[0];
      var nameEl = document.getElementById('mm-fan-name');
      if (nameEl) nameEl.textContent = firstName;

      var ptsEl = document.getElementById('mm-fan-pts');
      if (ptsEl) ptsEl.textContent = pts;

      // Avatar: prefer Google photo, fall back to initials
      var photoEl    = document.getElementById('mm-fan-photo');
      var initialsEl = document.getElementById('mm-fan-initials');

      if (profile.photoURL && photoEl) {
        photoEl.src           = profile.photoURL;
        photoEl.style.display = 'block';
        if (initialsEl) initialsEl.style.display = 'none';
      } else if (initialsEl) {
        var parts    = name.trim().split(' ');
        var initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : (parts[0][0] || '★').toUpperCase();
        initialsEl.textContent   = initials;
        initialsEl.style.display = 'flex';
        if (photoEl) photoEl.style.display = 'none';
      }

      // Reveal the card if it exists
      if (card) {
        card.style.display = 'flex';
        card.setAttribute('aria-hidden', 'false');
      }
      // Hide subscribe CTA once signed in
      var subscribeCta = document.getElementById('mm-subscribe-cta');
      if (subscribeCta) subscribeCta.style.display = 'none';
      console.log('👤 Fan profile shown:', firstName, pts + ' pts');
    }

    // ── Step 1: Always attach the event listener first (no guard that can exit early) ──
    window.addEventListener('layoung:fan-signed-in', function (e) {
      var d = e.detail || {};
      var profile = {
        displayName: d.displayName || '',
        photoURL:    d.photoURL    || '',
        email:       d.email       || '',
        uid:         d.uid         || '',
        points:      typeof d.points === 'number' ? d.points : 0
      };

      // Check if returning (had cached profile) before we overwrite
      var isReturning = false;
      try { isReturning = !!localStorage.getItem(self.FAN_PROFILE_KEY) || !!self._readCookie(); } catch(e) {}

      // Persist to localStorage AND cookie (cookie survives iOS Safari ITP clears)
      try {
        localStorage.setItem(self.FAN_PROFILE_KEY, JSON.stringify(profile));
        console.log('👤 Fan profile saved to localStorage');
      } catch (err) { /* storage full — ignore */ }
      self._saveCookie(profile);

      renderProfile(profile);

      // Check Firestore role — show Band Portal button for band members
      self._checkBandRole(profile.uid);

      // Welcome notification
      var firstName = (profile.displayName || '').split(' ')[0] || 'Friend';
      var msg = isReturning
        ? 'Welcome Back, ' + firstName + '! \u2605'
        : 'Welcome, ' + firstName + '! \u2605';
      if (typeof App !== 'undefined' && App.showNotification) {
        App.showNotification(msg, 'success');
      }
    });

    // ── Step 2: Restore cached profile instantly (localStorage → cookie fallback) ──
    try {
      var cached = localStorage.getItem(self.FAN_PROFILE_KEY);
      if (cached) {
        var profile = JSON.parse(cached);
        console.log('👤 Restoring fan profile from localStorage');
        renderProfile(profile);
      } else {
        // localStorage cleared (iOS ITP) — try cookie fallback
        var cookieProfile = self._readCookie();
        if (cookieProfile) {
          console.log('👤 Restoring fan profile from cookie');
          renderProfile(cookieProfile);
        }
      }
    } catch (e) { /* ignore parse errors */ }

    // Also check band role from cached uid
    try {
      var c2 = localStorage.getItem(self.FAN_PROFILE_KEY);
      if (c2) {
        var p2 = JSON.parse(c2);
        if (p2.uid) self._checkBandRole(p2.uid);
      }
    } catch (e) { /* ignore */ }
  },

  /**
   * Check Firestore user doc for band_member/artist role → show Band Portal button
   */
  _checkBandRole(uid) {
    if (!uid) return;
    // Need Firestore — it's lazy-loaded by FanPoints, so wait for it
    var check = function() {
      if (typeof firebase === 'undefined' || !firebase.firestore) return;
      try {
        firebase.firestore().collection('users').doc(uid).get().then(function(doc) {
          if (!doc.exists) return;
          var role = doc.data().role || '';
          var btn = document.getElementById('mm-band-portal-btn');
          if (btn && (role === 'band_member' || role === 'artist' || role === 'band_manager' || role === 'admin')) {
            btn.style.display = 'block';
            console.log('🎸 Band Portal button shown for role:', role);
          }
        }).catch(function() { /* silent — not critical */ });
      } catch (e) { /* Firestore not ready */ }
    };
    // Try now, retry after a short delay (Firestore may still be loading)
    check();
    setTimeout(check, 2000);
  },

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Toggle menu when hamburger is clicked
    if (this.hamburger) {
      this.hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🍔 Hamburger clicked - Toggling menu');
        this.toggle(); // Toggle instead of always opening
      });
    }

    // Close menu when close button is clicked
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('✖️ Close button clicked');
        this.close();
      });
    }

    // Close menu when a link is clicked (but not dropdown triggers)
    if (this.menuLinks) {
      this.menuLinks.forEach((link) => {
        link.addEventListener('click', () => {
          if (link.classList.contains('mobile-menu-dropdown-trigger')) return;
          console.log('🔗 Menu link clicked - Closing menu');
          this.close();
        });
      });
    }

    // Close menu when Player button is clicked
    var playerBtn = document.querySelector('.mobile-menu-game');
    if (playerBtn) {
      playerBtn.addEventListener('click', () => {
        console.log('🎵 Player button clicked - Closing menu');
        this.close();
      });
    }

    // Close menu when clicking backdrop
    if (this.menu) {
      this.menu.addEventListener('click', (e) => {
        // Only close if clicking the overlay itself, not the menu container
        if (e.target === this.menu) {
          console.log('🎭 Backdrop clicked - Closing menu');
          this.close();
        }
      });
    }

    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        console.log('⌨️ ESC pressed - Closing menu');
        this.close();
      }
    });

    // Mobile dropdown toggle (Gallery → Photos / Videos)
    const dropdownTriggers = document.querySelectorAll('.mobile-menu-dropdown-trigger');
    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = trigger.closest('.mobile-menu-dropdown');
        if (dropdown) {
          dropdown.classList.toggle('open');
        }
      });
    });

    // Sub-links inside dropdown should close the menu after navigating
    const subLinks = document.querySelectorAll('.mobile-menu-sub-link');
    subLinks.forEach((link) => {
      link.addEventListener('click', () => {
        this.close();
      });
    });
  },

  /**
   * Open the mobile menu
   */
  open() {
    console.log('📱 Opening mobile menu...');
    if (this.menu) {
      this.menu.classList.add('active');
      document.body.classList.add('mobile-menu-open');

      // Animate hamburger to X
      if (this.hamburger) {
        this.hamburger.classList.add('active');
      }

      // Preload Firebase now so Subscribers View tap fires signInWithPopup
      // synchronously (within the gesture context) — prevents iOS Safari popup block
      if (typeof FanPoints !== 'undefined' && FanPoints._loadFirebase) {
        FanPoints._loadFirebase(function() {});
      }

      console.log('✅ Mobile menu opened');
    }
  },

  /**
   * Close the mobile menu
   */
  close() {
    console.log('📴 Closing mobile menu...');
    if (this.menu) {
      this.menu.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');

      // Animate X back to hamburger
      if (this.hamburger) {
        this.hamburger.classList.remove('active');
      }

      // Collapse all open dropdowns so menu resets on next open
      const openDropdowns = this.menu.querySelectorAll('.mobile-menu-dropdown.open');
      openDropdowns.forEach((dd) => dd.classList.remove('open'));

      console.log('✅ Mobile menu closed');
    }
  },

  /**
   * Toggle menu open/closed
   */
  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  },

  /**
   * Check if menu is open
   */
  isOpen() {
    return this.menu && this.menu.classList.contains('active');
  },
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    MobileMenu.init();
  });
} else {
  MobileMenu.init();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileMenu;
}
