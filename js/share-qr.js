// js/share-qr.js
//
// "Share the Band" — a global, always-visible QR feature for the venue
// hand-to-hand moment. A floating Share button (in the SPA shell, so it is on
// every view) opens a full-screen overlay with a large, high-contrast QR of the
// evergreen homepage. Anyone can scan it to land on layoungbandpage.com.
//
//   • Self-hosted QR lib (js/vendor/qrcode.min.js) — NO CDN / external service,
//     so it never fails or rate-limits at a venue with weak signal.
//   • The QR is rasterised to a real <img> (canvas.toDataURL), never a live
//     <canvas> — an <img> screenshots/saves reliably on iOS (mirrors the
//     ticket-QR fix in pages/shows.html). If the lib can't load, we render the
//     readable URL as a text fallback — never a blank box.
//   • The bookmarkable #share deep link opens this same overlay on top of
//     whatever page loads underneath.
//
// Markup lives in index.html; styles in css/components.css.
(function () {
  'use strict';

  // The ONE stable, hard-coded destination. The QR encodes exactly this.
  var SHARE_URL = 'https://layoungbandpage.com';

  // Capture the entry hash SYNCHRONOUSLY at parse time: on a fresh
  // layoungbandpage.com/#share load the router rewrites the hash to #home a
  // moment later, so we must read the original intent before that happens.
  var _wantShareOnLoad = routeOf(window.location.hash) === 'share';
  var _rendered = false;
  var _lastFocus = null;

  function routeOf(hash) {
    var h = String(hash || '').replace(/^#/, '');
    var q = h.indexOf('?');
    return q === -1 ? h : h.slice(0, q);
  }

  // Load the vendored QR lib once, then run cb(). cb() ALWAYS runs (even on
  // load error) so buildQR() can fall back to the readable URL.
  function loadQRLib(cb) {
    if (window.QRCode) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'js/vendor/qrcode.min.js?v=1';
    s.onload = function () { cb(); };
    s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  function renderTextFallback(container) {
    container.innerHTML =
      '<div class="share-qr-fallback">' + SHARE_URL + '</div>';
  }

  // Render SHARE_URL as a QR and rasterise it into a clean <img>. High
  // correction level (H) + a large source canvas keeps it crisp and scannable
  // in dim, uneven venue light even at a downscaled display size.
  function buildQR(container) {
    if (!container) return;
    container.innerHTML = '';
    if (!window.QRCode) { renderTextFallback(container); return; }
    try {
      var tmp = document.createElement('div');
      // qrcodejs draws its canvas synchronously in the constructor.
      new window.QRCode(tmp, {
        text: SHARE_URL,
        width: 640,
        height: 640,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H
      });
      var canvas = tmp.querySelector('canvas');
      if (canvas && canvas.toDataURL) {
        var img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.alt = 'QR code — scan to open layoungbandpage.com';
        img.className = 'share-qr-img';
        container.appendChild(img);
      } else if (tmp.firstChild) {
        container.appendChild(tmp.firstChild); // <table> fallback (no canvas)
      } else {
        renderTextFallback(container);
      }
    } catch (e) {
      renderTextFallback(container);
    }
  }

  // Build the QR lazily the first time the overlay opens (keeps it off the
  // critical path of first paint). Rendered once, then cached in the DOM.
  function ensureRendered() {
    if (_rendered) return;
    var holder = document.getElementById('share-qr-holder');
    if (!holder) return;
    loadQRLib(function () {
      buildQR(holder);
      _rendered = true;
    });
  }

  function open() {
    var ov = document.getElementById('share-qr-overlay');
    if (!ov) return;
    _lastFocus = document.activeElement;
    ov.classList.add('is-open');
    ov.setAttribute('aria-hidden', 'false');
    document.body.classList.add('share-qr-open');
    ensureRendered();
    var closeBtn = document.getElementById('share-qr-close');
    if (closeBtn) { try { closeBtn.focus(); } catch (e) {} }
  }

  function close() {
    var ov = document.getElementById('share-qr-overlay');
    if (!ov) return;
    ov.classList.remove('is-open');
    ov.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('share-qr-open');
    // If we arrived via #share, clear it so the deep link can re-fire later.
    if (routeOf(window.location.hash) === 'share') {
      try {
        window.history.replaceState(
          null, '',
          window.location.pathname + window.location.search + '#home'
        );
      } catch (e) {}
    }
    if (_lastFocus && _lastFocus.focus) { try { _lastFocus.focus(); } catch (e) {} }
  }

  function isOpen() {
    var ov = document.getElementById('share-qr-overlay');
    return !!(ov && ov.classList.contains('is-open'));
  }

  function wire() {
    var fab = document.getElementById('share-qr-fab');
    if (fab) {
      fab.addEventListener('click', function (e) { e.preventDefault(); open(); });
    }

    var ov = document.getElementById('share-qr-overlay');
    if (ov) {
      // Tap the scrim (anywhere outside the panel) to dismiss.
      ov.addEventListener('click', function (e) {
        if (e.target === ov) close();
      });
    }

    var closeBtn = document.getElementById('share-qr-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) { e.preventDefault(); close(); });
    }

    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) close();
    });

    // #share deep link → open the overlay on top of the page underneath.
    if (_wantShareOnLoad) open();
    window.addEventListener('hashchange', function () {
      if (routeOf(window.location.hash) === 'share') open();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  // Public API (e.g. other UI can call ShareQR.open()).
  window.ShareQR = { open: open, close: close, url: SHARE_URL };
})();
