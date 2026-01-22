// js/navigation.js

/**
 * Navigation Module
 * Handles mobile menu, smooth scrolling, and active link highlighting
 */

const Navigation = {
  /**
   * Initialize all navigation features
   */
  init() {
    // Delay mobile menu init to ensure DOM is ready
    setTimeout(() => {
      this.initMobileMenu();
    }, 200);
    this.initSmoothScroll();
    this.initActiveNav();
    console.log('✅ Navigation initialized');
  },

  /**
   * Mobile menu toggle
   */
  initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (!menuToggle || !mainNav) {
      console.warn('Mobile menu elements not found');
      return;
    }

    // Toggle menu
    const toggleMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isActive = mainNav.classList.contains('active');

      if (isActive) {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        document.body.classList.remove('menu-open');
      } else {
        menuToggle.classList.add('active');
        mainNav.classList.add('active');
        document.body.classList.add('menu-open');
      }
    };

    // Add both click and touchstart for mobile support
    menuToggle.addEventListener('click', toggleMenu);
    menuToggle.addEventListener('touchstart', toggleMenu, { passive: false });

    // Close menu when clicking nav links
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });

    // Close menu when clicking backdrop
    document.body.addEventListener('click', (e) => {
      if (document.body.classList.contains('menu-open')) {
        if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
          menuToggle.classList.remove('active');
          mainNav.classList.remove('active');
          document.body.classList.remove('menu-open');
        }
      }
    });
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
  },

  /**
   * Highlight active navigation link on scroll
   */
  initActiveNav() {
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.main-nav a');

    if (sections.length === 0 || navLinks.length === 0) return;

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

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Navigation.init());
  } else {
    Navigation.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navigation;
}
