// js/analytics.js

/**
 * Analytics Module
 * Handles event tracking, page views, and user behavior analytics
 */

const Analytics = {
  // Configuration
  config: {
    enabled: true,
    provider: 'google', // 'google', 'custom', or 'none'
    debug: false,
  },

  /**
   * Initialize analytics
   */
  init() {
    if (!this.config.enabled) {
      console.log('⚠️ Analytics disabled');
      return;
    }

    this.initPageTracking();
    this.initOutboundLinkTracking();
    this.initScrollTracking();
    this.initClickTracking();

    console.log('✅ Analytics initialized');
  },

  /**
   * Track page view
   */
  trackPageView(path = window.location.pathname) {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log('📊 Page view:', path);
    }

    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: path,
      });
    }

    // Custom analytics
    this.sendToCustomAnalytics('pageview', { path });
  },

  /**
   * Track custom event
   */
  trackEvent(category, action, label = '', value = null) {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log('📊 Event:', { category, action, label, value });
    }

    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }

    // Custom analytics
    this.sendToCustomAnalytics('event', {
      category,
      action,
      label,
      value,
    });
  },

  /**
   * Initialize page tracking
   */
  initPageTracking() {
    // Track initial page load
    this.trackPageView();

    // Track hash changes (for single-page apps)
    window.addEventListener('hashchange', () => {
      this.trackPageView(window.location.pathname + window.location.hash);
    });
  },

  /**
   * Track outbound links
   */
  initOutboundLinkTracking() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="http"]');
      if (!link) return;

      const url = link.href;
      const hostname = new URL(url).hostname;

      // Check if it's an external link
      if (hostname !== window.location.hostname) {
        this.trackEvent('Outbound Link', 'Click', url);
      }
    });
  },

  /**
   * Track scroll depth
   */
  initScrollTracking() {
    let scrollMarks = { 25: false, 50: false, 75: false, 100: false };
    let ticking = false;

    const checkScrollDepth = () => {
      const scrollPercentage = this.getScrollPercentage();

      Object.keys(scrollMarks).forEach((mark) => {
        if (!scrollMarks[mark] && scrollPercentage >= parseInt(mark)) {
          scrollMarks[mark] = true;
          this.trackEvent('Scroll Depth', `${mark}%`, window.location.pathname);
        }
      });

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(checkScrollDepth);
        ticking = true;
      }
    });
  },

  /**
   * Track button/CTA clicks
   */
  initClickTracking() {
    // Track all buttons with data-track attribute
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-track]');
      if (!el) return;

      const trackData = el.dataset.track;
      const category = el.dataset.trackCategory || 'Button';
      const label = el.dataset.trackLabel || el.textContent.trim();

      this.trackEvent(category, 'Click', label);
    });
  },

  /**
   * Track video engagement
   */
  trackVideo(action, videoTitle) {
    this.trackEvent('Video', action, videoTitle);
  },

  /**
   * Track audio engagement
   */
  trackAudio(action, trackTitle) {
    this.trackEvent('Audio', action, trackTitle);
  },

  /**
   * Track form submissions
   */
  trackFormSubmit(formName, success = true) {
    this.trackEvent(
      'Form',
      success ? 'Submit Success' : 'Submit Error',
      formName,
    );
  },

  /**
   * Track file downloads
   */
  trackDownload(fileName) {
    this.trackEvent('Download', 'Click', fileName);
  },

  /**
   * Track social shares
   */
  trackSocialShare(platform, url) {
    this.trackEvent('Social Share', platform, url);
  },

  /**
   * Track errors
   */
  trackError(errorType, errorMessage) {
    this.trackEvent('Error', errorType, errorMessage);
  },

  /**
   * Track timing (performance metrics)
   */
  trackTiming(category, variable, time, label = '') {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log('⏱️ Timing:', { category, variable, time, label });
    }

    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'timing_complete', {
        name: variable,
        value: time,
        event_category: category,
        event_label: label,
      });
    }
  },

  /**
   * Get scroll percentage
   */
  getScrollPercentage() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    return Math.round((scrollTop / scrollHeight) * 100);
  },

  /**
   * Send to custom analytics backend
   */
  async sendToCustomAnalytics(type, data) {
    if (this.config.provider !== 'custom') return;

    try {
      // TODO: Replace with your actual analytics endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  },

  /**
   * Track user session
   */
  trackSession() {
    const sessionStart = Date.now();

    // Track session duration on page unload
    window.addEventListener('beforeunload', () => {
      const duration = Date.now() - sessionStart;
      this.trackTiming('Session', 'Duration', duration);
    });
  },

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    console.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
  } else {
    Analytics.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Analytics;
}
