// js/swipe-navigation.js

/**
 * Mobile Swipe Navigation
 * Swipe left = next page, Swipe right = previous page
 */

const SwipeNavigation = {
  touchStartX: 0,
  touchEndX: 0,
  touchStartY: 0,
  touchEndY: 0,
  minSwipeDistance: 50, // Minimum distance for a swipe (pixels)

  // Menu order
  menuItems: [
    'home',
    'bio',
    'music',
    'videos',
    'gallery',
    'tour',
    'merch',
    'contact',
  ],

  /**
   * Initialize swipe navigation
   */
  init() {
    // Only enable on mobile/tablet
    if (window.innerWidth <= 1024) {
      this.setupSwipeListeners();
      console.log('📱 Swipe navigation enabled');
    }

    // Re-check on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 1024 && !this.listenersActive) {
        this.setupSwipeListeners();
      } else if (window.innerWidth > 1024 && this.listenersActive) {
        this.removeSwipeListeners();
      }
    });
  },

  /**
   * Setup touch event listeners
   */
  setupSwipeListeners() {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: true,
    });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: true,
    });
    this.listenersActive = true;
  },

  /**
   * Remove touch event listeners
   */
  removeSwipeListeners() {
    document.removeEventListener(
      'touchstart',
      this.handleTouchStart.bind(this),
    );
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.listenersActive = false;
  },

  /**
   * Handle touch start
   */
  handleTouchStart(e) {
    this.touchStartX = e.changedTouches[0].screenX;
    this.touchStartY = e.changedTouches[0].screenY;
  },

  /**
   * Handle touch end and detect swipe
   */
  handleTouchEnd(e) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.touchEndY = e.changedTouches[0].screenY;
    this.handleSwipe();
  },

  /**
   * Determine swipe direction and navigate
   */
  handleSwipe() {
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;

    // Check if horizontal swipe is stronger than vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Only trigger if swipe distance is long enough
      if (Math.abs(diffX) > this.minSwipeDistance) {
        if (diffX > 0) {
          // Swipe RIGHT = Previous page (move UP menu)
          this.navigatePrevious();
        } else {
          // Swipe LEFT = Next page (move DOWN menu)
          this.navigateNext();
        }
      }
    }
  },

  /**
   * Get current page index
   */
  getCurrentPageIndex() {
    const hash = window.location.hash.substring(1) || 'home';
    return this.menuItems.indexOf(hash);
  },

  /**
   * Navigate to next page (swipe left)
   */
  navigateNext() {
    const currentIndex = this.getCurrentPageIndex();
    const nextIndex = (currentIndex + 1) % this.menuItems.length;
    const nextPage = this.menuItems[nextIndex];

    console.log(`👉 Swipe LEFT: Navigate to ${nextPage}`);
    window.location.hash = `#${nextPage}`;

    // Play sound effect
    if (typeof SoundEffects !== 'undefined') {
      SoundEffects.play('whoosh');
    }
  },

  /**
   * Navigate to previous page (swipe right)
   */
  navigatePrevious() {
    const currentIndex = this.getCurrentPageIndex();
    const prevIndex =
      (currentIndex - 1 + this.menuItems.length) % this.menuItems.length;
    const prevPage = this.menuItems[prevIndex];

    console.log(`👈 Swipe RIGHT: Navigate to ${prevPage}`);
    window.location.hash = `#${prevPage}`;

    // Play sound effect
    if (typeof SoundEffects !== 'undefined') {
      SoundEffects.play('whoosh');
    }
  },
};

// Auto-initialize
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SwipeNavigation.init());
  } else {
    SwipeNavigation.init();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SwipeNavigation;
}
