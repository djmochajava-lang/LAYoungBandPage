// js/navigation.js

/**
 * Navigation Module
 * Handles smooth scrolling and active link highlighting
 * (Mobile menu is handled by mobile-menu.js)
 */

const Navigation = {
  initialized: false,

  /**
   * Initialize navigation features
   */
  init() {
    if (this.initialized) {
      console.log('⚠️ Navigation already initialized, skipping...');
      return;
    }

    console.log('🚀 Initializing Navigation (smooth scroll & active links)...');

    this.initSmoothScroll();
    this.initActiveNav();

    this.initialized = true;
    console.log('✅ Navigation initialized');
  },

  /**
   * Smooth scroll for anchor links
   */
  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Skip if href is just "#"
        if (href === '#') return;

        e.preventDefault();

        const target = document.querySelector(href);
        if (target) {
          const headerOffset = 80; // Height of fixed header
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      });
    });
    console.log('✅ Smooth scroll initialized');
  },

  /**
   * Highlight active navigation link on scroll
   */
  initActiveNav() {
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll(
      '.main-nav a, .mobile-menu-link',
    );

    if (sections.length === 0 || navLinks.length === 0) {
      console.log('⚠️ No sections or nav links found for active highlighting');
      return;
    }

    const updateActiveLink = () => {
      let current = '';

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (window.pageYOffset >= sectionTop - 100) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink(); // Set initial active link
    console.log('✅ Active nav highlighting initialized');
  },

  /**
   * Get current active section
   */
  getCurrentSection() {
    const sections = document.querySelectorAll('.section, .hero');
    let current = null;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (window.pageYOffset >= sectionTop - 100) {
        current = section.getAttribute('id');
      }
    });

    return current;
  },
};

// Auto-initialize when DOM is ready
if (typeof module === 'undefined') {
  console.log('📄 navigation.js loaded (smooth scroll only)');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      Navigation.init();
    });
  } else {
    Navigation.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navigation;
}
