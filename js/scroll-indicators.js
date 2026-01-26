// js/scroll-indicators.js
/**
 * Mobile Scroll Indicators
 * Shows up/down arrows on mobile to indicate scrollable content
 */

const ScrollIndicators = {
  topIndicator: null,
  bottomIndicator: null,
  scrollThreshold: 100, // Distance from top/bottom to hide indicators
  initialized: false,

  /**
   * Initialize scroll indicators
   */
  init() {
    if (this.initialized) return;

    // Only run on mobile
    if (window.innerWidth > 768) {
      console.log('Desktop detected - scroll indicators disabled');
      return;
    }

    this.createIndicators();
    this.setupEventListeners();
    this.updateIndicators(); // Check initial state

    this.initialized = true;
    console.log('✅ Scroll indicators initialized');
  },

  /**
   * Create indicator HTML elements
   */
  createIndicators() {
    // Top indicator (scroll up)
    this.topIndicator = document.createElement('div');
    this.topIndicator.className = 'scroll-indicator-top';
    this.topIndicator.setAttribute('aria-label', 'Scroll to top');
    this.topIndicator.setAttribute('role', 'button');
    document.body.appendChild(this.topIndicator);

    // Bottom indicator (scroll down)
    this.bottomIndicator = document.createElement('div');
    this.bottomIndicator.className = 'scroll-indicator-bottom';
    this.bottomIndicator.setAttribute('aria-label', 'Scroll down');
    this.bottomIndicator.setAttribute('role', 'button');
    document.body.appendChild(this.bottomIndicator);

    console.log('Scroll indicators created');
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
        this.updateIndicators();
      }, 50); // Throttle updates
    });

    // Click handlers
    this.topIndicator.addEventListener('click', () => {
      this.scrollToTop();
    });

    this.bottomIndicator.addEventListener('click', () => {
      this.scrollToBottom();
    });

    // Touch handlers for mobile
    this.topIndicator.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.scrollToTop();
    });

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
          this.updateIndicators();
        }
      }, 200);
    });
  },

  /**
   * Update indicator visibility based on scroll position
   */
  updateIndicators() {
    if (!this.topIndicator || !this.bottomIndicator) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;

    // Show/hide top indicator
    if (scrollTop > this.scrollThreshold) {
      this.topIndicator.classList.add('visible');
    } else {
      this.topIndicator.classList.remove('visible');
    }

    // Show/hide bottom indicator
    if (scrollBottom > this.scrollThreshold) {
      this.bottomIndicator.classList.add('visible');
    } else {
      this.bottomIndicator.classList.remove('visible');
    }
  },

  /**
   * Scroll to top smoothly
   */
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Track with analytics if available
    if (typeof Analytics !== 'undefined') {
      Analytics.trackEvent('Scroll Indicator', 'Click', 'Scroll to Top');
    }

    console.log('📜 Scrolling to top');
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
   * Scroll up one viewport height
   */
  scrollUpOneScreen() {
    const currentScroll = window.pageYOffset;
    const viewportHeight = window.innerHeight;

    window.scrollTo({
      top: currentScroll - viewportHeight + 100, // Overlap 100px
      behavior: 'smooth',
    });
  },

  /**
   * Destroy indicators (cleanup)
   */
  destroy() {
    if (this.topIndicator) {
      this.topIndicator.remove();
      this.topIndicator = null;
    }
    if (this.bottomIndicator) {
      this.bottomIndicator.remove();
      this.bottomIndicator = null;
    }
    this.initialized = false;
    console.log('Scroll indicators destroyed');
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
