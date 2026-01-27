// js/gallery.js - IMPROVED VERSION WITH BETTER ERROR HANDLING

/**
 * Gallery Module
 * Handles photo gallery, lightbox, and image viewing
 */

const Gallery = {
  currentIndex: 0,
  images: [],
  initialized: false,

  /**
   * Initialize gallery
   */
  init() {
    console.log('🖼️ Initializing Gallery...');

    if (this.initialized) {
      console.log('Gallery already initialized, skipping...');
      return;
    }

    this.initGalleryItems();
    this.createLightbox();
    this.initialized = true;

    console.log('✅ Gallery initialized with', this.images.length, 'images');
  },

  /**
   * Initialize gallery item click handlers
   */
  initGalleryItems() {
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (galleryItems.length === 0) {
      console.warn('⚠️ No gallery items found');
      return;
    }

    console.log(`📸 Found ${galleryItems.length} gallery items`);

    // Collect all images
    this.images = Array.from(galleryItems)
      .map((item, index) => {
        const img = item.querySelector('img');

        if (!img) {
          console.warn(`⚠️ No image found in gallery item ${index + 1}`);
          return null;
        }

        // Log image details for debugging
        console.log(`Image ${index + 1}:`, {
          src: img.src,
          alt: img.alt,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
        });

        return {
          src: img.src || img.dataset.src || '',
          alt: img.alt || '',
          caption: item.dataset.caption || '',
          element: img,
        };
      })
      .filter((img) => img !== null); // Remove any null entries

    console.log(`✅ Successfully loaded ${this.images.length} images`);

    // Add click handlers
    galleryItems.forEach((item, index) => {
      const img = item.querySelector('img');

      if (!img) return;

      // Add error handler to each image
      img.addEventListener('error', (e) => {
        console.error(`❌ Failed to load image ${index + 1}:`, img.src);
        this.handleImageError(img, index);
      });

      // Add load handler for debugging
      img.addEventListener('load', (e) => {
        console.log(`✅ Successfully loaded image ${index + 1}`);
      });

      item.addEventListener('click', () => {
        console.log(`🖱️ Clicked gallery item ${index + 1}`);
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
   * Handle image loading errors
   */
  handleImageError(img, index) {
    // Try alternate file extensions
    const src = img.src;

    if (src.endsWith('.JPG') && !img.dataset.triedLowercase) {
      console.log('⚠️ Trying lowercase .jpg extension...');
      img.dataset.triedLowercase = 'true';
      img.src = src.replace('.JPG', '.jpg');
    } else if (src.endsWith('.PNG') && !img.dataset.triedLowercase) {
      console.log('⚠️ Trying lowercase .png extension...');
      img.dataset.triedLowercase = 'true';
      img.src = src.replace('.PNG', '.png');
    } else {
      // Show placeholder
      console.error('❌ All attempts failed, showing placeholder');
      img.alt = `Image ${index + 1} failed to load`;
      img.style.display = 'none';

      // Add placeholder text
      const parent = img.parentElement;
      if (parent && !parent.querySelector('.image-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'image-error';
        errorDiv.innerHTML = `
          <p style="color: rgba(255,255,255,0.6); text-align: center; padding: 2rem;">
            📷 Image not available<br>
            <small>${img.alt || 'Gallery image'}</small>
          </p>
        `;
        parent.appendChild(errorDiv);
      }
    }
  },

  /**
   * Create lightbox HTML structure
   */
  createLightbox() {
    if (document.getElementById('lightbox')) {
      console.log('Lightbox already exists');
      return;
    }

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

    console.log('✅ Lightbox created');
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

      .image-error {
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 215, 0, 0.2);
      }
    `;

    document.head.appendChild(style);
  },

  /**
   * Open lightbox at specific index
   */
  openLightbox(index) {
    if (index < 0 || index >= this.images.length) {
      console.error('Invalid image index:', index);
      return;
    }

    this.currentIndex = index;
    const lightbox = document.getElementById('lightbox');

    if (!lightbox) {
      console.error('Lightbox element not found');
      return;
    }

    const img = lightbox.querySelector('.lightbox-image');
    const caption = lightbox.querySelector('.lightbox-caption');
    const counter = lightbox.querySelector('.lightbox-counter');

    const imageData = this.images[index];

    console.log('Opening lightbox with image:', imageData);

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
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
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

  /**
   * Reload gallery (useful after dynamic content changes)
   */
  reload() {
    console.log('🔄 Reloading gallery...');
    this.initialized = false;
    this.images = [];
    this.currentIndex = 0;
    this.init();
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
