// js/swipe-navigation.js

/**
 * Mobile Swipe Navigation with Page Turning Effect
 *
 * Home page  : swipe right               → open mobile menu
 *              swipe left                → go to next page
 * Vertical swipes are never captured — they always scroll the page
 * Other pages: swipe right              → go to the last page visited on
 *                                         this site (SPA history stack), or
 *                                         history.back() if this was the
 *                                         first page the user landed on
 * Any page   : swipe left               → navigate to next page in sequence
 */

const SwipeNavigation = {
  touchStartX: 0,
  touchEndX: 0,
  touchStartY: 0,
  touchEndY: 0,
  minSwipeDistance: 50,
  isAnimating: false,

  // Internal SPA navigation history stack
  _spaHistory: [],
  // Set true while executing a back-navigation so the page-loaded listener
  // doesn't push the destination back onto the stack
  _navigatingBack: false,

  // Swipe sequence matches the mobile menu layout
  menuItems: [
    'home',
    'bio',
    'music',
    'projects',
    'shows',
    'LAYoungMusicPlayer',
    'merch',
    'support',
    'gallery',
    'fanwall',
    'contact',
  ],

  init() {
    if (window.innerWidth <= 1024) {
      this.setupSwipeListeners();
      this.addPageTurnStyles();
      console.log('📱 Swipe navigation with page turn enabled');
    }

    // Start tracking SPA history so swipe-right can navigate back
    this._trackNavigation();

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
   * Track every SPA page navigation so we can go back through them.
   * Records pages into _spaHistory; skips pushes during back-navigation.
   */
  _trackNavigation() {
    var self = this;

    // Seed history with the landing page
    var landing = window.location.hash.substring(1) || 'home';
    self._spaHistory.push(landing);

    document.addEventListener('layoung:page-loaded', function (e) {
      if (self._navigatingBack) {
        // This event was triggered by our own back-navigation; don't push
        self._navigatingBack = false;
        return;
      }
      var page = (e.detail && e.detail.page) || (window.location.hash.substring(1) || 'home');
      // Avoid duplicate consecutive entries
      if (self._spaHistory[self._spaHistory.length - 1] !== page) {
        self._spaHistory.push(page);
      }
    });
  },

  /**
   * Navigate back through the SPA history stack (swipe-right on non-home pages).
   * Falls back to history.back() if no SPA history exists (user arrived
   * directly from an external site).
   */
  _navigateBack() {
    var stack = this._spaHistory;
    var currentPage = window.location.hash.substring(1) || 'home';

    // Pop the current page off the top of the stack
    while (stack.length > 0 && stack[stack.length - 1] === currentPage) {
      stack.pop();
    }

    if (stack.length > 0) {
      var prevPage = stack[stack.length - 1];
      // Pop it too — it will be re-pushed if the user navigates forward again
      stack.pop();
      this._navigatingBack = true;
      this.animatePageTurn('prev', prevPage);
    } else {
      // No SPA history — user came from another site; let the browser go back
      history.back();
    }
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
    // Store bound references so we can remove them later
    this._boundTouchStart = this.handleTouchStart.bind(this);
    this._boundTouchEnd = this.handleTouchEnd.bind(this);
    document.addEventListener('touchstart', this._boundTouchStart, { passive: true });
    document.addEventListener('touchend', this._boundTouchEnd, { passive: true });
    this.listenersActive = true;
  },

  removeSwipeListeners() {
    document.removeEventListener('touchstart', this._boundTouchStart);
    document.removeEventListener('touchend', this._boundTouchEnd);
    this.listenersActive = false;
  },

  handleTouchStart(e) {
    this.touchStartX = e.changedTouches[0].screenX;
    this.touchStartY = e.changedTouches[0].screenY;

    // Check if touch started inside a horizontally-scrollable zone
    this.inScrollZone = false;
    var el = e.target;
    while (el && el !== document.body) {
      if (el.tagName === 'VIDEO') break;
      // Explicit opt-out for mobile gallery scroll/overlay zones
      if (el.classList && (el.classList.contains('mg-stories-row') || el.classList.contains('mg-story-viewer'))) {
        this.inScrollZone = true;
        break;
      }
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
    if (this.isAnimating) return;
    if (this.inScrollZone) return;

    var diffX = this.touchEndX - this.touchStartX;
    var diffY = this.touchEndY - this.touchStartY;
    var currentPage = window.location.hash.substring(1) || 'home';

    var absDiffX = Math.abs(diffX);
    var absDiffY = Math.abs(diffY);
    var isHorizontal = absDiffX > absDiffY;

    // Only act on horizontal swipes — never interfere with vertical scrolling
    if (!isHorizontal || absDiffX < this.minSwipeDistance) return;

    // ── HOME PAGE ─────────────────────────────────────────────────────────
    // Swipe left  → go to next page
    // Swipe right → open mobile menu
    if (currentPage === 'home') {
      if (diffX < 0) {
        this.navigateNext();
      } else {
        if (typeof MobileMenu !== 'undefined' && !MobileMenu.isOpen()) {
          MobileMenu.open();
        }
      }
      return;
    }

    // ── ALL OTHER PAGES ───────────────────────────────────────────────────
    if (diffX > 0) {
      // Swipe right → go back through SPA history (or browser back)
      this._navigateBack();
    } else {
      // Swipe left → navigate to next page in sequence
      this.navigateNext();
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
    // If current page isn't in menuItems, start from the beginning
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + 1) % this.menuItems.length;
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

      // Scroll section to top so the new page starts at the top
      var section = document.getElementById(targetPage) ||
                    container.querySelector('.section, .hero');
      if (section) section.scrollTop = 0;
      window.scrollTo(0, 0);

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
