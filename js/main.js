// js/main.js

/**
 * L.A. Young Band Page - Main SPA Controller
 * Coordinates all modules for the Single Page Application
 */

(function () {
  'use strict';

  const App = {
    version: '2.0.0',
    env: 'production',

    /**
     * Initialize the application
     */
    init() {
      console.log(`🎸 L.A. Young Band Page v${this.version} (SPA)`);
      console.log('Initializing application...');

      // Initialize in order
      this.initModules();
      this.setupGlobalListeners();
      this.trackPerformance();

      console.log('✅ Application initialized successfully');
    },

    /**
     * Initialize all modules
     */
    initModules() {
      // Core utilities (no dependencies)
      if (typeof Utils !== 'undefined') {
        Utils.lazyLoadImages();
      }

      // Mobile detection (early initialization)
      if (typeof MobileDetect !== 'undefined') {
        MobileDetect.init();
      }

      // Page loader (required for SPA)
      if (typeof PageLoader !== 'undefined') {
        PageLoader.init();
      }

      // Router (handles navigation)
      if (typeof Router !== 'undefined') {
        Router.init();
      }

      // API configuration
      if (typeof API !== 'undefined') {
        API.init();
      }

      // Navigation
      if (typeof Navigation !== 'undefined') {
        Navigation.init();
      }

      // Analytics (should initialize early)
      if (typeof Analytics !== 'undefined') {
        Analytics.init();
      }

      // Note: Forms, Gallery, MediaPlayer will be initialized
      // on-demand when their respective pages load
    },

    /**
     * Setup global event listeners
     */
    setupGlobalListeners() {
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (typeof MediaPlayer !== 'undefined') {
            MediaPlayer.pauseAll();
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
        if (typeof Analytics !== 'undefined') {
          Analytics.trackError('JavaScript Error', e.message);
        }
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        if (typeof Analytics !== 'undefined') {
          Analytics.trackError('Promise Rejection', e.reason);
        }
      });

      // Handle orientation changes (mobile)
      window.addEventListener('orientationchange', () => {
        if (typeof MobileDetect !== 'undefined' && MobileDetect.isMobile) {
          this.handleOrientationChange();
        }
      });
    },

    /**
     * Handle orientation changes on mobile
     */
    handleOrientationChange() {
      // Optional: Show message or adjust layout
      console.log(
        'Orientation changed:',
        MobileDetect.isLandscape() ? 'landscape' : 'portrait',
      );
    },

    /**
     * Track performance metrics
     */
    trackPerformance() {
      if (!window.performance || typeof Analytics === 'undefined') return;

      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const domReadyTime =
            perfData.domContentLoadedEventEnd - perfData.navigationStart;

          Analytics.trackTiming('Performance', 'Page Load', pageLoadTime);
          Analytics.trackTiming('Performance', 'DOM Ready', domReadyTime);

          if (this.env === 'development') {
            console.log('Performance metrics:', {
              pageLoadTime: `${pageLoadTime}ms`,
              domReadyTime: `${domReadyTime}ms`,
            });
          }
        }, 0);
      });
    },

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
      const existing = document.querySelector('.app-notification');
      if (existing) existing.remove();

      const notification = document.createElement('div');
      notification.className = `app-notification app-notification-${type}`;
      notification.textContent = message;
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
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },

    /**
     * Get application state
     */
    getState() {
      return {
        version: this.version,
        env: this.env,
        currentPage:
          typeof Router !== 'undefined' ? Router.getCurrentPage() : null,
        deviceInfo:
          typeof MobileDetect !== 'undefined'
            ? MobileDetect.getDeviceInfo()
            : null,
        modules: {
          utils: typeof Utils !== 'undefined',
          mobileDetect: typeof MobileDetect !== 'undefined',
          pageLoader: typeof PageLoader !== 'undefined',
          router: typeof Router !== 'undefined',
          navigation: typeof Navigation !== 'undefined',
          forms: typeof Forms !== 'undefined',
          gallery: typeof Gallery !== 'undefined',
          mediaPlayer: typeof MediaPlayer !== 'undefined',
          api: typeof API !== 'undefined',
          analytics: typeof Analytics !== 'undefined',
        },
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
   * Expose App to window for debugging (development only)
   */
  if (App.env === 'development') {
    window.App = App;
    console.log('💡 App object available in console for debugging');
  }
})();
