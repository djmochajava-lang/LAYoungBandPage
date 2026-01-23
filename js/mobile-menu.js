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

    console.log('✅ Mobile menu initialized successfully');
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

    // Close menu when a link is clicked
    if (this.menuLinks) {
      this.menuLinks.forEach((link) => {
        link.addEventListener('click', () => {
          console.log('🔗 Menu link clicked - Closing menu');
          this.close();
        });
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
