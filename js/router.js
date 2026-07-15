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
    scan: 'pages/scan.html', // door check-in (staff, QR deep-link) — D-52 §iii F6
  },
  currentPage: null,
  defaultPage: 'home',
  playerWindow: null,

  // ── Hash-query support (D-52 §iii F6 / D8 fix) ────────────────────────
  // Hash routes may carry query params — #shows?invite=CODE, #scan?token=T
  // (the QR deep-link + industry-invite links). Before this parser, such a
  // hash fell through route lookup and landed on home. Pages read the params
  // via Router.getRouteQuery() or the `query` field on the
  // `layoung:page-loaded` event detail.
  routeQuery: {},
  routeQueryString: '',
  _pendingQuery: null,

  /** Pure split of a raw location.hash (without '#') into
   *  { route, query, queryString }. Never throws on malformed input. */
  _splitHash(rawHash) {
    const raw = rawHash || '';
    const qIdx = raw.indexOf('?');
    const route = qIdx === -1 ? raw : raw.slice(0, qIdx);
    const queryString = qIdx === -1 ? '' : raw.slice(qIdx + 1);
    const query = {};
    if (queryString) {
      queryString.split('&').forEach((pair) => {
        if (!pair) return;
        const eq = pair.indexOf('=');
        const k = eq === -1 ? pair : pair.slice(0, eq);
        const v = eq === -1 ? '' : pair.slice(eq + 1);
        try {
          query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
        } catch (e) {
          query[k] = v; // malformed escape — keep the raw value
        }
      });
    }
    return { route, query, queryString };
  },

  /** Current route's hash-query params (always an object). */
  getRouteQuery() {
    return this.routeQuery || {};
  },

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
      // Split the hash at '?' BEFORE route lookup (hash-query support)
      const parsed = this._splitHash(href.substring(1));
      // Only intercept if this is a known route — let in-page anchors work normally
      if (!this.routes[parsed.route]) return;
      e.preventDefault();
      this._pendingQuery = { query: parsed.query, queryString: parsed.queryString };
      this.navigateTo(parsed.route);
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

    // Consume the pending hash-query stash (set by the hash parse sites).
    // Direct programmatic navigations (swipe, mini-player, …) carry none —
    // reset so a stale query never leaks into another page.
    if (this._pendingQuery) {
      this.routeQuery = this._pendingQuery.query;
      this.routeQueryString = this._pendingQuery.queryString;
      this._pendingQuery = null;
    } else {
      this.routeQuery = {};
      this.routeQueryString = '';
    }

    await this.loadPage(pageName);
    this.updateURL(pageName);
    this.currentPage = pageName;

    if (typeof Analytics !== 'undefined') {
      Analytics.trackPageView(`/#${pageName}`);
    }

    // Notify Fan Points system of page visit
    document.dispatchEvent(new CustomEvent('layoung:page-loaded', {
      detail: { page: pageName, query: this.routeQuery }
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
    // Split the hash at '?' before route lookup — deep links may carry a
    // query (#shows?invite=CODE, #scan?token=T from a scanned QR).
    const parsed = this._splitHash(window.location.hash.substring(1));
    let hash = parsed.route;
    let pending = { query: parsed.query, queryString: parsed.queryString };

    // Deep link: #gallery-post-N → load gallery page (mobile-gallery.js handles scrolling)
    if (/^gallery-post-\d+$/.test(hash)) {
      hash = 'gallery';
    }

    // Admin redirect return: go back to gallery after sign-in
    try {
      var adminReturn = localStorage.getItem('mg-admin-return');
      if (adminReturn) {
        localStorage.removeItem('mg-admin-return');
        hash = adminReturn;
        pending = { query: {}, queryString: '' }; // the stored return carries no query
      }
    } catch (e) {}

    const initialPage = hash && this.routes[hash] ? hash : this.defaultPage;
    setTimeout(() => {
      this._pendingQuery = pending;
      this.navigateTo(initialPage, true);
    }, 100);
  },

  handleBrowserNavigation() {
    window.addEventListener('popstate', () => {
      const parsed = this._splitHash(window.location.hash.substring(1));
      let hash = parsed.route;
      if (/^gallery-post-\d+$/.test(hash)) hash = 'gallery';
      const pageName = hash || this.defaultPage;

      // If navigating to music player on desktop, open popup window
      if (pageName === 'LAYoungMusicPlayer' && window.innerWidth > 768) {
        this.openPlayerWindow();
        return;
      }

      if (this.routes[pageName]) {
        // This path bypasses navigateTo — stash the query directly so the
        // re-injected page reads the params for THIS navigation.
        this.routeQuery = parsed.query;
        this.routeQueryString = parsed.queryString;
        this.currentPage = pageName;
        this.loadPage(pageName);
      }
    });
  },

  updateURL(pageName) {
    // Preserve the hash query so deep links stay shareable/reload-safe
    const qs = this.routeQueryString ? `?${this.routeQueryString}` : '';
    const url = `#${pageName}${qs}`;
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
