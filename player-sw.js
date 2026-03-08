// player-sw.js — Service worker for PWA standalone mode
// Bump this version when deploying updates to force refresh
var PLAYER_VERSION = '1.2.0';

self.addEventListener('install', function() {
  console.log('🎵 Player SW v' + PLAYER_VERSION + ' installing');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('🎵 Player SW v' + PLAYER_VERSION + ' activated');
  event.waitUntil(self.clients.claim());
});

// Respond to version check messages from the page
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: PLAYER_VERSION });
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Network-first strategy: always fetch fresh, no stale cache
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Let audio/media requests pass through directly — service workers
  // can strip Range headers or break streaming (206 Partial Content)
  if (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') ||
      url.endsWith('.mp4') || url.endsWith('.webm') ||
      event.request.headers.get('range')) {
    return; // Don't call respondWith → browser handles natively
  }

  event.respondWith(
    fetch(event.request).catch(function() {
      // Offline fallback — only if network fails
      return caches.match(event.request);
    })
  );
});
