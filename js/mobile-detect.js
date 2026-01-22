// js/mobile-detect.js

/**
 * Mobile Detection & Optimization Module
 * Detects device type and applies mobile-specific optimizations
 */

const MobileDetect = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isTouchDevice: false,
  deviceType: 'desktop',

  /**
   * Initialize mobile detection
   */
  init() {
    this.detectDevice();
    this.applyDeviceClasses();
    this.setupMobileOptimizations();
    this.setupTouchEvents();
    console.log(`✅ Mobile detect initialized - Device: ${this.deviceType}`);
  },

  /**
   * Detect device type
   */
  detectDevice() {
    const ua = navigator.userAgent;

    // Check if touch device
    this.isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Detect mobile
    this.isMobile =
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    // Detect tablet
    this.isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua);

    // Determine device type
    if (this.isTablet) {
      this.deviceType = 'tablet';
      this.isDesktop = false;
    } else if (this.isMobile) {
      this.deviceType = 'mobile';
      this.isDesktop = false;
    } else {
      this.deviceType = 'desktop';
      this.isDesktop = true;
    }
  },

  /**
   * Apply device-specific CSS classes
   */
  applyDeviceClasses() {
    const body = document.body;

    body.classList.add(`device-${this.deviceType}`);

    if (this.isTouchDevice) {
      body.classList.add('touch-device');
    } else {
      body.classList.add('no-touch');
    }

    if (this.isMobile || this.isTablet) {
      body.classList.add('mobile-device');
    }
  },

  /**
   * Setup mobile-specific optimizations
   */
  setupMobileOptimizations() {
    if (this.isMobile) {
      // Disable hover effects on mobile
      this.disableHoverOnMobile();

      // Optimize animations for mobile
      this.optimizeAnimations();

      // Add mobile-specific viewport handling
      this.setupMobileViewport();

      // Prevent zoom on input focus
      this.preventZoomOnFocus();
    }
  },

  /**
   * Disable hover effects on mobile
   */
  disableHoverOnMobile() {
    const style = document.createElement('style');
    style.textContent = `
      @media (hover: none) {
        .hover-lift:hover,
        .hover-glow:hover,
        .hover-scale:hover {
          transform: none;
          box-shadow: none;
        }
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * Optimize animations for mobile
   */
  optimizeAnimations() {
    // Reduce motion if user prefers
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduce-motion');
    }
  },

  /**
   * Setup mobile viewport handling
   */
  setupMobileViewport() {
    // Handle viewport height changes (keyboard opening/closing)
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    window.addEventListener('resize', () => {
      vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
  },

  /**
   * Prevent zoom on input focus (iOS)
   */
  preventZoomOnFocus() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      if (!input.style.fontSize || parseFloat(input.style.fontSize) < 16) {
        input.style.fontSize = '16px';
      }
    });
  },

  /**
   * Setup touch-specific event handlers
   */
  setupTouchEvents() {
    if (this.isTouchDevice) {
      // Add touch-friendly tap events
      this.setupTapEvents();

      // Prevent 300ms click delay
      this.preventClickDelay();
    }
  },

  /**
   * Setup tap events for better touch responsiveness
   */
  setupTapEvents() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true },
    );

    document.addEventListener(
      'touchend',
      (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = Math.abs(touchEndX - touchStartX);
        const deltaY = Math.abs(touchEndY - touchStartY);

        // If movement is minimal, treat as tap
        if (deltaX < 10 && deltaY < 10) {
          const target = e.target;
          target.classList.add('tap-highlight');
          setTimeout(() => target.classList.remove('tap-highlight'), 300);
        }
      },
      { passive: true },
    );
  },

  /**
   * Prevent 300ms click delay on mobile
   */
  preventClickDelay() {
    // Modern browsers handle this automatically with viewport meta tag
    // This is a fallback for older devices
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      const newMeta = document.createElement('meta');
      newMeta.name = 'viewport';
      newMeta.content = 'width=device-width, initial-scale=1, user-scalable=no';
      document.head.appendChild(newMeta);
    }
  },

  /**
   * Check if device is in landscape mode
   */
  isLandscape() {
    return window.innerWidth > window.innerHeight;
  },

  /**
   * Check if device is in portrait mode
   */
  isPortrait() {
    return window.innerHeight > window.innerWidth;
  },

  /**
   * Get device info
   */
  getDeviceInfo() {
    return {
      type: this.deviceType,
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isDesktop: this.isDesktop,
      isTouchDevice: this.isTouchDevice,
      orientation: this.isLandscape() ? 'landscape' : 'portrait',
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    };
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileDetect.init());
  } else {
    MobileDetect.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileDetect;
}
