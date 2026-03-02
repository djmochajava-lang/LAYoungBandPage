// js/gallery.js

/**
 * Gallery Module — Futuristic Showcase (Factory Pattern)
 * 3D tilt, auto-rotation, holographic thumbnails, cinematic lightbox
 *
 * Creates independent gallery instances with parameterized DOM ID prefixes.
 * Usage:
 *   const gallery = createGallery({ prefix: 'fg', images: [...] });
 *   gallery.init();
 */

'use strict';

function createGallery(config) {
  const prefix = config.prefix || 'fg';
  const images = config.images || [];
  const INTERVAL = config.interval || 4000;
  const RESUME_DELAY = config.resumeDelay || 6000;
  const MAX_HEIGHT = config.maxHeight || 620;
  const PARTICLE_COUNT = config.particleCount || 25;
  const lazyLoad = config.lazyLoad || false;
  const CIRCUM = 2 * Math.PI * 18; // ~113
  const LAZY_BUFFER = 3; // preload this many images around current

  // Instance state
  let initialized = false;
  let cur = 0;
  let autoTimer = null;
  let progressRAF = null;
  let progressStart = 0;
  let paused = true; // start paused — user must initiate playback
  let resumeTimer = null;
  let lbOpen = false;
  let userStartedPlay = false; // tracks if user clicked play
  let els = {};
  let showcaseImgs = null; // NodeList or Map for lazy mode
  let thumbCards = null;
  let _keyHandler = null;
  let _tiltMove = null;
  let _tiltLeave = null;
  let _lbWrapClick = null;
  let thumbObserver = null;

  // ─── Helpers ───

  function id(suffix) {
    return document.getElementById(prefix + '-' + suffix);
  }

  // ─── Init / Destroy ───

  function init() {
    console.log('🖼️ Initializing Gallery [' + prefix + ']...');

    const showcaseFrame = id('showcaseFrame');
    if (!showcaseFrame) {
      console.log('Gallery [' + prefix + '] elements not found, skipping...');
      return;
    }

    destroy();

    els = {
      showcaseFrame: showcaseFrame,
      showcase: id('showcase'),
      capTitle: id('capTitle'),
      capSub: id('capSub'),
      capCount: id('capCount'),
      ringFill: id('ringFill'),
      thumbStrip: id('thumbStrip'),
      lightbox: id('lightbox'),
      lbImg: id('lbImg'),
      lbTitle: id('lbTitle'),
      lbCount: id('lbCount'),
    };

    cur = 0;
    paused = false;
    lbOpen = false;

    createParticles();
    createProgressRing();

    if (lazyLoad) {
      initLazyShowcase();
    } else {
      preloadImages();
    }

    buildThumbnails();
    setupDragScroll();
    bind3DTilt();
    bindNavigation();
    bindLightbox();
    bindKeyboard();
    bindTouch();
    updateCaption();

    // Don't auto-play — wait for user to start or navigate
    paused = true;
    userStartedPlay = false;
    stopAuto();

    initialized = true;
    console.log('✅ Gallery [' + prefix + '] initialized with', images.length, 'images');
  }

  function destroy() {
    stopAuto();
    clearTimeout(resumeTimer);
    initialized = false;
    if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
    if (_tiltMove && els.showcase) {
      els.showcase.removeEventListener('mousemove', _tiltMove);
      els.showcase.removeEventListener('mouseleave', _tiltLeave);
    }
    if (thumbObserver) {
      thumbObserver.disconnect();
      thumbObserver = null;
    }
    if (_lbWrapClick && els.lightbox) {
      var wrap = els.lightbox.querySelector('.fg-lb-img-wrap');
      if (wrap) wrap.removeEventListener('click', _lbWrapClick);
    }
    _keyHandler = null;
    _tiltMove = null;
    _tiltLeave = null;
    _lbWrapClick = null;
  }

  function reload() {
    console.log('🔄 Reloading gallery [' + prefix + ']...');
    init();
  }

  // ─── Particles ───

  function createParticles() {
    const container = id('particles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = document.createElement('div');
      p.className = 'fg-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = p.style.height = (1.5 + Math.random() * 3) + 'px';
      p.style.animationDuration = (8 + Math.random() * 15) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.opacity = 0.2 + Math.random() * 0.5;
      container.appendChild(p);
    }
  }

  // ─── Progress Ring ───

  function createProgressRing() {
    const wrap = id('progressRingWrap');
    if (!wrap || wrap.querySelector('svg')) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'fg-progress-ring');
    svg.setAttribute('width', '42');
    svg.setAttribute('height', '42');
    svg.setAttribute('viewBox', '0 0 42 42');
    const bg = document.createElementNS(ns, 'circle');
    bg.setAttribute('class', 'fg-ring-bg');
    bg.setAttribute('cx', '21');
    bg.setAttribute('cy', '21');
    bg.setAttribute('r', '18');
    svg.appendChild(bg);
    const fill = document.createElementNS(ns, 'circle');
    fill.setAttribute('class', 'fg-ring-fill');
    fill.setAttribute('id', prefix + '-ringFill');
    fill.setAttribute('cx', '21');
    fill.setAttribute('cy', '21');
    fill.setAttribute('r', '18');
    svg.appendChild(fill);
    wrap.appendChild(svg);
    els.ringFill = fill;
  }

  // ─── Standard Image Preload (for small galleries) ───

  function preloadImages() {
    const frame = els.showcaseFrame;
    frame.querySelectorAll('.fg-showcase-img').forEach(function (el) { el.remove(); });

    images.forEach(function (img, i) {
      var el = document.createElement('img');
      el.className = 'fg-showcase-img' + (i === 0 ? ' active' : '');
      el.src = img.src;
      el.alt = img.caption;
      el.draggable = false;
      el.onload = function () {
        img.w = el.naturalWidth;
        img.h = el.naturalHeight;
        img.ratio = el.naturalWidth / el.naturalHeight;
        if (i === 0) updateFrameSize(0);
      };
      frame.insertBefore(el, frame.querySelector('.fg-showcase-caption'));
    });
    showcaseImgs = frame.querySelectorAll('.fg-showcase-img');
  }

  // ─── Lazy Loading (for large galleries like 124 event images) ───

  /** @type {Map<number, HTMLImageElement>} */
  var lazyImgMap = new Map();

  function initLazyShowcase() {
    var frame = els.showcaseFrame;
    frame.querySelectorAll('.fg-showcase-img').forEach(function (el) { el.remove(); });
    lazyImgMap.clear();
    showcaseImgs = null; // We use lazyImgMap instead

    // Load the first image + buffer
    loadLazyRange(0);
  }

  function loadLazyRange(center) {
    var frame = els.showcaseFrame;
    var caption = frame.querySelector('.fg-showcase-caption');

    for (var offset = -LAZY_BUFFER; offset <= LAZY_BUFFER; offset++) {
      var idx = ((center + offset) % images.length + images.length) % images.length;
      if (lazyImgMap.has(idx)) continue;

      var img = images[idx];
      var el = document.createElement('img');
      el.className = 'fg-showcase-img' + (idx === cur ? ' active' : '');
      el.src = img.src;
      el.alt = img.caption;
      el.draggable = false;
      (function (theImg, theIdx, theEl) {
        theEl.onload = function () {
          theImg.w = theEl.naturalWidth;
          theImg.h = theEl.naturalHeight;
          theImg.ratio = theEl.naturalWidth / theEl.naturalHeight;
          if (theIdx === cur) updateFrameSize(cur);
        };
      })(img, idx, el);
      frame.insertBefore(el, caption);
      lazyImgMap.set(idx, el);
    }
  }

  function getLazyImg(index) {
    return lazyImgMap.get(index) || null;
  }

  // ─── Frame Size ───

  function updateFrameSize(index) {
    var img = images[index];
    if (!img || !img.ratio) return;
    var ratio = img.ratio;
    var frame = els.showcaseFrame;

    frame.style.aspectRatio = ratio.toFixed(4);

    if (ratio < 1) {
      var widthForMaxHeight = MAX_HEIGHT * ratio;
      frame.style.maxWidth = Math.max(Math.min(widthForMaxHeight, 500), 320) + 'px';
    } else if (ratio <= 1.15) {
      frame.style.maxWidth = '620px';
    } else {
      frame.style.maxWidth = '100%';
    }
  }

  // ─── Thumbnails ───

  function buildThumbnails() {
    var strip = els.thumbStrip;
    if (!strip) return;
    strip.innerHTML = '';

    if (lazyLoad && images.length > 30) {
      // Lazy thumbnails: create placeholder divs, load images via IntersectionObserver
      buildLazyThumbnails(strip);
    } else {
      // Standard thumbnails (small gallery)
      buildStandardThumbnails(strip);
    }
  }

  function buildStandardThumbnails(strip) {
    images.forEach(function (img, i) {
      var card = createThumbCard(img, i);
      strip.appendChild(card);
    });
    thumbCards = strip.querySelectorAll('.fg-thumb-card');
  }

  function buildLazyThumbnails(strip) {
    // Create all cards but defer image loading
    images.forEach(function (img, i) {
      var card = document.createElement('div');
      card.className = 'fg-thumb-card' + (i === 0 ? ' active' : '');
      card.style.animationDelay = (0.5 + (Math.min(i, 20)) * 0.07) + 's';
      card.dataset.index = i;

      // Placeholder structure (no img src yet)
      var imgEl = document.createElement('img');
      imgEl.alt = img.caption;
      imgEl.draggable = false;
      imgEl.dataset.src = img.src; // store for lazy load
      card.appendChild(imgEl);

      var shine = document.createElement('div');
      shine.className = 'fg-holo-shine';
      card.appendChild(shine);

      var label = document.createElement('div');
      label.className = 'fg-thumb-label';
      label.textContent = (img.caption || '').replace('BackStage photo ', '#');
      card.appendChild(label);

      card.addEventListener('click', function () {
        goTo(i);
        pauseAuto();
        scheduleResume();
      });
      strip.appendChild(card);
    });

    thumbCards = strip.querySelectorAll('.fg-thumb-card');

    // Load visible + nearby thumbnails via IntersectionObserver
    if ('IntersectionObserver' in window) {
      thumbObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var card = entry.target;
            var imgEl = card.querySelector('img');
            if (imgEl && imgEl.dataset.src && !imgEl.src) {
              imgEl.src = imgEl.dataset.src;
            }
            thumbObserver.unobserve(card);
          }
        });
      }, { root: strip, rootMargin: '0px 200px' });

      thumbCards.forEach(function (card) {
        thumbObserver.observe(card);
      });
    } else {
      // Fallback: load all
      thumbCards.forEach(function (card) {
        var imgEl = card.querySelector('img');
        if (imgEl && imgEl.dataset.src) imgEl.src = imgEl.dataset.src;
      });
    }
  }

  function createThumbCard(img, i) {
    var card = document.createElement('div');
    card.className = 'fg-thumb-card' + (i === 0 ? ' active' : '');
    card.style.animationDelay = (0.5 + i * 0.07) + 's';
    card.innerHTML =
      '<img src="' + img.src + '" alt="' + img.caption + '" draggable="false">' +
      '<div class="fg-holo-shine"></div>' +
      '<div class="fg-thumb-label">' + (img.caption || '').replace('L.A. Young ', '') + '</div>';
    card.addEventListener('click', function () {
      goTo(i);
      pauseAuto();
      scheduleResume();
    });
    return card;
  }

  // ─── Drag-to-Scroll on Thumbnail Strip ───

  function setupDragScroll() {
    var strip = els.thumbStrip;
    if (!strip) return;

    var isDown = false;
    var startX = 0;
    var scrollStart = 0;
    var hasDragged = false;

    strip.style.cursor = 'grab';

    strip.addEventListener('mousedown', function (e) {
      // Only left mouse button
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX;
      scrollStart = strip.scrollLeft;
      strip.style.cursor = 'grabbing';
      strip.style.scrollBehavior = 'auto';
      e.preventDefault();
    });

    strip.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      var dx = e.pageX - startX;
      if (Math.abs(dx) > 3) hasDragged = true;
      strip.scrollLeft = scrollStart - dx;
    });

    strip.addEventListener('mouseup', function () {
      isDown = false;
      strip.style.cursor = 'grab';
      strip.style.scrollBehavior = '';
    });

    strip.addEventListener('mouseleave', function () {
      if (isDown) {
        isDown = false;
        strip.style.cursor = 'grab';
        strip.style.scrollBehavior = '';
      }
    });

    // Prevent click on cards after a drag
    strip.addEventListener('click', function (e) {
      if (hasDragged) {
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);
  }

  // ─── 3D Tilt ───

  function bind3DTilt() {
    var showcase = els.showcase;
    var frame = els.showcaseFrame;
    if (!showcase || !frame) return;

    _tiltMove = function (e) {
      var rect = frame.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      frame.style.transform = 'rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 4) + 'deg)';
    };
    _tiltLeave = function () {
      frame.style.transform = 'rotateY(0) rotateX(0)';
    };
    showcase.addEventListener('mousemove', _tiltMove);
    showcase.addEventListener('mouseleave', _tiltLeave);
  }

  // ─── Navigation ───

  function bindNavigation() {
    var prevBtn = id('prevBtn');
    var nextBtn = id('nextBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        goPrev();
        pauseAuto();
        scheduleResume();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        goNext();
        pauseAuto();
        scheduleResume();
      });
    }

    if (els.showcase) {
      els.showcase.addEventListener('mouseenter', function () {
        if (userStartedPlay) return; // don't pause auto-play slideshow on hover
        pauseAuto();
      });
      els.showcase.addEventListener('mouseleave', function () { scheduleResume(); });
    }
  }

  // ─── Caption ───

  function updateCaption() {
    if (els.capTitle) els.capTitle.textContent = images[cur].caption;
    if (els.capSub) els.capSub.textContent = images[cur].sub || '';
    if (els.capCount) els.capCount.textContent = (cur + 1) + ' / ' + images.length;
  }

  // ─── Navigation ───

  function goTo(i) {
    if (i === cur) return;

    // Deactivate old
    if (lazyLoad) {
      var oldEl = getLazyImg(cur);
      if (oldEl) oldEl.classList.remove('active');
    } else if (showcaseImgs && showcaseImgs[cur]) {
      showcaseImgs[cur].classList.remove('active');
    }
    if (thumbCards && thumbCards[cur]) {
      thumbCards[cur].classList.remove('active');
    }

    cur = i;

    // Lazy: ensure images around new cur are loaded
    if (lazyLoad) {
      loadLazyRange(cur);
      var newEl = getLazyImg(cur);
      if (newEl) newEl.classList.add('active');
    } else if (showcaseImgs && showcaseImgs[cur]) {
      showcaseImgs[cur].classList.add('active');
    }

    if (thumbCards && thumbCards[cur]) {
      thumbCards[cur].classList.add('active');
      thumbCards[cur].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      // Ensure lazy thumb image is loaded
      var thumbImg = thumbCards[cur].querySelector('img');
      if (thumbImg && thumbImg.dataset.src && !thumbImg.src) {
        thumbImg.src = thumbImg.dataset.src;
      }
    }

    updateCaption();
    updateFrameSize(cur);
    resetProgress();
  }

  function goNext() { goTo((cur + 1) % images.length); }
  function goPrev() { goTo((cur - 1 + images.length) % images.length); }

  // ─── Auto-rotation ───

  function startAuto() {
    stopAuto();
    paused = false;
    progressStart = Date.now();
    autoTimer = setTimeout(function () { goNext(); startAuto(); }, INTERVAL);
    animateRing();
  }

  function stopAuto() {
    clearTimeout(autoTimer);
    autoTimer = null;
    cancelAnimationFrame(progressRAF);
    if (els.ringFill) els.ringFill.style.strokeDashoffset = CIRCUM;
  }

  function pauseAuto() {
    paused = true;
    stopAuto();
  }

  function scheduleResume() {
    if (!userStartedPlay) return; // only auto-resume if user started playback
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(function () { startAuto(); }, RESUME_DELAY);
  }

  function resetProgress() { progressStart = Date.now(); }

  function animateRing() {
    function tick() {
      if (paused) return;
      var pct = Math.min((Date.now() - progressStart) / INTERVAL, 1);
      if (els.ringFill) els.ringFill.style.strokeDashoffset = CIRCUM * (1 - pct);
      if (pct < 1) progressRAF = requestAnimationFrame(tick);
    }
    progressRAF = requestAnimationFrame(tick);
  }

  // ─── Lightbox ───

  function bindLightbox() {
    var frame = els.showcaseFrame;
    var lightbox = els.lightbox;

    if (frame) {
      frame.addEventListener('click', function (e) {
        if (e.target.closest('.fg-nav-btn')) return;
        openLB(cur);
      });
    }

    var lbClose = id('lbClose');
    var lbPrev = id('lbPrev');
    var lbNext = id('lbNext');

    if (lbClose) lbClose.addEventListener('click', function () { closeLB(); });
    if (lightbox) lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLB(); });
    if (lbPrev) lbPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      cur = (cur - 1 + images.length) % images.length;
      updateLB();
    });
    if (lbNext) lbNext.addEventListener('click', function (e) {
      e.stopPropagation();
      cur = (cur + 1) % images.length;
      updateLB();
    });

    // Click anywhere on the lightbox image or its wrapper to advance
    var lbImgWrap = lightbox ? lightbox.querySelector('.fg-lb-img-wrap') : null;
    if (lbImgWrap) {
      lbImgWrap.style.cursor = 'pointer';
      if (_lbWrapClick) lbImgWrap.removeEventListener('click', _lbWrapClick);
      _lbWrapClick = function (e) {
        e.stopPropagation();
        cur = (cur + 1) % images.length;
        updateLB();
      };
      lbImgWrap.addEventListener('click', _lbWrapClick);
    }
  }

  function openLB(i) {
    lbOpen = true;
    if (typeof FanPoints !== 'undefined') FanPoints.award('activity:gallery-lightbox', 15, 'Opened Lightbox');
    cur = i;
    updateLB();
    if (els.lightbox) els.lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    pauseAuto();
  }

  function closeLB() {
    lbOpen = false;
    if (els.lightbox) els.lightbox.classList.remove('open');
    document.body.style.overflow = '';
    scheduleResume();
  }

  function updateLB() {
    if (els.lbImg) {
      els.lbImg.src = images[cur].src;
      els.lbImg.alt = images[cur].caption;
    }
    if (els.lbTitle) els.lbTitle.textContent = images[cur].caption;
    if (els.lbCount) els.lbCount.textContent = (cur + 1) + ' of ' + images.length;

    // Update showcase active state
    if (lazyLoad) {
      lazyImgMap.forEach(function (el, idx) {
        el.classList.toggle('active', idx === cur);
      });
      loadLazyRange(cur);
    } else if (showcaseImgs) {
      showcaseImgs.forEach(function (el, i) {
        el.classList.toggle('active', i === cur);
      });
    }
    if (thumbCards) {
      thumbCards.forEach(function (el, i) {
        el.classList.toggle('active', i === cur);
      });
    }
    updateCaption();
  }

  // ─── Keyboard ───

  function bindKeyboard() {
    _keyHandler = function (e) {
      if (lbOpen) {
        if (e.key === 'Escape') closeLB();
        if (e.key === 'ArrowLeft') { cur = (cur - 1 + images.length) % images.length; updateLB(); }
        if (e.key === 'ArrowRight') { cur = (cur + 1) % images.length; updateLB(); }
      } else if (id('showcase')) {
        // Only respond if this gallery's showcase is in the viewport
        var sc = id('showcase');
        if (sc) {
          var rect = sc.getBoundingClientRect();
          var inView = rect.top < window.innerHeight && rect.bottom > 0;
          if (inView) {
            if (e.key === 'ArrowLeft') { goPrev(); pauseAuto(); scheduleResume(); }
            if (e.key === 'ArrowRight') { goNext(); pauseAuto(); scheduleResume(); }
          }
        }
      }
    };
    document.addEventListener('keydown', _keyHandler);
  }

  // ─── Touch / Swipe ───

  function bindTouch() {
    var frame = els.showcaseFrame;
    if (!frame) return;

    var tsX = 0;
    frame.addEventListener('touchstart', function (e) {
      tsX = e.changedTouches[0].screenX;
      pauseAuto();
    }, { passive: true });
    frame.addEventListener('touchend', function (e) {
      var diff = tsX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
      scheduleResume();
    }, { passive: true });
  }

  // ─── Playback Control (user-initiated) ───

  function startPlayback() {
    userStartedPlay = true;
    paused = false;
    startAuto();
    var playBtn = document.getElementById(prefix + '-playBtn');
    if (playBtn) playBtn.classList.add('hidden');
  }

  function stopPlayback() {
    pauseAuto();
    clearTimeout(resumeTimer);
    userStartedPlay = false;
    var playBtn = document.getElementById(prefix + '-playBtn');
    if (playBtn) playBtn.classList.remove('hidden');
  }

  function isPlaying() {
    return userStartedPlay && !paused && autoTimer !== null;
  }

  // ─── Public API ───

  return {
    init: init,
    destroy: destroy,
    reload: reload,
    startPlayback: startPlayback,
    stopPlayback: stopPlayback,
    isPlaying: isPlaying,
    get prefix() { return prefix; },
    get images() { return images; },
    get initialized() { return initialized; },
  };
}

// ─── Image Data ───

var artistImages = [
  { src: 'images/artist/LAYoungPink.JPG',   caption: 'L.A. Young Pink',             sub: 'Studio Portrait' },
  { src: 'images/artist/LAPhillysLive.jpg',  caption: 'L.A. Young Live Performance', sub: 'On Stage' },
  { src: 'images/artist/LAPopSinger.jpeg',   caption: 'L.A. Young Pop Singer',       sub: 'Editorial Shoot' },
  { src: 'images/artist/LARockAndRoll.jpeg', caption: 'L.A. Young Rock & Roll',      sub: 'Rock & Roll Vibes' },
  { src: 'images/artist/LAFunkyChild.jpg',   caption: 'L.A. Young Funky Child',      sub: 'Funky Fresh' },
  { src: 'images/artist/LASoulSista.jpg',    caption: 'L.A. Young Soul Sista',       sub: 'Soul Portrait' },
  { src: 'images/artist/LAAfro.jpg',         caption: 'L.A. Young Afro',             sub: 'Natural Beauty' },
  { src: 'images/artist/LASoulLife.png',     caption: 'L.A. Young Soul Life',        sub: 'Living Soul' },
  { src: 'images/artist/LAGreenDress.JPG',   caption: 'L.A. Young Green Dress',      sub: 'Emerald Elegance' },
];

var eventImages = [
  // 62 event photos (burst duplicates removed, renumbered sequentially)
  { src: 'images/gallery/event001.jpg', caption: 'BackStage photo 1',  sub: 'Live Performance' },
  { src: 'images/gallery/event002.jpg', caption: 'BackStage photo 2',  sub: 'Live Performance' },
  { src: 'images/gallery/event003.jpg', caption: 'BackStage photo 3',  sub: 'Live Performance' },
  { src: 'images/gallery/event004.jpg', caption: 'BackStage photo 4',  sub: 'Live Performance' },
  { src: 'images/gallery/event005.jpg', caption: 'BackStage photo 5',  sub: 'Live Performance' },
  { src: 'images/gallery/event006.jpg', caption: 'BackStage photo 6',  sub: 'Live Performance' },
  { src: 'images/gallery/event007.jpg', caption: 'BackStage photo 7',  sub: 'Live Performance' },
  { src: 'images/gallery/event008.jpg', caption: 'BackStage photo 8',  sub: 'Live Performance' },
  { src: 'images/gallery/event009.jpg', caption: 'BackStage photo 9',  sub: 'Live Performance' },
  { src: 'images/gallery/event010.jpg', caption: 'BackStage photo 10', sub: 'Live Performance' },
  { src: 'images/gallery/event011.jpg', caption: 'BackStage photo 11', sub: 'Live Performance' },
  { src: 'images/gallery/event012.jpg', caption: 'BackStage photo 12', sub: 'Live Performance' },
  { src: 'images/gallery/event013.jpg', caption: 'BackStage photo 13', sub: 'Live Performance' },
  { src: 'images/gallery/event014.jpg', caption: 'BackStage photo 14', sub: 'Live Performance' },
  { src: 'images/gallery/event015.jpg', caption: 'BackStage photo 15', sub: 'Live Performance' },
  { src: 'images/gallery/event016.jpg', caption: 'BackStage photo 16', sub: 'Live Performance' },
  { src: 'images/gallery/event017.jpg', caption: 'BackStage photo 17', sub: 'Live Performance' },
  { src: 'images/gallery/event018.jpg', caption: 'BackStage photo 18', sub: 'Live Performance' },
  { src: 'images/gallery/event019.jpg', caption: 'BackStage photo 19', sub: 'Live Performance' },
  { src: 'images/gallery/event020.jpg', caption: 'BackStage photo 20', sub: 'Live Performance' },
  { src: 'images/gallery/event021.jpg', caption: 'BackStage photo 21', sub: 'Live Performance' },
  { src: 'images/gallery/event022.jpg', caption: 'BackStage photo 22', sub: 'Live Performance' },
  { src: 'images/gallery/event023.jpg', caption: 'BackStage photo 23', sub: 'Live Performance' },
  { src: 'images/gallery/event024.jpg', caption: 'BackStage photo 24', sub: 'Live Performance' },
  { src: 'images/gallery/event025.jpg', caption: 'BackStage photo 25', sub: 'Live Performance' },
  { src: 'images/gallery/event026.jpg', caption: 'BackStage photo 26', sub: 'Live Performance' },
  { src: 'images/gallery/event027.jpg', caption: 'BackStage photo 27', sub: 'Live Performance' },
  { src: 'images/gallery/event028.jpg', caption: 'BackStage photo 28', sub: 'Live Performance' },
  { src: 'images/gallery/event029.jpg', caption: 'BackStage photo 29', sub: 'Live Performance' },
  { src: 'images/gallery/event030.jpg', caption: 'BackStage photo 30', sub: 'Live Performance' },
  { src: 'images/gallery/event031.jpg', caption: 'BackStage photo 31', sub: 'Live Performance' },
  { src: 'images/gallery/event032.jpg', caption: 'BackStage photo 32', sub: 'Live Performance' },
  { src: 'images/gallery/event033.jpg', caption: 'BackStage photo 33', sub: 'Live Performance' },
  { src: 'images/gallery/event034.jpg', caption: 'BackStage photo 34', sub: 'Live Performance' },
  { src: 'images/gallery/event035.jpg', caption: 'BackStage photo 35', sub: 'Live Performance' },
  { src: 'images/gallery/event036.jpg', caption: 'BackStage photo 36', sub: 'Live Performance' },
  { src: 'images/gallery/event037.jpg', caption: 'BackStage photo 37', sub: 'Live Performance' },
  { src: 'images/gallery/event038.jpg', caption: 'BackStage photo 38', sub: 'Live Performance' },
  { src: 'images/gallery/event039.jpg', caption: 'BackStage photo 39', sub: 'Live Performance' },
  { src: 'images/gallery/event040.jpg', caption: 'BackStage photo 40', sub: 'Live Performance' },
  { src: 'images/gallery/event041.jpg', caption: 'BackStage photo 41', sub: 'Live Performance' },
  { src: 'images/gallery/event042.jpg', caption: 'BackStage photo 42', sub: 'Live Performance' },
  { src: 'images/gallery/event043.jpg', caption: 'BackStage photo 43', sub: 'Live Performance' },
  { src: 'images/gallery/event044.jpg', caption: 'BackStage photo 44', sub: 'Live Performance' },
  { src: 'images/gallery/event045.jpg', caption: 'BackStage photo 45', sub: 'Live Performance' },
  { src: 'images/gallery/event046.jpg', caption: 'BackStage photo 46', sub: 'Live Performance' },
  { src: 'images/gallery/event047.jpg', caption: 'BackStage photo 47', sub: 'Live Performance' },
  { src: 'images/gallery/event048.jpg', caption: 'BackStage photo 48', sub: 'Live Performance' },
  { src: 'images/gallery/event049.jpg', caption: 'BackStage photo 49', sub: 'Live Performance' },
  { src: 'images/gallery/event050.jpg', caption: 'BackStage photo 50', sub: 'Live Performance' },
  { src: 'images/gallery/event051.jpg', caption: 'BackStage photo 51', sub: 'Live Performance' },
  { src: 'images/gallery/event052.jpg', caption: 'BackStage photo 52', sub: 'Live Performance' },
  { src: 'images/gallery/event053.jpg', caption: 'BackStage photo 53', sub: 'Live Performance' },
  { src: 'images/gallery/event054.jpg', caption: 'BackStage photo 54', sub: 'Live Performance' },
  { src: 'images/gallery/event055.jpg', caption: 'BackStage photo 55', sub: 'Live Performance' },
  { src: 'images/gallery/event056.jpg', caption: 'BackStage photo 56', sub: 'Live Performance' },
  { src: 'images/gallery/event057.jpg', caption: 'BackStage photo 57', sub: 'Live Performance' },
  { src: 'images/gallery/event058.jpg', caption: 'BackStage photo 58', sub: 'Live Performance' },
  { src: 'images/gallery/event059.jpg', caption: 'BackStage photo 59', sub: 'Live Performance' },
  { src: 'images/gallery/event060.jpg', caption: 'BackStage photo 60', sub: 'Live Performance' },
  { src: 'images/gallery/event061.jpg', caption: 'BackStage photo 61', sub: 'Live Performance' },
  { src: 'images/gallery/event062.jpg', caption: 'BackStage photo 62', sub: 'Live Performance' },
];

// ─── Create Instances ───

var Gallery = createGallery({ prefix: 'fg', images: artistImages, particleCount: 25 });
var EventGallery = createGallery({ prefix: 'eg', images: eventImages, particleCount: 15, lazyLoad: true });

// Expose globally
window.Gallery = Gallery;
window.EventGallery = EventGallery;
window.createGallery = createGallery;

// ─── Gallery Coordinator ───
// Manages mutual exclusion, scroll-based activation, and play buttons

var GalleryCoordinator = (function () {
  'use strict';

  var galleries = [
    { instance: Gallery, panelId: 'fg-panel', playBtnId: 'fg-playBtn' },
    { instance: EventGallery, panelId: 'eg-panel', playBtnId: 'eg-playBtn' },
  ];
  var activeIndex = 0;
  var observer = null;
  var _initialized = false;

  function init() {
    if (_initialized) destroy();
    setupIntersectionObserver();
    setupPlayButtons();
    setActive(0);
    _initialized = true;
    console.log('🎛️ GalleryCoordinator initialized');
  }

  function setupIntersectionObserver() {
    // The scroll parent is the #gallery section (overflow-y: auto)
    var scrollParent = document.getElementById('gallery');
    if (!scrollParent) return;

    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            var idx = -1;
            for (var i = 0; i < galleries.length; i++) {
              if (galleries[i].panelId === entry.target.id) { idx = i; break; }
            }
            if (idx !== -1 && idx !== activeIndex) {
              setActive(idx);
            }
          }
        });
      },
      {
        root: scrollParent,
        threshold: [0.3, 0.5],
      }
    );

    galleries.forEach(function (g) {
      var panel = document.getElementById(g.panelId);
      if (panel) observer.observe(panel);
    });
  }

  function setActive(index) {
    activeIndex = index;

    galleries.forEach(function (g, i) {
      var panel = document.getElementById(g.panelId);
      if (!panel) return;

      if (i === index) {
        panel.classList.add('active');
        panel.classList.remove('inactive');
      } else {
        panel.classList.remove('active');
        panel.classList.add('inactive');
        // Stop the other gallery's auto-play
        if (g.instance.isPlaying()) {
          g.instance.stopPlayback();
        }
      }
    });
  }

  function setupPlayButtons() {
    galleries.forEach(function (g, i) {
      var btn = document.getElementById(g.playBtnId);
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          // Stop any other playing gallery
          galleries.forEach(function (other, j) {
            if (j !== i && other.instance.isPlaying()) {
              other.instance.stopPlayback();
            }
          });
          // Start this gallery
          g.instance.startPlayback();
        });
      }
    });
  }

  function destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    _initialized = false;
  }

  return {
    init: init,
    destroy: destroy,
    setActive: setActive,
  };
})();

window.GalleryCoordinator = GalleryCoordinator;
