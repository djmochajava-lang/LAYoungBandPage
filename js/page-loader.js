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

      // Stop music player audio if it's playing (SPA navigation away from player)
      if (window.__musicPlayerAudio) {
        window.__musicPlayerAudio.pause();
        window.__musicPlayerAudio.src = '';
        window.__musicPlayerAudio = null;
      }
      window.__musicPlayerInitialized = false;

      // Fade out current content
      await this.fadeOut();

      // Insert new content
      this.container.innerHTML = content;

      // Execute any inline scripts (innerHTML doesn't run them)
      this.executeInlineScripts();

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

    if (pageName === 'gallery') {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        if (typeof Gallery !== 'undefined') Gallery.init();
        if (typeof EventGallery !== 'undefined') EventGallery.init();
        if (typeof GalleryCoordinator !== 'undefined') GalleryCoordinator.init();
      }, 50);
    }

    if (
      typeof MediaPlayer !== 'undefined' &&
      (pageName === 'music' || pageName === 'projects' || pageName === 'videos' || pageName === 'LAYoungMusicPlayer')
    ) {
      MediaPlayer.init();
    }

    // Load external player JS for music player page (no inline script in the HTML)
    // Cache-bust with timestamp so the browser re-executes on every SPA navigation
    if (pageName === 'LAYoungMusicPlayer') {
      const playerScript = document.createElement('script');
      playerScript.src = 'js/music-player-app.js?t=' + Date.now();
      this.container.appendChild(playerScript);
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
   * Execute inline scripts after innerHTML insertion
   * (Browsers don't run <script> tags inserted via innerHTML)
   */
  executeInlineScripts() {
    if (!this.container) return;
    const scripts = this.container.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      // Copy attributes (src, type, etc.)
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      // Copy inline code
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
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
