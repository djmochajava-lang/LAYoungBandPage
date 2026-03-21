// js/mobile-gallery.js

/**
 * Mobile Gallery — Social-media-inspired gallery
 *
 * Top: Stories row (Facebook-style horizontal squares, tap to view)
 * Below: Social feed (full-width images, vertical scroll, comments under each)
 *
 * Uses global artistImages[] and eventImages[] from gallery.js
 */

(function () {
  'use strict';

  var BATCH_SIZE = 6;
  var feedLoaded = 0;
  var feedObserver = null;

  function init() {
    var storiesRow = document.getElementById('mg-stories-row');
    if (!storiesRow) return;
    if (typeof artistImages === 'undefined' || typeof eventImages === 'undefined') return;

    buildStories();
    buildFeed();
    setupStoryViewer();
    setupFeedViewer();
    console.log('📱 MobileGallery initialized');
  }

  // ─── STORIES ROW (horizontal squares) ───

  function buildStories() {
    var row = document.getElementById('mg-stories-row');
    if (!row) return;

    // Build single set
    var singleSet = '';
    for (var i = 0; i < artistImages.length; i++) {
      var img = artistImages[i];
      singleSet += '<div class="mg-story-thumb" data-index="' + i + '">' +
        '<img src="' + img.src + '" alt="' + img.caption + '">' +
        '<span class="mg-story-label">' + img.sub + '</span>' +
      '</div>';
    }

    // Repeat 5x so the row feels endless
    row.innerHTML = singleSet + singleSet + singleSet + singleSet + singleSet;

    // Ensure first reel is at top-left
    row.scrollLeft = 0;

    // When user scrolls near the end, append more copies
    row.addEventListener('scroll', function () {
      if (row.scrollLeft > row.scrollWidth - row.clientWidth - 200) {
        row.insertAdjacentHTML('beforeend', singleSet + singleSet);
      }
    });

    // Tap to open story viewer
    row.addEventListener('click', function (e) {
      var thumb = e.target.closest('.mg-story-thumb');
      if (thumb) {
        var idx = parseInt(thumb.getAttribute('data-index'), 10);
        openStoryViewer(idx);
      }
    });
  }

  // ─── STORY VIEWER (full-screen overlay) ───

  var svTimer = null;
  var svIndex = 0;

  var svTouchStartX = 0;
  var svTouchStartY = 0;

  function setupStoryViewer() {
    var viewer = document.getElementById('mg-story-viewer');
    if (!viewer) return;

    document.getElementById('mg-sv-close').addEventListener('click', closeStoryViewer);

    // Swipe left/right to navigate
    viewer.addEventListener('touchstart', function (e) {
      svTouchStartX = e.touches[0].clientX;
      svTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    viewer.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - svTouchStartX;
      var dy = e.changedTouches[0].clientY - svTouchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        clearTimeout(svTimer);
        if (dx < 0) navigateStory(1);   // swipe left = next
        else navigateStory(-1);           // swipe right = prev
      }
    }, { passive: true });

    // Tap anywhere on image = heart
    var svImg = document.getElementById('mg-sv-img');
    svImg.addEventListener('click', function (e) {
      showStoryHeart(e.clientX, e.clientY);
    });
  }

  function showStoryHeart(x, y) {
    var viewer = document.getElementById('mg-story-viewer');
    var heart = document.createElement('div');
    heart.className = 'mg-sv-heart';
    heart.textContent = '\u2764';
    heart.style.left = x + 'px';
    heart.style.top = y + 'px';
    viewer.appendChild(heart);
    setTimeout(function () { heart.remove(); }, 800);
  }

  function openStoryViewer(index) {
    svIndex = index;
    var viewer = document.getElementById('mg-story-viewer');
    viewer.classList.add('open');
    document.body.style.overflow = 'hidden';
    showStory();
    startStoryTimer();
  }

  function closeStoryViewer() {
    clearTimeout(svTimer);
    var viewer = document.getElementById('mg-story-viewer');
    viewer.classList.remove('open');
    document.body.style.overflow = '';
  }

  function navigateStory(dir) {
    var svImg = document.getElementById('mg-sv-img');
    var exitClass = dir > 0 ? 'mg-sv-exit-left' : 'mg-sv-exit-right';
    var enterClass = dir > 0 ? 'mg-sv-enter-right' : 'mg-sv-enter-left';

    // Exit animation
    svImg.classList.add(exitClass);

    setTimeout(function () {
      svIndex += dir;
      if (svIndex >= artistImages.length) svIndex = 0;
      if (svIndex < 0) svIndex = artistImages.length - 1;

      // Set new image + enter position
      svImg.classList.remove(exitClass);
      svImg.classList.add(enterClass);
      showStory();

      // Trigger enter animation
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          svImg.classList.remove(enterClass);
        });
      });

      startStoryTimer();
    }, 350);
  }

  function showStory() {
    var img = artistImages[svIndex];
    document.getElementById('mg-sv-img').src = img.src;
    document.getElementById('mg-sv-img').alt = img.caption;
    document.getElementById('mg-sv-caption').textContent = img.caption;

    // Update progress bars
    var progressWrap = document.getElementById('mg-sv-progress');
    var html = '';
    for (var i = 0; i < artistImages.length; i++) {
      var cls = 'mg-sv-bar';
      if (i < svIndex) cls += ' viewed';
      if (i === svIndex) cls += ' active';
      html += '<div class="' + cls + '"><div class="mg-sv-bar-fill"></div></div>';
    }
    progressWrap.innerHTML = html;

    // Mark story thumb as viewed
    var thumbs = document.querySelectorAll('.mg-story-thumb');
    if (thumbs[svIndex]) thumbs[svIndex].classList.add('viewed');
  }

  function startStoryTimer() {
    clearTimeout(svTimer);
    svTimer = setTimeout(function () {
      navigateStory(1);
    }, 5000);
  }

  // ─── SOCIAL FEED (full-width images + comments) ───

  function buildFeed() {
    feedLoaded = 0;
    loadMoreFeed();

    var sentinel = document.getElementById('mg-feed-sentinel');
    if (sentinel) {
      feedObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          loadMoreFeed();
        }
      }, { rootMargin: '300px' });
      feedObserver.observe(sentinel);
    }
  }

  function loadMoreFeed() {
    var feed = document.getElementById('mg-feed');
    if (!feed || feedLoaded >= eventImages.length) {
      var sentinel = document.getElementById('mg-feed-sentinel');
      if (sentinel) sentinel.style.display = 'none';
      return;
    }

    var end = Math.min(feedLoaded + BATCH_SIZE, eventImages.length);
    var fragment = document.createDocumentFragment();

    for (var i = feedLoaded; i < end; i++) {
      var img = eventImages[i];
      var post = document.createElement('div');
      post.className = 'mg-post';

      // Post header
      var header = document.createElement('div');
      header.className = 'mg-post-header';
      header.innerHTML = '<span class="mg-post-author">L.A. Young</span>' +
        '<span class="mg-post-label">' + img.sub + '</span>';

      // Image
      var imgWrap = document.createElement('div');
      imgWrap.className = 'mg-post-img';
      var imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.alt = img.caption;
      imgEl.loading = 'lazy';
      imgWrap.appendChild(imgEl);

      // Actions bar (like, comment, share icons)
      var actions = document.createElement('div');
      actions.className = 'mg-post-actions';
      actions.innerHTML =
        '<button class="mg-post-action mg-like-btn" aria-label="Like">' +
          '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="2"/></svg>' +
          '<span class="mg-like-count">0</span>' +
        '</button>' +
        '<button class="mg-post-action mg-comment-toggle" aria-label="Comment">' +
          '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>' +
        '</button>';

      // Caption
      var caption = document.createElement('div');
      caption.className = 'mg-post-caption';
      caption.innerHTML = '<strong>L.A. Young</strong> ' + img.caption;

      // Comment section
      var comments = document.createElement('div');
      comments.className = 'mg-post-comments';
      comments.setAttribute('data-post-index', i);
      comments.innerHTML =
        '<div class="mg-comments-list"></div>' +
        '<div class="mg-comment-input">' +
          '<input type="text" placeholder="Add a comment..." maxlength="200">' +
          '<button class="mg-comment-send">Post</button>' +
        '</div>';

      post.appendChild(header);
      post.appendChild(imgWrap);
      post.appendChild(actions);
      post.appendChild(caption);
      post.appendChild(comments);
      fragment.appendChild(post);
    }

    feed.appendChild(fragment);
    feedLoaded = end;

    // Bind interactions for new posts
    bindPostActions(feed);
  }

  function bindPostActions(feed) {
    // Like buttons
    feed.querySelectorAll('.mg-like-btn').forEach(function (btn) {
      if (btn._mgBound) return;
      btn._mgBound = true;
      btn.addEventListener('click', function () {
        btn.classList.toggle('liked');
        var count = btn.querySelector('.mg-like-count');
        var val = parseInt(count.textContent, 10);
        count.textContent = btn.classList.contains('liked') ? val + 1 : Math.max(0, val - 1);
      });
    });

    // Comment toggle
    feed.querySelectorAll('.mg-comment-toggle').forEach(function (btn) {
      if (btn._mgBound) return;
      btn._mgBound = true;
      btn.addEventListener('click', function () {
        var post = btn.closest('.mg-post');
        var comments = post.querySelector('.mg-post-comments');
        comments.classList.toggle('open');
        if (comments.classList.contains('open')) {
          comments.querySelector('input').focus();
        }
      });
    });

    // Comment submit
    feed.querySelectorAll('.mg-comment-send').forEach(function (btn) {
      if (btn._mgBound) return;
      btn._mgBound = true;
      btn.addEventListener('click', function () {
        var input = btn.previousElementSibling;
        var text = input.value.trim();
        if (!text) return;

        var list = btn.closest('.mg-post-comments').querySelector('.mg-comments-list');
        var comment = document.createElement('div');
        comment.className = 'mg-comment';
        comment.innerHTML = '<strong>Fan</strong> ' + escapeHtml(text);
        list.appendChild(comment);
        input.value = '';
      });

      // Enter key to submit
      var input = btn.previousElementSibling;
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') btn.click();
      });
    });
  }

  function showThumbHeart(thumb) {
    var heart = document.createElement('div');
    heart.className = 'mg-thumb-heart';
    heart.textContent = '\u2764';
    thumb.appendChild(heart);
    setTimeout(function () { heart.remove(); }, 800);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── FEED VIEWER (full-screen swipeable post viewer) ───

  var fvIndex = 0;
  var fvOpen = false;
  var fvTouchStartX = 0;
  var fvTouchStartY = 0;

  function setupFeedViewer() {
    var viewer = document.getElementById('mg-feed-viewer');
    if (!viewer) return;

    document.getElementById('mg-fv-close').addEventListener('click', closeFeedViewer);

    // Like button in viewer
    var likeBtn = document.getElementById('mg-fv-like');
    likeBtn.addEventListener('click', function () {
      likeBtn.classList.toggle('liked');
    });

    // Swipe in viewer
    var slide = document.getElementById('mg-fv-slide');
    slide.addEventListener('touchstart', function (e) {
      fvTouchStartX = e.touches[0].clientX;
      fvTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    slide.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - fvTouchStartX;
      var dy = e.changedTouches[0].clientY - fvTouchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) navigateFeedViewer(1);   // swipe left = next
        else navigateFeedViewer(-1);           // swipe right = prev
      }
    }, { passive: true });

    // Backdrop close
    viewer.addEventListener('click', function (e) {
      if (e.target === viewer) closeFeedViewer();
    });
  }

  function openFeedViewer(index) {
    fvIndex = index;
    fvOpen = true;
    var viewer = document.getElementById('mg-feed-viewer');
    viewer.classList.add('open');
    document.body.style.overflow = 'hidden';
    showFeedSlide('none');
  }

  function closeFeedViewer() {
    fvOpen = false;
    var viewer = document.getElementById('mg-feed-viewer');
    viewer.classList.remove('open');
    document.body.style.overflow = '';
  }

  function navigateFeedViewer(dir) {
    var newIndex = fvIndex + dir;
    if (newIndex < 0 || newIndex >= eventImages.length) return;

    var slideDir = dir > 0 ? 'left' : 'right';
    var slide = document.getElementById('mg-fv-slide');

    // Slide out current
    slide.classList.add('mg-fv-exit-' + slideDir);

    setTimeout(function () {
      fvIndex = newIndex;

      // Ensure more images are loaded if needed
      if (fvIndex >= feedLoaded - 2) loadMoreFeed();

      showFeedSlide(slideDir === 'left' ? 'right' : 'left');
      slide.classList.remove('mg-fv-exit-' + slideDir);
    }, 250);
  }

  function showFeedSlide(enterFrom) {
    var img = eventImages[fvIndex];
    var fvImg = document.getElementById('mg-fv-img');
    var caption = document.getElementById('mg-fv-caption');
    var counter = document.getElementById('mg-fv-counter');
    var slide = document.getElementById('mg-fv-slide');

    fvImg.src = img.src;
    fvImg.alt = img.caption;
    caption.innerHTML = '<strong>L.A. Young</strong> ' + img.caption;
    counter.textContent = (fvIndex + 1) + ' / ' + eventImages.length;

    // Reset like state
    document.getElementById('mg-fv-like').classList.remove('liked');

    // Entrance animation
    if (enterFrom !== 'none') {
      slide.classList.add('mg-fv-enter-' + enterFrom);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          slide.classList.remove('mg-fv-enter-' + enterFrom);
        });
      });
    }
  }

  // ─── Wire up feed image taps to open viewer ───

  function bindFeedImageTaps(feed) {
    feed.querySelectorAll('.mg-post-img').forEach(function (imgWrap) {
      if (imgWrap._fvBound) return;
      imgWrap._fvBound = true;
      imgWrap.addEventListener('click', function () {
        var post = imgWrap.closest('.mg-post');
        var allPosts = feed.querySelectorAll('.mg-post');
        var idx = Array.prototype.indexOf.call(allPosts, post);
        if (idx >= 0) openFeedViewer(idx);
      });
    });
  }

  // ─── Expose ───
  window.MobileGallery = { init: init };
})();
