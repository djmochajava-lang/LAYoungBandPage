// js/scroll-effects.js

/**
 * Scroll Effects Module
 * Handles scroll-based animations, parallax, and header effects
 */

const ScrollEffects = {
  /**
   * Initialize all scroll effects
   */
  init() {
    this.initScrollReveal();
    this.initHeaderShadow();
    this.initParallax();
    console.log('✅ Scroll effects initialized');
  },

  /**
   * Reveal elements on scroll
   */
  initScrollReveal() {
    const reveals = document.querySelectorAll('.scroll-reveal');

    if (reveals.length === 0) return;

    // Use Intersection Observer for better performance
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              // Optionally unobserve after revealing
              // revealObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.15,
          rootMargin: '0px 0px -100px 0px',
        },
      );

      reveals.forEach((element) => revealObserver.observe(element));
    } else {
      // Fallback for older browsers
      const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;

        reveals.forEach((element) => {
          const elementTop = element.getBoundingClientRect().top;

          if (elementTop < windowHeight - revealPoint) {
            element.classList.add('revealed');
          }
        });
      };

      window.addEventListener('scroll', revealOnScroll);
      revealOnScroll(); // Check on load
    }
  },

  /**
   * Add shadow to header on scroll
   */
  initHeaderShadow() {
    const header = document.querySelector('.top-banner');

    if (!header) return;

    const updateHeaderShadow = () => {
      if (window.scrollY > 50) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
      } else {
        header.style.boxShadow = 'none';
      }
    };

    window.addEventListener('scroll', updateHeaderShadow);
    updateHeaderShadow(); // Set initial state
  },

  /**
   * Simple parallax effect for hero background
   */
  initParallax() {
    const hero = document.querySelector('.hero');

    if (!hero) return;

    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const parallaxScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxSpeed = 0.5;

      // Only apply parallax when hero is in view
      if (scrolled < hero.offsetHeight) {
        hero.style.backgroundPositionY = `${scrolled * parallaxSpeed}px`;
      }
    };

    window.addEventListener('scroll', parallaxScroll);
  },

  /**
   * Fade elements in sequence
   */
  fadeInSequence(elements, delay = 100) {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('fade-in');
      }, index * delay);
    });
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Get scroll percentage
   */
  getScrollPercentage() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    return (scrollTop / scrollHeight) * 100;
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ScrollEffects.init());
  } else {
    ScrollEffects.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollEffects;
}
