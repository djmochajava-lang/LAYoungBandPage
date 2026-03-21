// js/router.js
const Router = {
  routes: {
    home: 'pages/home.html',
    bio: 'pages/bio.html',
    music: 'pages/music.html',
    projects: 'pages/projects.html',
    videos: 'pages/videos.html',
    gallery: window.matchMedia('(max-width: 768px)').matches
      ? 'pages/gallery-mobile.html'
      : 'pages/gallery.html',
    shows: 'pages/shows.html',
    performances: 'pages/performances.html',
    LAYoungMusicPlayer: 'pages/LAYoungMusicPlayer.tpl',
    merch: 'pages/merch.html',
    support: 'pages/support.html',
    contact: 'pages/contact.html',
    fanwall: 'pages/fanwall.html',
  },
  currentPage: null,
  defaultPage: 'home',
  playerWindow: null,

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
      const pageName = href.substring(1);
      // Only intercept if this is a known route — let in-page anchors work normally
      if (!this.routes[pageName]) return;
      e.preventDefault();
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

    // Desktop: open music player in its own browser window
    if (pageName === 'LAYoungMusicPlayer' && window.innerWidth > 768) {
      this.openPlayerWindow();
      this.closeMobileMenu();
      return;
    }

    await this.loadPage(pageName);
    this.updateURL(pageName);
    this.currentPage = pageName;

    if (typeof Analytics !== 'undefined') {
      Analytics.trackPageView(`/#${pageName}`);
    }

    // Notify Fan Points system of page visit
    document.dispatchEvent(new CustomEvent('layoung:page-loaded', {
      detail: { page: pageName }
    }));

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
    let hash = window.location.hash.substring(1);

    // Deep link: #gallery-post-N → load gallery page (mobile-gallery.js handles scrolling)
    if (/^gallery-post-\d+$/.test(hash)) {
      hash = 'gallery';
    }

    const initialPage = hash && this.routes[hash] ? hash : this.defaultPage;
    setTimeout(() => {
      this.navigateTo(initialPage, true);
    }, 100);
  },

  handleBrowserNavigation() {
    window.addEventListener('popstate', () => {
      let hash = window.location.hash.substring(1);
      if (/^gallery-post-\d+$/.test(hash)) hash = 'gallery';
      const pageName = hash || this.defaultPage;

      // If navigating to music player on desktop, open popup window
      if (pageName === 'LAYoungMusicPlayer' && window.innerWidth > 768) {
        this.openPlayerWindow();
        return;
      }

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

  // === Music Player — Standalone Browser Window (Desktop) ===
  openPlayerWindow() {
    // If window is already open and not closed, just focus it
    if (this.playerWindow && !this.playerWindow.closed) {
      this.playerWindow.focus();
      console.log('📱 Player window focused');
      return;
    }

    // Phone-sized window dimensions (extra width for bezel sides)
    const width = 480;
    const height = 780;

    // Position in bottom-right of screen
    const left = window.screen.availWidth - width - 30;
    const top = window.screen.availHeight - height - 60;

    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'popup=yes',
      'resizable=no',
      'scrollbars=no',
      'status=no',
      'menubar=no',
      'toolbar=no',
      'location=no',
    ].join(',');

    this.playerWindow = window.open('player.html', 'LAYoungPlayer', features);

    // Stop background music on main site
    if (typeof BackgroundMusic !== 'undefined') {
      BackgroundMusic.stop();
    }

    console.log('📱 Player window opened');
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
