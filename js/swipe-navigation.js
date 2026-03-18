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
    'shows',
    'music',
    'projects',
    'LAYoungMusicPlayer',
    'gallery',
    'fanwall',
    'support',
    'merch',
    'contact',
    'performances',
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

    // Check if touch started inside a horizontally-scrollable zone
    this.inScrollZone = false;
    var el = e.target;
    while (el && el !== document.body) {
      var style = window.getComputedStyle(el);
      var overflowX = style.getPropertyValue('overflow-x');
      if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth) {
        this.inScrollZone = true;
        break;
      }
      el = el.parentElement;
    }
  },

  handleTouchEnd(e) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.touchEndY = e.changedTouches[0].screenY;
    this.handleSwipe();
  },

  handleSwipe() {
    // Prevent multiple swipes during animation
    if (this.isAnimating) return;

    // Skip page navigation if swipe started inside a horizontal scroll zone
    if (this.inScrollZone) return;

    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;

    // Swipe down on home page opens mobile menu
    if (Math.abs(diffY) > Math.abs(diffX) && diffY > this.minSwipeDistance) {
      const currentPage = window.location.hash.substring(1) || 'home';
      if (currentPage === 'home' && typeof MobileMenu !== 'undefined' && !MobileMenu.isOpen()) {
        MobileMenu.open();
        return;
      }
    }

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
    const container = document.getElementById('app-container');

    if (!container) {
      // Fallback: use Router directly
      if (typeof Router !== 'undefined') {
        Router.navigateTo(targetPage);
      } else {
        window.location.hash = `#${targetPage}`;
      }
      this.isAnimating = false;
      return;
    }

    // Add turning class to block interactions
    document.body.classList.add('page-turning');

    // Play sound effect
    if (typeof SoundEffects !== 'undefined') {
      SoundEffects.play('whoosh');
    }

    // Prevent horizontal scrollbar during slide
    document.body.style.overflowX = 'hidden';

    // Slide out current content (override the base.css transition on #app-container)
    container.style.transition = 'transform 0.35s ease-in, opacity 0.35s ease-in';
    container.style.opacity = '0';
    container.style.transform = direction === 'next'
      ? 'translateX(-30%)'
      : 'translateX(30%)';

    // After slide-out, load new page then slide in
    setTimeout(async () => {
      // Load the new page content via Router (skip its fade, we handle it)
      if (typeof Router !== 'undefined' && typeof PageLoader !== 'undefined') {
        // Temporarily override PageLoader's fade so it doesn't double-animate
        const origFadeOut = PageLoader.fadeOut;
        const origFadeIn = PageLoader.fadeIn;
        PageLoader.fadeOut = () => Promise.resolve();
        PageLoader.fadeIn = () => Promise.resolve();

        await Router.navigateTo(targetPage);

        // Restore original fade methods
        PageLoader.fadeOut = origFadeOut;
        PageLoader.fadeIn = origFadeIn;
      } else {
        window.location.hash = `#${targetPage}`;
      }

      // Set starting position for slide-in
      container.style.transition = 'none';
      container.style.transform = direction === 'next'
        ? 'translateX(30%)'
        : 'translateX(-30%)';
      container.style.opacity = '0';

      // Force reflow so the position takes effect before animating
      container.offsetHeight;

      // Slide in the new content
      container.style.transition = 'transform 0.35s ease-out, opacity 0.35s ease-out';
      container.style.opacity = '1';
      container.style.transform = 'translateX(0)';

      // Clean up after slide-in
      setTimeout(() => {
        container.style.transition = '';
        container.style.transform = '';
        container.style.opacity = '';
        document.body.style.overflowX = '';
        document.body.classList.remove('page-turning');
        this.isAnimating = false;
      }, 400);
    }, 350);

    console.log(
      `${direction === 'next' ? '👉' : '👈'} Swiping to ${targetPage}`,
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
