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

  // Capture the original hash early before router may change it
  var _originalHash = window.location.hash || '';

  function init() {
    var storiesRow = document.getElementById('mg-stories-row');
    if (!storiesRow) return;
    if (typeof artistImages === 'undefined' || typeof eventImages === 'undefined') return;

    buildStories();
    buildFeed();
    setupStoryViewer();
    setupFeedViewer();
    setupPageShare();
    setupSecretLogin();
    scrollToSharedPost();
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
  var svAnimating = false;

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
      if (svAnimating) return;
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
    var banner = document.querySelector('.top-banner');
    var footer = document.querySelector('.site-footer');
    if (banner) banner.style.display = 'none';
    if (footer) footer.style.display = 'none';
    showStory();
    startStoryTimer();
  }

  function closeStoryViewer() {
    clearTimeout(svTimer);
    var viewer = document.getElementById('mg-story-viewer');
    viewer.classList.remove('open');
    document.body.style.overflow = '';
    var banner = document.querySelector('.top-banner');
    var footer = document.querySelector('.site-footer');
    if (banner) banner.style.display = '';
    if (footer) footer.style.display = '';
  }

  function navigateStory(dir) {
    if (svAnimating) return;
    svAnimating = true;

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
          svAnimating = false;
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
      header.innerHTML = '<span class="mg-post-author">BACKSTAGE</span>';

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
        '</button>' +
        '<button class="mg-post-action mg-share-btn" aria-label="Share" data-caption="' + escapeHtml(img.caption) + '" data-post-index="' + i + '">' +
          '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
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

    // Share buttons
    feed.querySelectorAll('.mg-share-btn').forEach(function (btn) {
      if (btn._mgBound) return;
      btn._mgBound = true;
      btn.addEventListener('click', function () {
        var caption = btn.getAttribute('data-caption') || '';
        var postIndex = btn.getAttribute('data-post-index') || '0';
        var pageUrl = 'https://layoungbandpage.com/#gallery-post-' + (parseInt(postIndex, 10) + 1);
        if (navigator.share) {
          navigator.share({
            text: caption + '\n\n🎶 Check out L.A. Young — Soul, Jazz & Blues in Full Color!\n\n' + pageUrl
          }).catch(function () {});
        } else {
          copyToClipboard(pageUrl);
          showAdminToast('Link copied');
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

  // ─── DEEP LINK: scroll to shared post ───

  function scrollToSharedPost() {
    var hash = _originalHash || window.location.hash || '';
    var match = hash.match(/gallery-post-(\d+)/);
    if (!match) return;

    var targetIndex = parseInt(match[1], 10) - 1;
    if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= eventImages.length) return;

    // Load enough posts to include the target
    while (feedLoaded <= targetIndex) {
      loadMoreFeed();
    }

    // Scroll to the post and highlight it
    setTimeout(function () {
      var posts = document.querySelectorAll('#mg-feed .mg-post');
      var targetPost = posts[targetIndex];
      if (!targetPost) return;

      targetPost.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Brief gold highlight
      targetPost.style.transition = 'box-shadow 0.3s ease';
      targetPost.style.boxShadow = '0 0 0 2px #ffd700, 0 0 20px rgba(255, 215, 0, 0.3)';
      setTimeout(function () {
        targetPost.style.boxShadow = '';
      }, 2500);
    }, 300);
  }

  // ─── SHARING (native share sheet) ───

  function shareContent(title, text, url) {
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url })
        .catch(function () { /* user cancelled — ignore */ });
    } else {
      copyToClipboard(url);
      showAdminToast('Link copied to clipboard');
    }
  }


  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  function setupPageShare() {
    // Add a share button next to the "Feed" label
    var feedLabel = document.querySelector('.mg-feed-label');
    if (!feedLabel || feedLabel.querySelector('.mg-page-share')) return;

    var btn = document.createElement('button');
    btn.className = 'mg-page-share';
    btn.setAttribute('aria-label', 'Share page');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';
    btn.addEventListener('click', function () {
      shareContent(
        'L.A. Young Band Page',
        '🎶 Check out L.A. Young — Soul, Jazz & Blues in Full Color!',
        window.location.origin + '/#gallery'
      );
    });
    feedLabel.appendChild(btn);
  }

  // ─── ADMIN: Gallery editing (admin/artist role only) ───

  var _adminUser = null;
  var _adminDb = null;
  var _editMode = false;
  var _secretTaps = 0;
  var _secretTimer = null;

  function setupSecretLogin() {
    // Triple-tap on "Reels" label to trigger admin login
    var label = document.querySelector('.mg-stories-label');
    if (!label) return;

    label.addEventListener('click', function () {
      _secretTaps++;
      clearTimeout(_secretTimer);
      _secretTimer = setTimeout(function () { _secretTaps = 0; }, 800);

      if (_secretTaps >= 3) {
        _secretTaps = 0;
        console.log('🔑 Triple-tap detected — triggering admin login');
        showAdminToast('Connecting...');
        triggerAdminLogin();
      }
    });

    // If user was previously authed or returning from redirect, check role silently
    var hasAuth = false;
    var pendingAdmin = false;
    try { hasAuth = !!localStorage.getItem('layoung-fan-auth'); } catch (e) {}
    try { pendingAdmin = !!localStorage.getItem('mg-admin-pending'); } catch (e) {}
    if (hasAuth || pendingAdmin) {
      showAdminToast('Auth check: hasAuth=' + hasAuth + ' pending=' + pendingAdmin);
      loadFirebaseForAdmin(function () {
        showAdminToast('Firebase loaded');
        checkAdminRole();
      });
    }
  }

  function loadFirebaseForAdmin(callback) {
    // Reuse FanPoints loader if available
    if (typeof FanPoints !== 'undefined' && FanPoints._loadFirebase) {
      FanPoints._loadFirebase(callback);
      return;
    }
    // Fallback: load directly
    if (typeof firebase !== 'undefined' && firebase.apps) {
      callback();
      return;
    }
    var scripts = [
      'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
      'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js'
    ];
    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) { callback(); return; }
      var s = document.createElement('script');
      s.src = scripts[loaded];
      s.onload = function () { loaded++; loadNext(); };
      document.head.appendChild(s);
    }
    loadNext();
  }

  function triggerAdminLogin() {
    loadFirebaseForAdmin(function () {
      if (typeof firebase === 'undefined') return;

      if (!firebase.apps.length) {
        var config = (typeof window.SITE_CONFIG !== 'undefined') ? window.SITE_CONFIG.firebase : null;
        if (!config) return;
        firebase.initializeApp(config);
      }

      _adminDb = firebase.firestore();

      // Check if already signed in
      var user = firebase.auth().currentUser;
      if (user) {
        _adminUser = user;
        checkAdminRole();
        return;
      }

      // Sign in
      var provider = new firebase.auth.GoogleAuthProvider();
      var isMobile = (typeof MobileDetect !== 'undefined' && MobileDetect.isMobile);

      if (isMobile) {
        try { localStorage.setItem('layoung-fan-auth', '1'); } catch (e) {}
        try { localStorage.setItem('mg-admin-pending', '1'); } catch (e) {}
        try { localStorage.setItem('mg-admin-return', 'gallery'); } catch (e) {}
        firebase.auth().signInWithRedirect(provider);
      } else {
        firebase.auth().signInWithPopup(provider)
          .then(function () { checkAdminRole(); })
          .catch(function (err) {
            console.warn('Admin sign-in failed:', err.message);
          });
      }
    });
  }

  function checkAdminRole() {
    if (typeof firebase === 'undefined') return;

    if (!firebase.apps.length) {
      var config = (typeof window.SITE_CONFIG !== 'undefined') ? window.SITE_CONFIG.firebase : null;
      if (!config) return;
      firebase.initializeApp(config);
    }

    if (!_adminDb) _adminDb = firebase.firestore();

    // Try to get user from FanPoints first (it handles redirect result)
    function tryGetUser() {
      // Check FanPoints user
      if (typeof FanPoints !== 'undefined' && FanPoints._firebaseUser) {
        return FanPoints._firebaseUser;
      }
      // Check Firebase directly
      if (typeof firebase !== 'undefined' && firebase.auth) {
        return firebase.auth().currentUser;
      }
      return null;
    }

    var user = tryGetUser();
    if (user) {
      showAdminToast('User found: ' + user.email);
      _adminUser = user;
      fetchRole(user);
      return;
    }

    // User not available yet — wait for auth to resolve
    showAdminToast('Waiting for auth...');
    var attempts = 0;
    var pollInterval = setInterval(function () {
      attempts++;
      var u = tryGetUser();
      if (u) {
        clearInterval(pollInterval);
        showAdminToast('User found: ' + u.email);
        _adminUser = u;
        fetchRole(u);
      } else if (attempts >= 20) {
        clearInterval(pollInterval);
        showAdminToast('No sign-in detected after 10s. Triple-tap to try again.');
        try { localStorage.removeItem('mg-admin-pending'); } catch (e) {}
        hideAdminUI();
      }
    }, 500);
  }

  function fetchRole(user) {
    _adminDb.collection('layoung-fans').doc(user.uid).get()
      .then(function (doc) {
        var data = doc.exists ? doc.data() : {};
        var role = data.role || 'fan';
        showAdminToast('Doc exists: ' + doc.exists + ' | Role: ' + role);

        if (role === 'admin' || role === 'artist') {
          showAdminUI(user.displayName, role);
        } else {
          showAdminToast('Need role "admin" or "artist" in layoung-fans/' + user.uid);
          hideAdminUI();
          try { localStorage.removeItem('mg-admin-pending'); } catch (e) {}
        }
      })
      .catch(function (err) {
        showAdminToast('Firestore error: ' + err.message);
        hideAdminUI();
      });
  }

  function showAdminUI(name, role) {
    var fab = document.getElementById('mg-admin-fab');
    if (fab) fab.style.display = 'flex';

    // Show small status badge
    var existing = document.querySelector('.mg-admin-status');
    if (!existing) {
      var badge = document.createElement('div');
      badge.className = 'mg-admin-status';
      badge.textContent = (role === 'artist' ? '★ ' : '⚙ ') + (name || 'Admin');
      document.querySelector('.mg-page').appendChild(badge);
    }

    // Set up FAB click
    fab.onclick = function () {
      toggleEditMode();
    };

    // Set up add panel
    document.getElementById('mg-admin-add-cancel').onclick = function () {
      document.getElementById('mg-admin-add-panel').style.display = 'none';
    };
    document.getElementById('mg-admin-add-save').onclick = function () {
      saveNewPost();
    };

    try { localStorage.removeItem('mg-admin-pending'); } catch (e) {}
  }

  function hideAdminUI() {
    var fab = document.getElementById('mg-admin-fab');
    if (fab) fab.style.display = 'none';
    var badge = document.querySelector('.mg-admin-status');
    if (badge) badge.remove();
  }

  function toggleEditMode() {
    _editMode = !_editMode;
    var fab = document.getElementById('mg-admin-fab');
    var posts = document.querySelectorAll('.mg-post');

    if (_editMode) {
      fab.classList.add('editing');

      // Add edit controls to each feed card
      posts.forEach(function (post, idx) {
        post.classList.add('mg-edit-mode');

        var caption = post.querySelector('.mg-post-caption');

        // Add Edit button in header
        var header = post.querySelector('.mg-post-header');
        if (header && !header.querySelector('.mg-edit-btn')) {
          var editBtn = document.createElement('button');
          editBtn.className = 'mg-admin-btn mg-admin-btn-edit mg-edit-btn';
          editBtn.textContent = 'Edit';
          header.appendChild(editBtn);

          // Save bar (hidden until Edit is tapped)
          var saveBar = document.createElement('div');
          saveBar.className = 'mg-post-save-bar';
          saveBar.style.display = 'none';
          saveBar.innerHTML =
            '<button class="mg-admin-btn mg-admin-btn-save mg-save-caption">Save</button>' +
            '<button class="mg-admin-btn mg-admin-btn-cancel mg-cancel-edit">Cancel</button>';
          caption.insertAdjacentElement('afterend', saveBar);

          // Delete at bottom of card
          var deleteWrap = document.createElement('div');
          deleteWrap.className = 'mg-post-delete-wrap';
          deleteWrap.innerHTML = '<button class="mg-admin-btn mg-admin-btn-delete mg-delete-post">Delete Post</button>';
          post.appendChild(deleteWrap);

          // Edit button: enable caption editing
          editBtn.addEventListener('click', function () {
            caption.setAttribute('contenteditable', 'true');
            caption.focus();
            saveBar.style.display = 'flex';
            editBtn.style.display = 'none';
          });

          // Save caption
          saveBar.querySelector('.mg-save-caption').addEventListener('click', function () {
            var newCaption = caption.textContent.replace(/^L\.A\.\s*Young\s*/, '').trim();
            caption.removeAttribute('contenteditable');
            saveBar.style.display = 'none';
            editBtn.style.display = '';
            saveCaptionEdit(idx, newCaption);
          });

          // Cancel edit
          saveBar.querySelector('.mg-cancel-edit').addEventListener('click', function () {
            caption.removeAttribute('contenteditable');
            saveBar.style.display = 'none';
            editBtn.style.display = '';
          });

          // Delete
          deleteWrap.querySelector('.mg-delete-post').addEventListener('click', function () {
            deletePost(idx, post);
          });
        }
      });

      // Show add button at top of feed
      var addBtn = document.getElementById('mg-admin-add-trigger');
      if (!addBtn) {
        addBtn = document.createElement('button');
        addBtn.id = 'mg-admin-add-trigger';
        addBtn.className = 'mg-admin-btn mg-admin-btn-save';
        addBtn.style.cssText = 'width:100%;padding:12px;margin:12px 0;border-radius:10px;font-size:1rem;';
        addBtn.textContent = '+ Add New Post';
        addBtn.addEventListener('click', function () {
          document.getElementById('mg-admin-add-panel').style.display = 'flex';
        });
        var feed = document.getElementById('mg-feed');
        feed.parentNode.insertBefore(addBtn, feed);
      }
      addBtn.style.display = 'block';

    } else {
      fab.classList.remove('editing');

      posts.forEach(function (post) {
        post.classList.remove('mg-edit-mode');
        var caption = post.querySelector('.mg-post-caption');
        if (caption) caption.removeAttribute('contenteditable');
        // Reset edit state on each card
        var saveBar = post.querySelector('.mg-post-save-bar');
        var editBtn = post.querySelector('.mg-edit-btn');
        if (saveBar) saveBar.style.display = 'none';
        if (editBtn) editBtn.style.display = '';
      });

      var addBtn = document.getElementById('mg-admin-add-trigger');
      if (addBtn) addBtn.style.display = 'none';
    }
  }

  function saveCaptionEdit(index, newCaption) {
    if (!_adminDb || !_adminUser) return;

    // Save to Firestore
    var docId = 'event_' + String(index).padStart(3, '0');
    _adminDb.collection('gallery_feed').doc(docId).set({
      caption: newCaption,
      updatedBy: _adminUser.uid,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(function () {
      showAdminToast('Caption saved');
    }).catch(function (err) {
      showAdminToast('Error: ' + err.message);
    });
  }

  function deletePost(index, postEl) {
    if (!confirm('Delete this post?')) return;
    if (!_adminDb || !_adminUser) return;

    var docId = 'event_' + String(index).padStart(3, '0');
    _adminDb.collection('gallery_feed').doc(docId).set({
      deleted: true,
      deletedBy: _adminUser.uid,
      deletedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(function () {
      postEl.style.opacity = '0.3';
      postEl.style.pointerEvents = 'none';
      showAdminToast('Post deleted');
    }).catch(function (err) {
      showAdminToast('Error: ' + err.message);
    });
  }

  function saveNewPost() {
    var url = document.getElementById('mg-admin-add-url').value.trim();
    var caption = document.getElementById('mg-admin-add-caption').value.trim();
    if (!url || !caption) { showAdminToast('URL and caption required'); return; }
    if (!_adminDb || !_adminUser) return;

    _adminDb.collection('gallery_feed').add({
      src: url,
      caption: caption,
      type: 'custom',
      createdBy: _adminUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      // Add to feed visually
      var feed = document.getElementById('mg-feed');
      var post = document.createElement('div');
      post.className = 'mg-post';
      post.innerHTML =
        '<div class="mg-post-header"><span class="mg-post-author">BACKSTAGE</span></div>' +
        '<div class="mg-post-img"><img src="' + escapeHtml(url) + '" alt="' + escapeHtml(caption) + '" loading="lazy"></div>' +
        '<div class="mg-post-actions">' +
          '<button class="mg-post-action mg-like-btn" aria-label="Like">' +
            '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="2"/></svg>' +
            '<span class="mg-like-count">0</span>' +
          '</button>' +
          '<button class="mg-post-action mg-comment-toggle" aria-label="Comment">' +
            '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="mg-post-caption"><strong>L.A. Young</strong> ' + escapeHtml(caption) + '</div>' +
        '<div class="mg-post-comments"><div class="mg-comments-list"></div>' +
          '<div class="mg-comment-input"><input type="text" placeholder="Add a comment..." maxlength="200"><button class="mg-comment-send">Post</button></div></div>';

      feed.insertBefore(post, feed.firstChild);
      bindPostActions(feed);

      // Clear form and close
      document.getElementById('mg-admin-add-url').value = '';
      document.getElementById('mg-admin-add-caption').value = '';
      document.getElementById('mg-admin-add-panel').style.display = 'none';
      showAdminToast('Post added');
    }).catch(function (err) {
      showAdminToast('Error: ' + err.message);
    });
  }

  function showAdminToast(msg) {
    // Persistent debug banner at top of screen
    var banner = document.getElementById('mg-debug-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'mg-debug-banner';
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ffd700;color:#000;padding:12px 16px;font-size:0.85rem;font-weight:bold;z-index:999999;text-align:center;font-family:monospace;max-height:40vh;overflow-y:auto;';
      document.body.appendChild(banner);
    }
    banner.textContent = (banner.textContent ? banner.textContent + ' → ' : '') + msg;
  }

  // ─── Expose ───
  window.MobileGallery = { init: init };
})();
