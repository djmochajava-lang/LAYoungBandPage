// js/swipe-navigation.js

/**
 * Mobile Swipe Navigation with Page Turning Effect
 * Swipe left = next page, Swipe right = previous page
 */

const SwipeNavigation = {
  touchStartX: 0,
  touchEndX: 0,
  touchStartY: 0,
  touchEndY: 0,
  minSwipeDistance: 50,
  isAnimating: false,

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

  init() {
    if (window.innerWidth <= 1024) {
      this.setupSwipeListeners();
      this.addPageTurnStyles();
      console.log('📱 Swipe navigation with page turn enabled');
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth <= 1024 && !this.listenersActive) {
        this.setupSwipeListeners();
        this.addPageTurnStyles();
      } else if (window.innerWidth > 1024 && this.listenersActive) {
        this.removeSwipeListeners();
      }
    });
  },

  /**
   * Add CSS for page turning animation
   */
  addPageTurnStyles() {
    if (document.getElementById('swipe-styles')) return;

    const style = document.createElement('style');
    style.id = 'swipe-styles';
    style.textContent = `
      /* Page Turn Animation Styles */
      .page-turn-container {
        position: relative;
        overflow: hidden;
      }

      .page-turning {
        pointer-events: none;
      }

      /* Slide from right (next page) */
      @keyframes slideInFromRight {
        0% {
          transform: translateX(100%);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }

      /* Slide to left (current page) */
      @keyframes slideOutToLeft {
        0% {
          transform: translateX(0);
          opacity: 1;
        }
        100% {
          transform: translateX(-100%);
          opacity: 0;
        }
      }

      /* Slide from left (previous page) */
      @keyframes slideInFromLeft {
        0% {
          transform: translateX(-100%);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }

      /* Slide to right (current page) */
      @keyframes slideOutToRight {
        0% {
          transform: translateX(0);
          opacity: 1;
        }
        100% {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      /* 3D Page Flip Effect */
      @keyframes pageFlipNext {
        0% {
          transform: perspective(1200px) rotateY(0deg);
          transform-origin: left center;
        }
        100% {
          transform: perspective(1200px) rotateY(-180deg);
          transform-origin: left center;
        }
      }

      @keyframes pageFlipPrev {
        0% {
          transform: perspective(1200px) rotateY(0deg);
          transform-origin: right center;
        }
        100% {
          transform: perspective(1200px) rotateY(180deg);
          transform-origin: right center;
        }
      }

      /* Apply animations */
      .slide-in-right {
        animation: slideInFromRight 0.5s ease-out forwards;
      }

      .slide-out-left {
        animation: slideOutToLeft 0.5s ease-out forwards;
      }

      .slide-in-left {
        animation: slideInFromLeft 0.5s ease-out forwards;
      }

      .slide-out-right {
        animation: slideOutToRight 0.5s ease-out forwards;
      }

      .page-flip-next {
        animation: pageFlipNext 0.6s ease-in-out forwards;
      }

      .page-flip-prev {
        animation: pageFlipPrev 0.6s ease-in-out forwards;
      }
    `;
    document.head.appendChild(style);
  },

  setupSwipeListeners() {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: true,
    });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: true,
    });
    this.listenersActive = true;
  },

  removeSwipeListeners() {
    document.removeEventListener(
      'touchstart',
      this.handleTouchStart.bind(this),
    );
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.listenersActive = false;
  },

  handleTouchStart(e) {
    this.touchStartX = e.changedTouches[0].screenX;
    this.touchStartY = e.changedTouches[0].screenY;
  },

  handleTouchEnd(e) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.touchEndY = e.changedTouches[0].screenY;
    this.handleSwipe();
  },

  handleSwipe() {
    // Prevent multiple swipes during animation
    if (this.isAnimating) return;

    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > this.minSwipeDistance) {
        if (diffX > 0) {
          this.navigatePrevious();
        } else {
          this.navigateNext();
        }
      }
    }
  },

  getCurrentPageIndex() {
    const hash = window.location.hash.substring(1) || 'home';
    return this.menuItems.indexOf(hash);
  },

  /**
   * Navigate with page turn animation
   */
  navigateNext() {
    const currentIndex = this.getCurrentPageIndex();
    const nextIndex = (currentIndex + 1) % this.menuItems.length;
    const nextPage = this.menuItems[nextIndex];

    this.animatePageTurn('next', nextPage);
  },

  navigatePrevious() {
    const currentIndex = this.getCurrentPageIndex();
    const prevIndex =
      (currentIndex - 1 + this.menuItems.length) % this.menuItems.length;
    const prevPage = this.menuItems[prevIndex];

    this.animatePageTurn('prev', prevPage);
  },

  /**
   * Animate page turn effect
   */
  animatePageTurn(direction, targetPage) {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const mainContent =
      document.querySelector('main') || document.querySelector('.page-content');

    if (!mainContent) {
      // Fallback: just navigate
      window.location.hash = `#${targetPage}`;
      this.isAnimating = false;
      return;
    }

    // Add turning class
    document.body.classList.add('page-turning');

    // Apply animation based on direction
    if (direction === 'next') {
      // Swipe left = slide out to left
      mainContent.classList.add('slide-out-left');
    } else {
      // Swipe right = slide out to right
      mainContent.classList.add('slide-out-right');
    }

    // Play sound effect
    if (typeof SoundEffects !== 'undefined') {
      SoundEffects.play('whoosh');
    }

    // After animation, navigate
    setTimeout(() => {
      // Remove animation classes
      mainContent.classList.remove('slide-out-left', 'slide-out-right');

      // Navigate to new page
      window.location.hash = `#${targetPage}`;

      // Add slide-in animation
      if (direction === 'next') {
        mainContent.classList.add('slide-in-right');
      } else {
        mainContent.classList.add('slide-in-left');
      }

      // Clean up after animation
      setTimeout(() => {
        mainContent.classList.remove('slide-in-right', 'slide-in-left');
        document.body.classList.remove('page-turning');
        this.isAnimating = false;
      }, 500);
    }, 500);

    console.log(
      `${direction === 'next' ? '👉' : '👈'} Navigate to ${targetPage}`,
    );
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SwipeNavigation;
}
