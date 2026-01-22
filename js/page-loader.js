// js/page-loader.js

/**
 * Page Loader Module
 * Handles dynamic loading of page content into the main container
 */

const PageLoader = {
  container: null,
  cache: {},
  loadingClass: 'page-loading',
  transitionDuration: 300,

  /**
   * Initialize page loader
   */
  init() {
    this.container = document.getElementById('app-container');

    if (!this.container) {
      console.error('App container not found');
      return;
    }

    console.log('✅ Page loader initialized');
  },

  /**
   * Load a page
   */
  async loadPage(pageName, pageUrl) {
    if (!this.container) {
      console.error('Container not initialized');
      return;
    }

    try {
      // Show loading state
      this.showLoading();

      // Get page content (from cache or fetch)
      const content = await this.getPageContent(pageName, pageUrl);

      // Fade out current content
      await this.fadeOut();

      // Insert new content
      this.container.innerHTML = content;

      // Fade in new content
      await this.fadeIn();

      // Initialize page-specific features
      this.initializePageFeatures(pageName);

      // Hide loading state
      this.hideLoading();
    } catch (error) {
      console.error('Error loading page:', error);
      this.showError('Failed to load page. Please try again.');
    }
  },

  /**
   * Get page content (with caching)
   */
  async getPageContent(pageName, pageUrl) {
    // Check cache first
    if (this.cache[pageName]) {
      return this.cache[pageName];
    }

    // Fetch from server
    const response = await fetch(pageUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();

    // Cache the content
    this.cache[pageName] = content;

    return content;
  },

  /**
   * Show loading indicator
   */
  showLoading() {
    document.body.classList.add(this.loadingClass);
  },

  /**
   * Hide loading indicator
   */
  hideLoading() {
    document.body.classList.remove(this.loadingClass);
  },

  /**
   * Fade out animation
   */
  fadeOut() {
    return new Promise((resolve) => {
      this.container.style.opacity = '0';
      setTimeout(resolve, this.transitionDuration);
    });
  },

  /**
   * Fade in animation
   */
  fadeIn() {
    return new Promise((resolve) => {
      // Force reflow
      this.container.offsetHeight;

      this.container.style.opacity = '1';
      setTimeout(resolve, this.transitionDuration);
    });
  },

  /**
   * Initialize page-specific features
   */
  initializePageFeatures(pageName) {
    // Reinitialize modules for the new page content

    if (typeof Forms !== 'undefined' && pageName === 'contact') {
      Forms.init();
    }

    if (typeof Gallery !== 'undefined' && pageName === 'gallery') {
      Gallery.init();
    }

    if (
      typeof MediaPlayer !== 'undefined' &&
      (pageName === 'music' || pageName === 'videos')
    ) {
      MediaPlayer.init();
    }

    if (typeof ScrollEffects !== 'undefined') {
      ScrollEffects.init();
    }

    // Lazy load images
    if (typeof Utils !== 'undefined') {
      Utils.lazyLoadImages();
    }
  },

  /**
   * Show error message
   */
  showError(message) {
    this.container.innerHTML = `
      <div class="error-message">
        <h2>Oops!</h2>
        <p>${message}</p>
        <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
      </div>
    `;
    this.hideLoading();
  },

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {};
    console.log('Page cache cleared');
  },

  /**
   * Preload page
   */
  async preloadPage(pageName, pageUrl) {
    if (!this.cache[pageName]) {
      try {
        await this.getPageContent(pageName, pageUrl);
        console.log(`Preloaded: ${pageName}`);
      } catch (error) {
        console.error(`Failed to preload ${pageName}:`, error);
      }
    }
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PageLoader.init());
  } else {
    PageLoader.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PageLoader;
}
