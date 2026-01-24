// js/main.js

/**
 * L.A. Young Band Page - Main SPA Controller
 * Coordinates all modules with better performance
 */

(function () {
  'use strict';

  const App = {
    version: '2.1.0',
    env: 'production',
    initialized: false,
    modules: {},

    /**
     * Initialize the application
     */
    init() {
      // Prevent double initialization
      if (this.initialized) {
        console.warn('⚠️ App already initialized, skipping');
        return;
      }

      console.log(`🎸 L.A. Young Band Page v${this.version}`);
      console.log('Initializing application...');

      try {
        // Initialize in order with dependency checks
        this.initModules();
        this.setupGlobalListeners();
        this.trackPerformance();

        // Mark as initialized
        this.initialized = true;

        console.log('✅ Application initialized successfully');

        // Preload common pages after 2 seconds
        this.preloadCommonPages();
      } catch (error) {
        console.error('❌ Application initialization failed:', error);
        this.showError(
          'Failed to initialize application. Please refresh the page.',
        );
      }
    },

    /**
     * Initialize all modules (improved with error handling)
     */
    initModules() {
      // Core utilities (no dependencies)
      this.initModule('Utils', Utils, () => {
        if (typeof Utils !== 'undefined' && Utils.lazyLoadImages) {
          Utils.lazyLoadImages();
        }
      });

      // Mobile detection (early initialization)
      this.initModule('MobileDetect', MobileDetect);

      // Page loader (required for SPA)
      this.initModule('PageLoader', PageLoader);

      // Router (handles navigation)
      this.initModule('Router', Router);

      // API configuration
      this.initModule('API', API);

      // Navigation (depends on Router)
      this.initModule('Navigation', Navigation);

      // Analytics (should initialize early)
      this.initModule('Analytics', Analytics);

      // Store remaining modules for on-demand initialization
      this.modules.Forms = Forms;
      this.modules.Gallery = Gallery;
      this.modules.MediaPlayer = MediaPlayer;
      this.modules.MobileMenu = MobileMenu;
      this.modules.ScrollEffects = ScrollEffects;
    },

    /**
     * Initialize a module with error handling
     */
    initModule(name, module, callback) {
      try {
        if (typeof module !== 'undefined') {
          // Check if module has init method
          if (typeof module.init === 'function') {
            module.init();
          }

          // Run callback if provided
          if (typeof callback === 'function') {
            callback();
          }

          this.modules[name] = module;
        } else {
          console.warn(`⚠️ Module ${name} not found`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize ${name}:`, error);
      }
    },

    /**
     * Setup global event listeners
     */
    setupGlobalListeners() {
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Pause media when page hidden
          if (
            this.modules.MediaPlayer &&
            typeof this.modules.MediaPlayer.pauseAll === 'function'
          ) {
            this.modules.MediaPlayer.pauseAll();
          }
        }
      });

      // Handle online/offline status
      window.addEventListener('online', () => {
        console.log('✅ Connection restored');
        this.showNotification('Connection restored', 'success');
      });

      window.addEventListener('offline', () => {
        console.log('⚠️ Connection lost');
        this.showNotification('No internet connection', 'warning');
      });

      // Handle errors globally
      window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        if (
          this.modules.Analytics &&
          typeof this.modules.Analytics.trackError === 'function'
        ) {
          this.modules.Analytics.trackError('JavaScript Error', e.message);
        }
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        if (
          this.modules.Analytics &&
          typeof this.modules.Analytics.trackError === 'function'
        ) {
          this.modules.Analytics.trackError(
            'Promise Rejection',
            String(e.reason),
          );
        }
      });

      // Handle orientation changes (mobile)
      window.addEventListener('orientationchange', () => {
        if (this.modules.MobileDetect && this.modules.MobileDetect.isMobile) {
          this.handleOrientationChange();
        }
      });
    },

    /**
     * Handle orientation changes on mobile
     */
    handleOrientationChange() {
      const orientation = this.modules.MobileDetect.isLandscape()
        ? 'landscape'
        : 'portrait';
      console.log('Orientation changed:', orientation);

      // Track orientation change
      if (
        this.modules.Analytics &&
        typeof this.modules.Analytics.trackEvent === 'function'
      ) {
        this.modules.Analytics.trackEvent(
          'Mobile',
          'Orientation Change',
          orientation,
        );
      }
    },

    /**
     * Track performance metrics
     */
    trackPerformance() {
      if (!window.performance || !this.modules.Analytics) return;

      window.addEventListener('load', () => {
        // Wait for all resources to load
        setTimeout(() => {
          try {
            const perfData = performance.timing;
            const pageLoadTime =
              perfData.loadEventEnd - perfData.navigationStart;
            const domReadyTime =
              perfData.domContentLoadedEventEnd - perfData.navigationStart;

            if (typeof this.modules.Analytics.trackTiming === 'function') {
              this.modules.Analytics.trackTiming(
                'Performance',
                'Page Load',
                pageLoadTime,
              );
              this.modules.Analytics.trackTiming(
                'Performance',
                'DOM Ready',
                domReadyTime,
              );
            }

            if (this.env === 'development') {
              console.log('📊 Performance metrics:', {
                pageLoadTime: `${pageLoadTime}ms`,
                domReadyTime: `${domReadyTime}ms`,
              });
            }
          } catch (error) {
            console.error('Performance tracking error:', error);
          }
        }, 0);
      });
    },

    /**
     * Preload commonly visited pages
     */
    preloadCommonPages() {
      setTimeout(() => {
        if (
          this.modules.Router &&
          typeof this.modules.Router.preloadPage === 'function'
        ) {
          console.log('🔄 Preloading common pages...');
          this.modules.Router.preloadPage('bio');
          this.modules.Router.preloadPage('tour');
          this.modules.Router.preloadPage('music');
        }
      }, 2000);
    },

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
      // Remove existing notifications
      const existing = document.querySelector('.app-notification');
      if (existing) existing.remove();

      const notification = document.createElement('div');
      notification.className = `app-notification app-notification-${type}`;
      notification.textContent = message;
      notification.setAttribute('role', 'alert');
      notification.setAttribute('aria-live', 'polite');

      notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${
          type === 'success'
            ? 'rgba(76, 175, 80, 0.9)'
            : type === 'warning'
              ? 'rgba(255, 152, 0, 0.9)'
              : 'rgba(33, 150, 243, 0.9)'
        };
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;

      document.body.appendChild(notification);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },

    /**
     * Show error message
     */
    showError(message) {
      console.error('Error:', message);
      this.showNotification(message, 'error');
    },

    /**
     * Get application state (for debugging)
     */
    getState() {
      return {
        version: this.version,
        env: this.env,
        initialized: this.initialized,
        currentPage: this.modules.Router
          ? this.modules.Router.getCurrentPage()
          : null,
        deviceInfo: this.modules.MobileDetect
          ? this.modules.MobileDetect.getDeviceInfo()
          : null,
        modules: Object.keys(this.modules).reduce((acc, key) => {
          acc[key] = typeof this.modules[key] !== 'undefined';
          return acc;
        }, {}),
      };
    },
  };

  /**
   * Initialize when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  /**
   * Expose App to window for debugging
   */
  if (App.env === 'development') {
    window.App = App;
    console.log('💡 App object available in console for debugging');
  }

  // Also expose in production but read-only
  Object.defineProperty(window, 'LAYoungApp', {
    value: App,
    writable: false,
    configurable: false,
  });
})();
