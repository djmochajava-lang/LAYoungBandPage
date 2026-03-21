// js/mobile-gallery.js

/**
 * Mobile Gallery — Social-media-inspired gallery experience
 *
 * Top: Reels (TikTok/IG vertical snap-scroll, one image at a time)
 * Bottom: Feed grid (IG 3-column grid, infinite scroll, tap-to-expand)
 * Lightbox: Full-screen with swipe nav + double-tap love animation
 *
 * Uses global artistImages[] and eventImages[] from gallery.js
 */

(function () {
  'use strict';

  var BATCH_SIZE = 12;
  var feedLoaded = 0;
  var feedObserver = null;
  var lbImages = [];
  var lbIndex = 0;
  var lbOpen = false;
  var touchStartX = 0;
  var touchStartY = 0;
  var lastTap = 0;

  function init() {
    var container = document.getElementById('mg-reels');
    if (!container) return;
    if (typeof artistImages === 'undefined' || typeof eventImages === 'undefined') return;

    buildReels();
    buildFeed();
    setupLightbox();
    console.log('📱 MobileGallery initialized');
  }

  // ─── REELS (Artist Photos) ───

  function buildReels() {
    var viewport = document.getElementById('mg-reels-viewport');
    var indicators = document.getElementById('mg-reels-indicators');
    var counter = document.getElementById('mg-reels-counter');
    if (!viewport) return;

    var html = '';
    for (var i = 0; i < artistImages.length; i++) {
      var img = artistImages[i];
      html += '<div class="mg-reel-slide" data-index="' + i + '">' +
        '<img src="' + img.src + '" alt="' + img.caption + '" loading="' + (i < 2 ? 'eager' : 'lazy') + '">' +
        '<div class="mg-reel-caption">' +
          '<div class="mg-reel-caption-title">' + img.caption + '</div>' +
          '<div class="mg-reel-caption-sub">' + img.sub + '</div>' +
        '</div>' +
      '</div>';
    }
    viewport.innerHTML = html;

    // Dot indicators
    var dots = '';
    for (var j = 0; j < artistImages.length; j++) {
      dots += '<div class="mg-dot' + (j === 0 ? ' active' : '') + '" data-i="' + j + '"></div>';
    }
    indicators.innerHTML = dots;

    // Scroll-snap observer to update active dot + counter
    var slides = viewport.querySelectorAll('.mg-reel-slide');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var idx = parseInt(entry.target.getAttribute('data-index'), 10);
          updateReelIndicator(idx);
        }
      });
    }, { root: viewport, threshold: 0.6 });

    slides.forEach(function (slide) { observer.observe(slide); });

    // Tap to navigate (left half = prev, right half = next)
    viewport.addEventListener('click', function (e) {
      // Don't navigate if double-tap love triggered
      var now = Date.now();
      if (now - lastTap < 350) return;

      var rect = viewport.getBoundingClientRect();
      var tapX = e.clientX - rect.left;
      var midpoint = rect.width / 2;
      var currentSlide = viewport.querySelector('.mg-reel-slide.visible') ||
        slides[getCurrentReelIndex(viewport, slides)];
      var idx = getCurrentReelIndex(viewport, slides);

      if (tapX < midpoint && idx > 0) {
        slides[idx - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (tapX >= midpoint && idx < slides.length - 1) {
        slides[idx + 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function getCurrentReelIndex(viewport, slides) {
    var scrollTop = viewport.scrollTop;
    var slideHeight = viewport.clientHeight;
    return Math.round(scrollTop / slideHeight);
  }

  function updateReelIndicator(idx) {
    var dots = document.querySelectorAll('#mg-reels-indicators .mg-dot');
    dots.forEach(function (d) { d.classList.remove('active'); });
    if (dots[idx]) dots[idx].classList.add('active');

    var counter = document.getElementById('mg-reels-counter');
    if (counter) counter.textContent = (idx + 1) + ' / ' + artistImages.length;
  }

  // ─── FEED GRID (Event/BackStage Photos) ───

  function buildFeed() {
    feedLoaded = 0;
    loadMoreFeed();

    // Infinite scroll via IntersectionObserver
    var sentinel = document.getElementById('mg-feed-sentinel');
    if (sentinel) {
      feedObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          loadMoreFeed();
        }
      }, { rootMargin: '200px' });
      feedObserver.observe(sentinel);
    }
  }

  function loadMoreFeed() {
    var grid = document.getElementById('mg-feed-grid');
    if (!grid || feedLoaded >= eventImages.length) {
      // Hide sentinel when done
      var sentinel = document.getElementById('mg-feed-sentinel');
      if (sentinel) sentinel.style.display = 'none';
      return;
    }

    var end = Math.min(feedLoaded + BATCH_SIZE, eventImages.length);
    var fragment = document.createDocumentFragment();

    for (var i = feedLoaded; i < end; i++) {
      var img = eventImages[i];
      var card = document.createElement('div');
      card.className = 'mg-feed-card';
      card.setAttribute('data-feed-index', i);

      var imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.alt = img.caption;
      imgEl.loading = 'lazy';

      card.appendChild(imgEl);
      fragment.appendChild(card);

      // Attach tap handler immediately
      attachFeedCardHandler(card);
    }

    grid.appendChild(fragment);
    feedLoaded = end;
  }

  function attachFeedCardHandler(card) {
    if (card._mgBound) return;
    card._mgBound = true;

    card.addEventListener('click', function () {
      var idx = parseInt(card.getAttribute('data-feed-index'), 10);
      openLightbox(eventImages, idx);
    });
  }

  // ─── LIGHTBOX ───

  function setupLightbox() {
    var lb = document.getElementById('mg-lightbox');
    if (!lb) return;

    // Close button
    document.getElementById('mg-lb-close').addEventListener('click', closeLightbox);

    // Nav buttons
    document.getElementById('mg-lb-prev').addEventListener('click', function (e) {
      e.stopPropagation();
      navigateLB(-1);
    });
    document.getElementById('mg-lb-next').addEventListener('click', function (e) {
      e.stopPropagation();
      navigateLB(1);
    });

    // Swipe navigation in lightbox
    var imgWrap = document.getElementById('mg-lb-img-wrap');
    imgWrap.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    imgWrap.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        navigateLB(dx < 0 ? 1 : -1);
      }
    }, { passive: true });

    // Double-tap to love
    imgWrap.addEventListener('touchend', function (e) {
      var now = Date.now();
      if (now - lastTap < 300) {
        showLoveBurst(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      lastTap = now;
    }, { passive: true });

    // Backdrop close
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (!lbOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLB(-1);
      if (e.key === 'ArrowRight') navigateLB(1);
    });

    // Also allow reels images to open lightbox
    var reelsViewport = document.getElementById('mg-reels-viewport');
    if (reelsViewport) {
      reelsViewport.addEventListener('dblclick', function (e) {
        var slide = e.target.closest('.mg-reel-slide');
        if (slide) {
          var idx = parseInt(slide.getAttribute('data-index'), 10);
          openLightbox(artistImages, idx);
        }
      });
    }
  }

  function openLightbox(images, index) {
    lbImages = images;
    lbIndex = index;
    lbOpen = true;

    var lb = document.getElementById('mg-lightbox');
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    showLBImage();
  }

  function closeLightbox() {
    lbOpen = false;
    var lb = document.getElementById('mg-lightbox');
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  function navigateLB(dir) {
    lbIndex += dir;
    if (lbIndex < 0) lbIndex = lbImages.length - 1;
    if (lbIndex >= lbImages.length) lbIndex = 0;
    showLBImage();
  }

  function showLBImage() {
    var img = lbImages[lbIndex];
    var lbImg = document.getElementById('mg-lb-img');
    var caption = document.getElementById('mg-lb-caption');
    var counter = document.getElementById('mg-lb-counter');

    lbImg.src = img.src;
    lbImg.alt = img.caption;
    caption.textContent = img.caption;
    counter.textContent = (lbIndex + 1) + ' / ' + lbImages.length;
  }

  // ─── DOUBLE-TAP LOVE BURST ───

  function showLoveBurst(x, y) {
    var burst = document.getElementById('mg-love-burst');
    if (!burst) return;

    burst.innerHTML = '';
    burst.style.left = x + 'px';
    burst.style.top = y + 'px';

    var heart = document.createElement('div');
    heart.className = 'mg-heart';
    heart.textContent = '\u2764';
    burst.appendChild(heart);

    burst.classList.add('active');
    setTimeout(function () {
      burst.classList.remove('active');
    }, 900);
  }

  // ─── Expose ───
  window.MobileGallery = { init: init };
})();
