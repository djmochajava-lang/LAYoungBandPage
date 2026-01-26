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
  currentPage: null,
  defaultPage: 'home',

  /**
   * Initialize router
   */
  init() {
    this.setupNavigation();
    this.handleInitialRoute();
    this.handleBrowserNavigation();
    this.updateMenuVisibility(); // Controls visibility of Tour menu item
    console.log('✅ Router initialized');
  },

  /**
   * Hide/show menu items based on SITE_CONFIG
   */
  updateMenuVisibility() {
    // Safety check in case config.js didn't load
    if (typeof window.SITE_CONFIG === 'undefined') {
      console.warn('SITE_CONFIG not found – assuming all menu items visible');
      return;
    }

    // Find Tour links in both desktop nav and mobile menu
    const tourLinks = document.querySelectorAll(
      'a[href="#tour"], .mobile-menu-link[href="#tour"]',
    );

    tourLinks.forEach((link) => {
      if (window.SITE_CONFIG.showTourMenu) {
        link.style.display = ''; // show (default CSS)
        link.removeAttribute('aria-hidden');
      } else {
        link.style.display = 'none';
        link.setAttribute('aria-hidden', 'true');
      }
    });

    console.log(
      `Tour menu item visibility: ${window.SITE_CONFIG.showTourMenu ? 'VISIBLE' : 'HIDDEN'}`,
    );
  },

  /**
   * Setup navigation click handlers
   */
  setupNavigation() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const pageName = href.substring(1);
      this.navigateTo(pageName);
    });
  },

  /**
   * Navigate to a page
   */
  async navigateTo(pageName, forceLoad = false) {
    if (!this.routes[pageName]) {
      console.warn(`Page "${pageName}" not found, loading default`);
      pageName = this.defaultPage;
    }

    if (pageName === this.currentPage && !forceLoad) {
      return;
    }

    await this.loadPage(pageName);
    this.updateURL(pageName);
    this.currentPage = pageName;

    if (typeof Analytics !== 'undefined') {
      Analytics.trackPageView(`/#${pageName}`);
    }

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
    const hash = window.location.hash.substring(1);
    const initialPage = hash && this.routes[hash] ? hash : this.defaultPage;
    setTimeout(() => {
      this.navigateTo(initialPage, true); // force load on initial
    }, 100);
  },

  /**
   * Handle browser back/forward buttons
   */
  handleBrowserNavigation() {
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.substring(1);
      const pageName = hash || this.defaultPage;
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
    if (window.location.hash !== url) {
      window.history.pushState({ page: pageName }, '', url);
    }
  },

  /**
   * Close mobile menu if open
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
};

// Auto-initialize
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Router.init());
  } else {
    Router.init();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
}
