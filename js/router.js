// js/router.js

/**
 * Router Module
 * Handles SPA navigation and page routing
 */

const Router = {
  routes: {
    home: 'pages/home.html',
    bio: 'pages/bio.html',
    music: 'pages/music.html',
    videos: 'pages/videos.html',
    gallery: 'pages/gallery.html',
    tour: 'pages/tour.html',
    merch: 'pages/merch.html',
    contact: 'pages/contact.html',
  },

  currentPage: 'home',
  defaultPage: 'home',

  /**
   * Initialize router
   */
  init() {
    this.setupNavigation();
    this.handleInitialRoute();
    this.handleBrowserNavigation();

    console.log('✅ Router initialized');
  },

  /**
   * Setup navigation click handlers
   */
  setupNavigation() {
    // Handle all nav links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');

      if (!link) return;

      const href = link.getAttribute('href');

      // Skip if href is just "#"
      if (href === '#') return;

      e.preventDefault();

      // Get page name from href (remove #)
      const pageName = href.substring(1);

      // Navigate to page
      this.navigateTo(pageName);
    });
  },

  /**
   * Navigate to a page
   */
  async navigateTo(pageName) {
    // Validate page exists
    if (!this.routes[pageName]) {
      console.warn(`Page "${pageName}" not found, loading default`);
      pageName = this.defaultPage;
    }

    // Don't reload if already on this page
    if (pageName === this.currentPage) {
      return;
    }

    // Load the page
    await this.loadPage(pageName);

    // Update URL
    this.updateURL(pageName);

    // Update current page
    this.currentPage = pageName;

    // Track page view
    if (typeof Analytics !== 'undefined') {
      Analytics.trackPageView(`/#${pageName}`);
    }

    // Close mobile menu if open
    this.closeMobileMenu();
  },

  /**
   * Load page content
   */
  async loadPage(pageName) {
    const pageUrl = this.routes[pageName];

    if (typeof PageLoader !== 'undefined') {
      await PageLoader.loadPage(pageName, pageUrl);
    } else {
      console.error('PageLoader module not found');
    }
  },

  /**
   * Handle initial route (on page load)
   */
  handleInitialRoute() {
    // Check URL hash
    const hash = window.location.hash.substring(1);
    const initialPage = hash && this.routes[hash] ? hash : this.defaultPage;

    // Load initial page
    this.navigateTo(initialPage);
  },

  /**
   * Handle browser back/forward buttons
   */
  handleBrowserNavigation() {
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.substring(1);
      const pageName = hash || this.defaultPage;

      // Update current page without pushing to history
      if (this.routes[pageName]) {
        this.currentPage = pageName;
        this.loadPage(pageName);
      }
    });
  },

  /**
   * Update URL without page reload
   */
  updateURL(pageName) {
    const url = `#${pageName}`;

    // Update browser history
    if (window.location.hash !== url) {
      window.history.pushState({ page: pageName }, '', url);
    }
  },

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const body = document.body;

    if (menuToggle && mainNav) {
      menuToggle.classList.remove('active');
      mainNav.classList.remove('active');
      body.classList.remove('menu-open');
    }
  },

  /**
   * Get current page
   */
  getCurrentPage() {
    return this.currentPage;
  },

  /**
   * Preload a page
   */
  async preloadPage(pageName) {
    if (!this.routes[pageName]) return;

    if (typeof PageLoader !== 'undefined') {
      await PageLoader.preloadPage(pageName, this.routes[pageName]);
    }
  },

  /**
   * Preload all pages
   */
  async preloadAllPages() {
    const pages = Object.keys(this.routes);

    for (const page of pages) {
      if (page !== this.currentPage) {
        await this.preloadPage(page);
      }
    }

    console.log('✅ All pages preloaded');
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Router.init());
  } else {
    Router.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
}
