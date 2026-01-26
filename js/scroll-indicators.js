// js/scroll-indicators.js
/**
 * Mobile Scroll Indicator
 * Shows down arrow on mobile to indicate scrollable content
 */

const ScrollIndicators = {
  bottomIndicator: null,
  scrollThreshold: 100, // Distance from bottom to hide indicator
  initialized: false,

  /**
   * Initialize scroll indicator
   */
  init() {
    if (this.initialized) return;

    // Only run on mobile
    if (window.innerWidth > 768) {
      console.log('Desktop detected - scroll indicator disabled');
      return;
    }

    this.createIndicator();
    this.setupEventListeners();
    this.updateIndicator(); // Check initial state

    this.initialized = true;
    console.log('✅ Scroll indicator initialized (down arrow only)');
  },

  /**
   * Create indicator HTML element
   */
  createIndicator() {
    // Bottom indicator (scroll down)
    this.bottomIndicator = document.createElement('div');
    this.bottomIndicator.className = 'scroll-indicator-bottom';
    this.bottomIndicator.setAttribute('aria-label', 'Scroll down');
    this.bottomIndicator.setAttribute('role', 'button');
    document.body.appendChild(this.bottomIndicator);

    console.log('Scroll indicator created');
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Update on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateIndicator();
      }, 50); // Throttle updates
    });

    // Click handler
    this.bottomIndicator.addEventListener('click', () => {
      this.scrollToBottom();
    });

    // Touch handler for mobile
    this.bottomIndicator.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.scrollToBottom();
    });

    // Reinitialize on window resize (orientation change)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 768 && this.initialized) {
          this.destroy();
        } else if (window.innerWidth <= 768 && !this.initialized) {
          this.init();
        } else {
          this.updateIndicator();
        }
      }, 200);
    });
  },

  /**
   * Update indicator visibility based on scroll position
   */
  updateIndicator() {
    if (!this.bottomIndicator) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;

    // Show/hide bottom indicator
    if (scrollBottom > this.scrollThreshold) {
      this.bottomIndicator.classList.add('visible');
    } else {
      this.bottomIndicator.classList.remove('visible');
    }
  },

  /**
   * Scroll to bottom smoothly
   */
  scrollToBottom() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });

    // Track with analytics if available
    if (typeof Analytics !== 'undefined') {
      Analytics.trackEvent('Scroll Indicator', 'Click', 'Scroll to Bottom');
    }

    console.log('📜 Scrolling to bottom');
  },

  /**
   * Scroll down one viewport height
   */
  scrollDownOneScreen() {
    const currentScroll = window.pageYOffset;
    const viewportHeight = window.innerHeight;

    window.scrollTo({
      top: currentScroll + viewportHeight - 100, // Overlap 100px
      behavior: 'smooth',
    });
  },

  /**
   * Destroy indicator (cleanup)
   */
  destroy() {
    if (this.bottomIndicator) {
      this.bottomIndicator.remove();
      this.bottomIndicator = null;
    }
    this.initialized = false;
    console.log('Scroll indicator destroyed');
  },
};

// Auto-initialize on mobile
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait a bit for page to settle
      setTimeout(() => {
        ScrollIndicators.init();
      }, 500);
    });
  } else {
    setTimeout(() => {
      ScrollIndicators.init();
    }, 500);
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollIndicators;
}
