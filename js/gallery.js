// js/gallery.js

/**
 * Gallery Module — Futuristic Showcase
 * 3D tilt, auto-rotation, holographic thumbnails, cinematic lightbox
 */

const Gallery = {
  initialized: false,
  cur: 0,
  autoTimer: null,
  progressRAF: null,
  progressStart: 0,
  paused: false,
  resumeTimer: null,
  lbOpen: false,
  INTERVAL: 4000,
  RESUME: 6000,
  CIRCUM: 2 * Math.PI * 18, // ~113
  MAX_HEIGHT: 620,

  images: [
    { src: 'images/artist/LAYoungPink.JPG',   caption: 'L.A. Young Pink',             sub: 'Studio Portrait' },
    { src: 'images/artist/LAPhillysLive.JPG',  caption: 'L.A. Young Live Performance', sub: 'On Stage' },
    { src: 'images/artist/LAPopSinger.jpeg',   caption: 'L.A. Young Pop Singer',       sub: 'Editorial Shoot' },
    { src: 'images/artist/LARockAndRoll.jpeg', caption: 'L.A. Young Rock & Roll',      sub: 'Rock & Roll Vibes' },
    { src: 'images/artist/LAFunkyChild.JPG',   caption: 'L.A. Young Funky Child',      sub: 'Funky Fresh' },
    { src: 'images/artist/LASoulSista.JPG',    caption: 'L.A. Young Soul Sista',       sub: 'Soul Portrait' },
    { src: 'images/artist/LAAfro.jpg',         caption: 'L.A. Young Afro',             sub: 'Natural Beauty' },
    { src: 'images/artist/LASoulLife.PNG',     caption: 'L.A. Young Soul Life',        sub: 'Living Soul' },
    { src: 'images/artist/LAGreenDress.JPG',   caption: 'L.A. Young Green Dress',      sub: 'Emerald Elegance' },
  ],

  // DOM refs (set during init)
  els: {},

  /**
   * Initialize gallery
   */
  init() {
    console.log('🖼️ Initializing Futuristic Gallery...');

    // Check if the futuristic gallery HTML exists
    const showcaseFrame = document.getElementById('fg-showcaseFrame');
    if (!showcaseFrame) {
      console.log('Futuristic gallery elements not found, skipping...');
      return;
    }

    // Clean up any previous instance
    this.destroy();

    // Cache DOM elements
    this.els = {
      showcaseFrame: showcaseFrame,
      showcase: document.getElementById('fg-showcase'),
      capTitle: document.getElementById('fg-capTitle'),
      capSub: document.getElementById('fg-capSub'),
      capCount: document.getElementById('fg-capCount'),
      ringFill: document.getElementById('fg-ringFill'),
      thumbStrip: document.getElementById('fg-thumbStrip'),
      lightbox: document.getElementById('fg-lightbox'),
      lbImg: document.getElementById('fg-lbImg'),
      lbTitle: document.getElementById('fg-lbTitle'),
      lbCount: document.getElementById('fg-lbCount'),
    };

    // Reset state
    this.cur = 0;
    this.paused = false;
    this.lbOpen = false;

    // Build the gallery
    this.createParticles();
    this.createProgressRing();
    this.preloadImages();
    this.buildThumbnails();
    this.bind3DTilt();
    this.bindNavigation();
    this.bindLightbox();
    this.bindKeyboard();
    this.bindTouch();
    this.updateCaption();
    this.startAuto();

    this.initialized = true;
    console.log('✅ Futuristic Gallery initialized with', this.images.length, 'images');
  },

  /**
   * Destroy / clean up (for SPA re-init)
   */
  destroy() {
    this.stopAuto();
    clearTimeout(this.resumeTimer);
    this.initialized = false;
    this._keyHandler && document.removeEventListener('keydown', this._keyHandler);
  },

  /**
   * Create floating gold particles
   */
  createParticles() {
    const container = document.getElementById('fg-particles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'fg-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = p.style.height = (1.5 + Math.random() * 3) + 'px';
      p.style.animationDuration = (8 + Math.random() * 15) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.opacity = 0.2 + Math.random() * 0.5;
      container.appendChild(p);
    }
  },

  /**
   * Create progress ring SVG via DOM API (avoids innerHTML SVG parsing issues)
   */
  createProgressRing() {
    const wrap = document.getElementById('fg-progressRingWrap');
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
    fill.setAttribute('id', 'fg-ringFill');
    fill.setAttribute('cx', '21');
    fill.setAttribute('cy', '21');
    fill.setAttribute('r', '18');
    svg.appendChild(fill);
    wrap.appendChild(svg);
    // Update cached ref
    this.els.ringFill = fill;
  },

  /**
   * Preload images & detect orientation
   */
  preloadImages() {
    const frame = this.els.showcaseFrame;
    // Remove any old showcase images
    frame.querySelectorAll('.fg-showcase-img').forEach(el => el.remove());

    this.images.forEach((img, i) => {
      const el = document.createElement('img');
      el.className = 'fg-showcase-img' + (i === 0 ? ' active' : '');
      el.src = img.src;
      el.alt = img.caption;
      el.draggable = false;
      el.onload = () => {
        img.w = el.naturalWidth;
        img.h = el.naturalHeight;
        img.ratio = el.naturalWidth / el.naturalHeight;
        if (i === 0) this.updateFrameSize(0);
      };
      frame.insertBefore(el, frame.querySelector('.fg-showcase-caption'));
    });
    this.showcaseImgs = frame.querySelectorAll('.fg-showcase-img');
  },

  /**
   * Adapt frame to image orientation
   */
  updateFrameSize(index) {
    const img = this.images[index];
    if (!img || !img.ratio) return;
    const ratio = img.ratio;
    const frame = this.els.showcaseFrame;

    frame.style.aspectRatio = ratio.toFixed(4);

    if (ratio < 1) {
      const widthForMaxHeight = this.MAX_HEIGHT * ratio;
      frame.style.maxWidth = Math.max(Math.min(widthForMaxHeight, 500), 320) + 'px';
    } else if (ratio <= 1.15) {
      frame.style.maxWidth = '620px';
    } else {
      frame.style.maxWidth = '100%';
    }
  },

  /**
   * Build holographic thumbnail cards
   */
  buildThumbnails() {
    const strip = this.els.thumbStrip;
    if (!strip) return;
    strip.innerHTML = '';

    this.images.forEach((img, i) => {
      const card = document.createElement('div');
      card.className = 'fg-thumb-card' + (i === 0 ? ' active' : '');
      card.style.animationDelay = (0.5 + i * 0.07) + 's';
      card.innerHTML = `
        <img src="${img.src}" alt="${img.caption}" draggable="false">
        <div class="fg-holo-shine"></div>
        <div class="fg-thumb-label">${img.caption.replace('L.A. Young ', '')}</div>
      `;
      card.addEventListener('click', () => {
        this.goTo(i);
        this.pauseAuto();
        this.scheduleResume();
      });
      strip.appendChild(card);
    });
    this.thumbCards = strip.querySelectorAll('.fg-thumb-card');
  },

  /**
   * 3D tilt on showcase
   */
  bind3DTilt() {
    const showcase = this.els.showcase;
    const frame = this.els.showcaseFrame;
    if (!showcase || !frame) return;

    this._tiltMove = (e) => {
      const rect = frame.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      frame.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 4}deg)`;
    };
    this._tiltLeave = () => {
      frame.style.transform = 'rotateY(0) rotateX(0)';
    };
    showcase.addEventListener('mousemove', this._tiltMove);
    showcase.addEventListener('mouseleave', this._tiltLeave);
  },

  /**
   * Navigation arrows
   */
  bindNavigation() {
    const prevBtn = document.getElementById('fg-prevBtn');
    const nextBtn = document.getElementById('fg-nextBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goPrev();
        this.pauseAuto();
        this.scheduleResume();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goNext();
        this.pauseAuto();
        this.scheduleResume();
      });
    }

    // Pause on hover
    if (this.els.showcase) {
      this.els.showcase.addEventListener('mouseenter', () => this.pauseAuto());
      this.els.showcase.addEventListener('mouseleave', () => this.scheduleResume());
    }
  },

  /**
   * Update caption text
   */
  updateCaption() {
    if (this.els.capTitle) this.els.capTitle.textContent = this.images[this.cur].caption;
    if (this.els.capSub) this.els.capSub.textContent = this.images[this.cur].sub;
    if (this.els.capCount) this.els.capCount.textContent = `${this.cur + 1} / ${this.images.length}`;
  },

  /**
   * Navigate to specific image
   */
  goTo(i) {
    if (i === this.cur) return;
    if (this.showcaseImgs && this.showcaseImgs[this.cur]) {
      this.showcaseImgs[this.cur].classList.remove('active');
    }
    if (this.thumbCards && this.thumbCards[this.cur]) {
      this.thumbCards[this.cur].classList.remove('active');
    }

    this.cur = i;

    if (this.showcaseImgs && this.showcaseImgs[this.cur]) {
      this.showcaseImgs[this.cur].classList.add('active');
    }
    if (this.thumbCards && this.thumbCards[this.cur]) {
      this.thumbCards[this.cur].classList.add('active');
      this.thumbCards[this.cur].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    this.updateCaption();
    this.updateFrameSize(this.cur);
    this.resetProgress();
  },

  goNext() { this.goTo((this.cur + 1) % this.images.length); },
  goPrev() { this.goTo((this.cur - 1 + this.images.length) % this.images.length); },

  /**
   * Auto-rotation with progress ring
   */
  startAuto() {
    this.stopAuto();
    this.paused = false;
    this.progressStart = Date.now();
    this.autoTimer = setTimeout(() => { this.goNext(); this.startAuto(); }, this.INTERVAL);
    this.animateRing();
  },

  stopAuto() {
    clearTimeout(this.autoTimer);
    this.autoTimer = null;
    cancelAnimationFrame(this.progressRAF);
    if (this.els.ringFill) this.els.ringFill.style.strokeDashoffset = this.CIRCUM;
  },

  pauseAuto() {
    this.paused = true;
    this.stopAuto();
  },

  scheduleResume() {
    clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => this.startAuto(), this.RESUME);
  },

  resetProgress() { this.progressStart = Date.now(); },

  animateRing() {
    const self = this;
    function tick() {
      if (self.paused) return;
      const pct = Math.min((Date.now() - self.progressStart) / self.INTERVAL, 1);
      if (self.els.ringFill) self.els.ringFill.style.strokeDashoffset = self.CIRCUM * (1 - pct);
      if (pct < 1) self.progressRAF = requestAnimationFrame(tick);
    }
    self.progressRAF = requestAnimationFrame(tick);
  },

  /**
   * Lightbox
   */
  bindLightbox() {
    const frame = this.els.showcaseFrame;
    const lightbox = this.els.lightbox;

    if (frame) {
      frame.addEventListener('click', (e) => {
        if (e.target.closest('.fg-nav-btn')) return;
        this.openLB(this.cur);
      });
    }

    const lbClose = document.getElementById('fg-lbClose');
    const lbPrev = document.getElementById('fg-lbPrev');
    const lbNext = document.getElementById('fg-lbNext');

    if (lbClose) lbClose.addEventListener('click', () => this.closeLB());
    if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) this.closeLB(); });
    if (lbPrev) lbPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cur = (this.cur - 1 + this.images.length) % this.images.length;
      this.updateLB();
    });
    if (lbNext) lbNext.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cur = (this.cur + 1) % this.images.length;
      this.updateLB();
    });
  },

  openLB(i) {
    this.lbOpen = true;
    this.cur = i;
    this.updateLB();
    if (this.els.lightbox) this.els.lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.pauseAuto();
  },

  closeLB() {
    this.lbOpen = false;
    if (this.els.lightbox) this.els.lightbox.classList.remove('open');
    document.body.style.overflow = '';
    this.scheduleResume();
  },

  updateLB() {
    if (this.els.lbImg) {
      this.els.lbImg.src = this.images[this.cur].src;
      this.els.lbImg.alt = this.images[this.cur].caption;
    }
    if (this.els.lbTitle) this.els.lbTitle.textContent = this.images[this.cur].caption;
    if (this.els.lbCount) this.els.lbCount.textContent = `${this.cur + 1} of ${this.images.length}`;
    if (this.showcaseImgs) this.showcaseImgs.forEach((el, i) => el.classList.toggle('active', i === this.cur));
    if (this.thumbCards) this.thumbCards.forEach((el, i) => el.classList.toggle('active', i === this.cur));
    this.updateCaption();
  },

  /**
   * Keyboard navigation
   */
  bindKeyboard() {
    this._keyHandler = (e) => {
      if (this.lbOpen) {
        if (e.key === 'Escape') this.closeLB();
        if (e.key === 'ArrowLeft') { this.cur = (this.cur - 1 + this.images.length) % this.images.length; this.updateLB(); }
        if (e.key === 'ArrowRight') { this.cur = (this.cur + 1) % this.images.length; this.updateLB(); }
      } else if (document.getElementById('fg-showcase')) {
        if (e.key === 'ArrowLeft') { this.goPrev(); this.pauseAuto(); this.scheduleResume(); }
        if (e.key === 'ArrowRight') { this.goNext(); this.pauseAuto(); this.scheduleResume(); }
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  },

  /**
   * Touch / Swipe
   */
  bindTouch() {
    const frame = this.els.showcaseFrame;
    if (!frame) return;

    let tsX = 0;
    frame.addEventListener('touchstart', (e) => {
      tsX = e.changedTouches[0].screenX;
      this.pauseAuto();
    }, { passive: true });
    frame.addEventListener('touchend', (e) => {
      const diff = tsX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) { diff > 0 ? this.goNext() : this.goPrev(); }
      this.scheduleResume();
    }, { passive: true });
  },

  /**
   * Reload gallery (for SPA re-navigation)
   */
  reload() {
    console.log('🔄 Reloading gallery...');
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
