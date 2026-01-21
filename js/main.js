// js/main.js

/**
 * L.A. Young Artist Page - Main Coordinator
 * Initializes all modules and coordinates application startup
 */

(function () {
  'use strict';

  /**
   * Main Application Object
   */
  const App = {
    version: '1.0.0',
    env: 'production', // 'development' or 'production'

    /**
     * Initialize the application
     */
    init() {
      console.log(`🎸 L.A. Young Artist Page v${this.version}`);
      console.log('Initializing application...');

      // Initialize modules in order
      this.initModules();

      // Setup global event listeners
      this.setupGlobalListeners();

      // Performance tracking
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

      // Navigation (depends on Utils)
      if (typeof Navigation !== 'undefined') {
        Navigation.init();
      }

      // Scroll effects (depends on Utils)
      if (typeof ScrollEffects !== 'undefined') {
        ScrollEffects.init();
      }

      // API configuration (no dependencies)
      if (typeof API !== 'undefined') {
        API.init();
      }

      // Forms (depends on API)
      if (typeof Forms !== 'undefined') {
        Forms.init();
      }

      // Gallery (depends on Analytics)
      if (typeof Gallery !== 'undefined') {
        Gallery.init();
      }

      // Media players (depends on Analytics)
      if (typeof MediaPlayer !== 'undefined') {
        MediaPlayer.init();
      }

      // Analytics (should initialize early)
      if (typeof Analytics !== 'undefined') {
        Analytics.init();
      }
    },

    /**
     * Setup global event listeners
     */
    setupGlobalListeners() {
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Pause media when tab is hidden
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
      // Remove existing notification
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
        modules: {
          utils: typeof Utils !== 'undefined',
          navigation: typeof Navigation !== 'undefined',
          scrollEffects: typeof ScrollEffects !== 'undefined',
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
