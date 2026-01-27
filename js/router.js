// js/router.js - UPDATED: Tour → Performances
const Router = {
  routes: {
    home: 'pages/home.html',
    bio: 'pages/bio.html',
    music: 'pages/music.html',
    videos: 'pages/videos.html',
    gallery: 'pages/gallery.html',
    performances: 'pages/performances.html', // CHANGED: tour → performances
    merch: 'pages/merch.html',
    contact: 'pages/contact.html',
  },
  currentPage: null,
  defaultPage: 'home',

  init() {
    this.setupNavigation();
    this.handleInitialRoute();
    this.handleBrowserNavigation();
    this.updateMenuVisibility();
    console.log('✅ Router initialized');
  },

  updateMenuVisibility() {
    if (typeof window.SITE_CONFIG === 'undefined') {
      console.warn('SITE_CONFIG not found – assuming all menu items visible');
      return;
    }

    // CHANGED: Now targeting "performances" links instead of "tour"
    const performancesLinks = document.querySelectorAll(
      'a[href="#performances"], .mobile-menu-link[href="#performances"]',
    );

    performancesLinks.forEach((link) => {
      if (window.SITE_CONFIG.showPerformancesMenu) {
        link.style.display = '';
        link.removeAttribute('aria-hidden');
      } else {
        link.style.display = 'none';
        link.setAttribute('aria-hidden', 'true');
      }
    });

    console.log(
      `Performances menu visibility: ${window.SITE_CONFIG.showPerformancesMenu ? 'VISIBLE' : 'HIDDEN'}`,
    );
  },

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

  async loadPage(pageName) {
    const pageUrl = this.routes[pageName];
    if (typeof PageLoader !== 'undefined') {
      await PageLoader.loadPage(pageName, pageUrl);
    } else {
      console.error('PageLoader module not found');
    }
  },

  handleInitialRoute() {
    const hash = window.location.hash.substring(1);
    const initialPage = hash && this.routes[hash] ? hash : this.defaultPage;
    setTimeout(() => {
      this.navigateTo(initialPage, true);
    }, 100);
  },

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

  updateURL(pageName) {
    const url = `#${pageName}`;
    if (window.location.hash !== url) {
      window.history.pushState({ page: pageName }, '', url);
    }
  },

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

  getCurrentPage() {
    return this.currentPage;
  },

  async preloadPage(pageName) {
    if (!this.routes[pageName]) return;
    if (typeof PageLoader !== 'undefined') {
      await PageLoader.preloadPage(pageName, this.routes[pageName]);
    }
  },
};

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
