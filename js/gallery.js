// js/gallery.js

/**
 * Gallery Module
 * Handles photo gallery, lightbox, and image viewing
 */

const Gallery = {
  currentIndex: 0,
  images: [],

  /**
   * Initialize gallery
   */
  init() {
    this.initGalleryItems();
    this.createLightbox();
    console.log('✅ Gallery initialized');
  },

  /**
   * Initialize gallery item click handlers
   */
  initGalleryItems() {
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (galleryItems.length === 0) return;

    // Collect all images
    this.images = Array.from(galleryItems).map((item) => {
      const img = item.querySelector('img');
      return {
        src: img?.src || item.dataset.src || '',
        alt: img?.alt || '',
        caption: item.dataset.caption || '',
      };
    });

    // Add click handlers
    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        this.openLightbox(index);

        if (typeof Analytics !== 'undefined') {
          Analytics.trackEvent('Gallery', 'View Image', `Image ${index + 1}`);
        }
      });

      // Add keyboard navigation
      item.setAttribute('tabindex', '0');
      item.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openLightbox(index);
        }
      });
    });
  },

  /**
   * Create lightbox HTML structure
   */
  createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
        <button class="lightbox-prev" aria-label="Previous image">&#8249;</button>
        <button class="lightbox-next" aria-label="Next image">&#8250;</button>
        <img class="lightbox-image" src="" alt="">
        <div class="lightbox-caption"></div>
        <div class="lightbox-counter"></div>
      </div>
    `;

    document.body.appendChild(lightbox);

    // Add styles
    this.addLightboxStyles();

    // Event listeners
    lightbox
      .querySelector('.lightbox-close')
      .addEventListener('click', () => this.closeLightbox());
    lightbox
      .querySelector('.lightbox-prev')
      .addEventListener('click', () => this.prevImage());
    lightbox
      .querySelector('.lightbox-next')
      .addEventListener('click', () => this.nextImage());
    lightbox
      .querySelector('.lightbox-overlay')
      .addEventListener('click', () => this.closeLightbox());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;

      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.prevImage();
      if (e.key === 'ArrowRight') this.nextImage();
    });
  },

  /**
   * Add lightbox CSS styles
   */
  addLightboxStyles() {
    if (document.getElementById('lightbox-styles')) return;

    const style = document.createElement('style');
    style.id = 'lightbox-styles';
    style.textContent = `
      .lightbox {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
      }
      
      .lightbox.active {
        display: block;
      }
      
      .lightbox-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
      }
      
      .lightbox-content {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 2rem;
      }
      
      .lightbox-image {
        max-width: 90%;
        max-height: 80vh;
        object-fit: contain;
        animation: fadeInUp 0.3s ease-out;
      }
      
      .lightbox-caption {
        color: white;
        text-align: center;
        margin-top: 1rem;
        font-size: 1.1rem;
      }
      
      .lightbox-counter {
        color: rgba(255, 255, 255, 0.7);
        text-align: center;
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
      
      .lightbox-close,
      .lightbox-prev,
      .lightbox-next {
        position: absolute;
        background: rgba(255, 215, 0, 0.2);
        border: 1px solid rgba(255, 215, 0, 0.5);
        color: #ffd700;
        font-size: 2rem;
        width: 50px;
        height: 50px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .lightbox-close {
        top: 20px;
        right: 20px;
      }
      
      .lightbox-prev {
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
      }
      
      .lightbox-next {
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
      }
      
      .lightbox-close:hover,
      .lightbox-prev:hover,
      .lightbox-next:hover {
        background: rgba(255, 215, 0, 0.4);
        border-color: #ffd700;
      }
      
      @media (max-width: 768px) {
        .lightbox-image {
          max-width: 95%;
          max-height: 70vh;
        }
        
        .lightbox-prev,
        .lightbox-next {
          width: 40px;
          height: 40px;
          font-size: 1.5rem;
        }
      }
    `;

    document.head.appendChild(style);
  },

  /**
   * Open lightbox at specific index
   */
  openLightbox(index) {
    this.currentIndex = index;
    const lightbox = document.getElementById('lightbox');
    const img = lightbox.querySelector('.lightbox-image');
    const caption = lightbox.querySelector('.lightbox-caption');
    const counter = lightbox.querySelector('.lightbox-counter');

    const imageData = this.images[index];

    img.src = imageData.src;
    img.alt = imageData.alt;
    caption.textContent = imageData.caption;
    counter.textContent = `${index + 1} / ${this.images.length}`;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  /**
   * Close lightbox
   */
  closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  },

  /**
   * Show previous image
   */
  prevImage() {
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.openLightbox(this.currentIndex);
  },

  /**
   * Show next image
   */
  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.openLightbox(this.currentIndex);
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Gallery.init());
  } else {
    Gallery.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Gallery;
}
