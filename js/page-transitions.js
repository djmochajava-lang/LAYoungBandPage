// js/page-transitions.js

/**
 * Page Transitions Module
 * Shows one section at a time like separate pages
 */

const PageTransitions = {
  currentSection: 'home',
  sections: [],

  /**
   * Initialize page transitions
   */
  init() {
    this.sections = document.querySelectorAll('.section, .hero');

    if (this.sections.length === 0) {
      console.warn('No sections found');
      return;
    }

    // Hide all sections except the first one
    this.hideAllSections();
    this.showSection('home');

    // Update navigation click handlers
    this.setupNavigation();

    console.log('✅ Page transitions initialized');
  },

  /**
   * Hide all sections
   */
  hideAllSections() {
    this.sections.forEach((section) => {
      section.style.display = 'none';
    });
  },

  /**
   * Show specific section
   */
  showSection(sectionId) {
    // Hide all first
    this.hideAllSections();

    // Find and show the target section
    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
      targetSection.style.display = 'flex';
      this.currentSection = sectionId;

      // Update active nav link
      this.updateActiveNav(sectionId);

      // Track page view
      if (typeof Analytics !== 'undefined') {
        Analytics.trackPageView(`/#${sectionId}`);
      }

      // Update URL hash without scrolling
      history.pushState(null, null, `#${sectionId}`);
    }
  },

  /**
   * Setup navigation click handlers
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll('.main-nav a, a[href^="#"]');

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');

        // Only handle internal section links
        if (href && href.startsWith('#') && href !== '#') {
          e.preventDefault();
          const sectionId = href.substring(1);
          this.showSection(sectionId);

          // Close mobile menu if open
          const menuToggle = document.querySelector('.menu-toggle');
          const mainNav = document.querySelector('.main-nav');
          if (menuToggle && mainNav) {
            menuToggle.classList.remove('active');
            mainNav.classList.remove('active');
          }
        }
      });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.substring(1) || 'home';
      this.showSection(hash);
    });

    // Check initial hash on load
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
      this.showSection(initialHash);
    }
  },

  /**
   * Update active navigation link
   */
  updateActiveNav(sectionId) {
    const navLinks = document.querySelectorAll('.main-nav a');

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${sectionId}`) {
        link.classList.add('active');
      }
    });
  },

  /**
   * Go to next section
   */
  nextSection() {
    const sectionIds = Array.from(this.sections)
      .map((s) => s.id)
      .filter((id) => id);
    const currentIndex = sectionIds.indexOf(this.currentSection);
    const nextIndex = (currentIndex + 1) % sectionIds.length;
    this.showSection(sectionIds[nextIndex]);
  },

  /**
   * Go to previous section
   */
  prevSection() {
    const sectionIds = Array.from(this.sections)
      .map((s) => s.id)
      .filter((id) => id);
    const currentIndex = sectionIds.indexOf(this.currentSection);
    const prevIndex =
      (currentIndex - 1 + sectionIds.length) % sectionIds.length;
    this.showSection(sectionIds[prevIndex]);
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PageTransitions.init());
  } else {
    PageTransitions.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PageTransitions;
}
