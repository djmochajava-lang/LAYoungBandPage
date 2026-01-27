(function () {
  'use strict';

  // Slideshow Configuration - 124 IMAGES
  const slideshowConfig = {
    images: [
      { src: 'images/gallery/event001.jpg', caption: 'Event photo 1' },
      { src: 'images/gallery/event002.jpg', caption: 'Event photo 2' },
      { src: 'images/gallery/event003.jpg', caption: 'Event photo 3' },
      { src: 'images/gallery/event004.jpg', caption: 'Event photo 4' },
      { src: 'images/gallery/event005.jpg', caption: 'Event photo 5' },
      { src: 'images/gallery/event006.jpg', caption: 'Event photo 6' },
      { src: 'images/gallery/event007.jpg', caption: 'Event photo 7' },
      { src: 'images/gallery/event008.jpg', caption: 'Event photo 8' },
      { src: 'images/gallery/event009.jpg', caption: 'Event photo 9' },
      { src: 'images/gallery/event010.jpg', caption: 'Event photo 10' },
      { src: 'images/gallery/event011.jpg', caption: 'Event photo 11' },
      { src: 'images/gallery/event012.jpg', caption: 'Event photo 12' },
      { src: 'images/gallery/event013.jpg', caption: 'Event photo 13' },
      { src: 'images/gallery/event014.jpg', caption: 'Event photo 14' },
      { src: 'images/gallery/event015.jpg', caption: 'Event photo 15' },
      { src: 'images/gallery/event016.jpg', caption: 'Event photo 16' },
      { src: 'images/gallery/event017.jpg', caption: 'Event photo 17' },
      { src: 'images/gallery/event018.jpg', caption: 'Event photo 18' },
      { src: 'images/gallery/event019.jpg', caption: 'Event photo 19' },
      { src: 'images/gallery/event020.jpg', caption: 'Event photo 20' },
      { src: 'images/gallery/event021.jpg', caption: 'Event photo 21' },
      { src: 'images/gallery/event022.jpg', caption: 'Event photo 22' },
      { src: 'images/gallery/event023.jpg', caption: 'Event photo 23' },
      { src: 'images/gallery/event024.jpg', caption: 'Event photo 24' },
      { src: 'images/gallery/event025.jpg', caption: 'Event photo 25' },
      { src: 'images/gallery/event026.jpg', caption: 'Event photo 26' },
      { src: 'images/gallery/event027.jpg', caption: 'Event photo 27' },
      { src: 'images/gallery/event028.jpg', caption: 'Event photo 28' },
      { src: 'images/gallery/event029.jpg', caption: 'Event photo 29' },
      { src: 'images/gallery/event030.jpg', caption: 'Event photo 30' },
      { src: 'images/gallery/event031.jpg', caption: 'Event photo 31' },
      { src: 'images/gallery/event032.jpg', caption: 'Event photo 32' },
      { src: 'images/gallery/event033.jpg', caption: 'Event photo 33' },
      { src: 'images/gallery/event034.jpg', caption: 'Event photo 34' },
      { src: 'images/gallery/event035.jpg', caption: 'Event photo 35' },
      { src: 'images/gallery/event036.jpg', caption: 'Event photo 36' },
      { src: 'images/gallery/event037.jpg', caption: 'Event photo 37' },
      { src: 'images/gallery/event038.jpg', caption: 'Event photo 38' },
      { src: 'images/gallery/event039.jpg', caption: 'Event photo 39' },
      { src: 'images/gallery/event040.jpg', caption: 'Event photo 40' },
      { src: 'images/gallery/event041.jpg', caption: 'Event photo 41' },
      { src: 'images/gallery/event042.jpg', caption: 'Event photo 42' },
      { src: 'images/gallery/event043.jpg', caption: 'Event photo 43' },
      { src: 'images/gallery/event044.jpg', caption: 'Event photo 44' },
      { src: 'images/gallery/event045.jpg', caption: 'Event photo 45' },
      { src: 'images/gallery/event046.jpg', caption: 'Event photo 46' },
      { src: 'images/gallery/event047.jpg', caption: 'Event photo 47' },
      { src: 'images/gallery/event048.jpg', caption: 'Event photo 48' },
      { src: 'images/gallery/event049.jpg', caption: 'Event photo 49' },
      { src: 'images/gallery/event050.jpg', caption: 'Event photo 50' },
      { src: 'images/gallery/event051.jpg', caption: 'Event photo 51' },
      { src: 'images/gallery/event052.jpg', caption: 'Event photo 52' },
      { src: 'images/gallery/event053.jpg', caption: 'Event photo 53' },
      { src: 'images/gallery/event054.jpg', caption: 'Event photo 54' },
      { src: 'images/gallery/event055.jpg', caption: 'Event photo 55' },
      { src: 'images/gallery/event056.jpg', caption: 'Event photo 56' },
      { src: 'images/gallery/event057.jpg', caption: 'Event photo 57' },
      { src: 'images/gallery/event058.jpg', caption: 'Event photo 58' },
      { src: 'images/gallery/event059.jpg', caption: 'Event photo 59' },
      { src: 'images/gallery/event060.jpg', caption: 'Event photo 60' },
      { src: 'images/gallery/event061.jpg', caption: 'Event photo 61' },
      { src: 'images/gallery/event062.jpg', caption: 'Event photo 62' },
      { src: 'images/gallery/event063.jpg', caption: 'Event photo 63' },
      { src: 'images/gallery/event064.jpg', caption: 'Event photo 64' },
      { src: 'images/gallery/event065.jpg', caption: 'Event photo 65' },
      { src: 'images/gallery/event066.jpg', caption: 'Event photo 66' },
      { src: 'images/gallery/event067.jpg', caption: 'Event photo 67' },
      { src: 'images/gallery/event068.jpg', caption: 'Event photo 68' },
      { src: 'images/gallery/event069.jpg', caption: 'Event photo 69' },
      { src: 'images/gallery/event070.jpg', caption: 'Event photo 70' },
      { src: 'images/gallery/event071.jpg', caption: 'Event photo 71' },
      { src: 'images/gallery/event072.jpg', caption: 'Event photo 72' },
      { src: 'images/gallery/event073.jpg', caption: 'Event photo 73' },
      { src: 'images/gallery/event074.jpg', caption: 'Event photo 74' },
      { src: 'images/gallery/event075.jpg', caption: 'Event photo 75' },
      { src: 'images/gallery/event076.jpg', caption: 'Event photo 76' },
      { src: 'images/gallery/event077.jpg', caption: 'Event photo 77' },
      { src: 'images/gallery/event078.jpg', caption: 'Event photo 78' },
      { src: 'images/gallery/event079.jpg', caption: 'Event photo 79' },
      { src: 'images/gallery/event080.jpg', caption: 'Event photo 80' },
      { src: 'images/gallery/event081.jpg', caption: 'Event photo 81' },
      { src: 'images/gallery/event082.jpg', caption: 'Event photo 82' },
      { src: 'images/gallery/event083.jpg', caption: 'Event photo 83' },
      { src: 'images/gallery/event084.jpg', caption: 'Event photo 84' },
      { src: 'images/gallery/event085.jpg', caption: 'Event photo 85' },
      { src: 'images/gallery/event086.jpg', caption: 'Event photo 86' },
      { src: 'images/gallery/event087.jpg', caption: 'Event photo 87' },
      { src: 'images/gallery/event088.jpg', caption: 'Event photo 88' },
      { src: 'images/gallery/event089.jpg', caption: 'Event photo 89' },
      { src: 'images/gallery/event090.jpg', caption: 'Event photo 90' },
      { src: 'images/gallery/event091.jpg', caption: 'Event photo 91' },
      { src: 'images/gallery/event092.jpg', caption: 'Event photo 92' },
      { src: 'images/gallery/event093.jpg', caption: 'Event photo 93' },
      { src: 'images/gallery/event094.jpg', caption: 'Event photo 94' },
      { src: 'images/gallery/event095.jpg', caption: 'Event photo 95' },
      { src: 'images/gallery/event096.jpg', caption: 'Event photo 96' },
      { src: 'images/gallery/event097.jpg', caption: 'Event photo 97' },
      { src: 'images/gallery/event098.jpg', caption: 'Event photo 98' },
      { src: 'images/gallery/event099.jpg', caption: 'Event photo 99' },
      { src: 'images/gallery/event100.jpg', caption: 'Event photo 100' },
      { src: 'images/gallery/event101.jpg', caption: 'Event photo 101' },
      { src: 'images/gallery/event102.jpg', caption: 'Event photo 102' },
      { src: 'images/gallery/event103.jpg', caption: 'Event photo 103' },
      { src: 'images/gallery/event104.jpg', caption: 'Event photo 104' },
      { src: 'images/gallery/event105.jpg', caption: 'Event photo 105' },
      { src: 'images/gallery/event106.jpg', caption: 'Event photo 106' },
      { src: 'images/gallery/event107.jpg', caption: 'Event photo 107' },
      { src: 'images/gallery/event108.jpg', caption: 'Event photo 108' },
      { src: 'images/gallery/event109.jpg', caption: 'Event photo 109' },
      { src: 'images/gallery/event110.jpg', caption: 'Event photo 110' },
      { src: 'images/gallery/event111.jpg', caption: 'Event photo 111' },
      { src: 'images/gallery/event112.jpg', caption: 'Event photo 112' },
      { src: 'images/gallery/event113.jpg', caption: 'Event photo 113' },
      { src: 'images/gallery/event114.jpg', caption: 'Event photo 114' },
      { src: 'images/gallery/event115.jpg', caption: 'Event photo 115' },
      { src: 'images/gallery/event116.jpg', caption: 'Event photo 116' },
      { src: 'images/gallery/event117.jpg', caption: 'Event photo 117' },
      { src: 'images/gallery/event118.jpg', caption: 'Event photo 118' },
      { src: 'images/gallery/event119.jpg', caption: 'Event photo 119' },
      { src: 'images/gallery/event120.jpg', caption: 'Event photo 120' },
      { src: 'images/gallery/event121.jpg', caption: 'Event photo 121' },
      { src: 'images/gallery/event122.jpg', caption: 'Event photo 122' },
      { src: 'images/gallery/event123.jpg', caption: 'Event photo 123' },
      { src: 'images/gallery/event124.jpg', caption: 'Event photo 124' },
    ],
    interval: 4000, // 4 seconds per slide
    transitionSpeed: 800, // 0.8 seconds fade
  };

  let currentSlide = 0;
  let autoPlayInterval = null;
  let isPlaying = true;
  let slideshowInitialized = false;

  // Initialize slideshow when gallery page is loaded
  function initSlideshow() {
    // Check if slideshow container exists (i.e., gallery page is loaded)
    const container = document.querySelector('.slideshow-container');
    if (!container) {
      // Gallery page not loaded yet, will try again when it loads
      return;
    }

    // Avoid double initialization
    if (slideshowInitialized) {
      return;
    }

    console.log('🎬 Initializing slideshow...');

    if (slideshowConfig.images.length === 0) {
      console.warn('⚠️ No images configured for slideshow');
      showPlaceholder();
      return;
    }

    // Check if elements exist
    const totalSlidesEl = document.getElementById('total-slides');
    if (!totalSlidesEl) {
      console.warn('⚠️ Slideshow elements not found, will retry...');
      return;
    }

    // Update total slides counter
    totalSlidesEl.textContent = slideshowConfig.images.length;

    // Load first image
    loadSlide(0);

    // Create thumbnails
    createThumbnails();

    // Setup event listeners
    setupControls();

    // Start autoplay
    startAutoPlay();

    slideshowInitialized = true;
    console.log(
      `✅ Slideshow initialized with ${slideshowConfig.images.length} images`,
    );
  }

  // Load a specific slide
  function loadSlide(index) {
    if (index < 0 || index >= slideshowConfig.images.length) return;

    currentSlide = index;
    const slide = slideshowConfig.images[index];

    const img = document.getElementById('slideshow-image');
    const caption = document.getElementById('slideshow-caption');
    const counter = document.getElementById('current-slide');

    if (!img || !caption || !counter) return;

    // Fade out
    img.style.opacity = '0';

    setTimeout(() => {
      img.src = slide.src;
      img.alt = slide.caption || 'Event photo';
      caption.textContent = slide.caption || '';
      counter.textContent = index + 1;

      // Update thumbnail highlights
      updateThumbnailHighlight(index);

      // Fade in
      setTimeout(() => {
        img.style.opacity = '1';
      }, 50);
    }, slideshowConfig.transitionSpeed / 2);
  }

  // Next slide
  function nextSlide() {
    const next = (currentSlide + 1) % slideshowConfig.images.length;
    loadSlide(next);
  }

  // Previous slide
  function prevSlide() {
    const prev =
      (currentSlide - 1 + slideshowConfig.images.length) %
      slideshowConfig.images.length;
    loadSlide(prev);
  }

  // Start autoplay
  function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, slideshowConfig.interval);
    isPlaying = true;
    updatePlayPauseButton();
  }

  // Stop autoplay
  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
    isPlaying = false;
    updatePlayPauseButton();
  }

  // Toggle play/pause
  function togglePlayPause() {
    if (isPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  // Update play/pause button
  function updatePlayPauseButton() {
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    const status = document.querySelector('.slideshow-status');

    if (!playIcon || !pauseIcon || !status) return;

    if (isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
      status.textContent = 'Auto-playing';
    } else {
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      status.textContent = 'Paused';
    }
  }

  // Create thumbnail navigation
  function createThumbnails() {
    const container = document.getElementById('slideshow-thumbnails');
    if (!container) return;

    container.innerHTML = '';

    slideshowConfig.images.forEach((slide, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'slideshow-thumbnail';
      thumb.dataset.index = index;

      const img = document.createElement('img');
      img.src = slide.src;
      img.alt = slide.caption || `Slide ${index + 1}`;

      thumb.appendChild(img);
      container.appendChild(thumb);

      // Click handler
      thumb.addEventListener('click', () => {
        loadSlide(index);
        stopAutoPlay(); // Stop autoplay when manually selecting
      });
    });
  }

  // Update thumbnail highlight
  function updateThumbnailHighlight(index) {
    const thumbnails = document.querySelectorAll('.slideshow-thumbnail');
    thumbnails.forEach((thumb, i) => {
      if (i === index) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  // Setup controls
  function setupControls() {
    // Previous button
    const prevBtn = document.querySelector('.slideshow-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoPlay();
      });
    }

    // Next button
    const nextBtn = document.querySelector('.slideshow-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoPlay();
      });
    }

    // Play/Pause button
    const playPauseBtn = document.getElementById('slideshow-play-pause');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', togglePlayPause);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Only if slideshow is visible
      const slideshow = document.querySelector('.slideshow-container');
      if (!slideshow || !isElementInViewport(slideshow)) return;

      if (e.key === 'ArrowLeft') {
        prevSlide();
        stopAutoPlay();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        stopAutoPlay();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    });

    // Pause on hover
    const slideshowWrapper = document.querySelector('.slideshow-wrapper');
    if (slideshowWrapper) {
      slideshowWrapper.addEventListener('mouseenter', () => {
        if (isPlaying) stopAutoPlay();
      });
      slideshowWrapper.addEventListener('mouseleave', () => {
        if (!isPlaying) startAutoPlay();
      });
    }
  }

  // Show placeholder if no images
  function showPlaceholder() {
    const container = document.querySelector('.slideshow-image-container');
    if (container) {
      container.innerHTML = `
        <div class="slideshow-placeholder">
          <p style="color: rgba(255,255,255,0.6); text-align: center; padding: 4rem;">
            📸 Event photos coming soon!<br>
            <small>Add images to images/gallery/ folder</small>
          </p>
        </div>
      `;
    }
  }

  // Check if element is in viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Try to initialize immediately
  initSlideshow();

  // Also try on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlideshow);
  }

  // Watch for DOM changes (when gallery page loads dynamically)
  const observer = new MutationObserver((mutations) => {
    // Check if slideshow container was added
    const container = document.querySelector('.slideshow-container');
    if (container && !slideshowInitialized) {
      // Wait a bit for all elements to be ready
      setTimeout(initSlideshow, 100);
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    observer.disconnect();
  });

  // Expose init function globally for manual triggering
  window.initGallerySlideshow = initSlideshow;
})();
