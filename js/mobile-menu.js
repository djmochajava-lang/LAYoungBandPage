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

      // Always persist to localStorage — this is the source of truth for next visit
      try {
        localStorage.setItem(self.FAN_PROFILE_KEY, JSON.stringify(profile));
        console.log('👤 Fan profile saved to localStorage');
      } catch (err) { /* storage full — ignore */ }

      renderProfile(profile);
    });

    // ── Step 2: Restore cached profile instantly (no Firebase needed) ──
    try {
      var cached = localStorage.getItem(self.FAN_PROFILE_KEY);
      if (cached) {
        var profile = JSON.parse(cached);
        console.log('👤 Restoring fan profile from localStorage cache');
        renderProfile(profile);
      }
    } catch (e) { /* ignore parse errors */ }
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
