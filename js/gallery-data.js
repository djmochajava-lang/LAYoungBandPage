// js/gallery-data.js
//
// Read shim — Firestore ↔ Supabase, flag-gated (Supabase Week-2 migration).
//
// WHAT IT DOES
//   Routes catalog *reads* to either Firestore (today's live path) or Supabase
//   PostgreSQL, per-collection, controlled by window.READ_SOURCE (config.js).
//   Each collection has TWO implementations behind the flag:
//     (a) Firestore impl = today's EXACT .get() query — passed in by the
//         caller and kept byte-for-byte intact, so flipping the flag back to
//         'firestore' is a complete, no-redeploy rollback.
//     (b) Supabase impl  = supabase.from(<table>).select(...) via the ANON
//         (publishable) key, with rows NORMALIZED back to the exact document
//         shape the render code already consumes — downstream rendering is
//         unchanged.
//
// SECURITY
//   ANON KEY ONLY. The anon/publishable key is client-safe by design (RLS
//   gates every table; gallery_feed is Class-A anon-SELECT). The service_role
//   key must NEVER appear in any public repo (RULE-S05). No writes here — the
//   gallery's create/edit/delete still go to Firestore (admin path unchanged).
//
// CUTOVER STATE (DECISIONS_LOG D-20)
//   gallery_feed → 'supabase'  (this Week-2 live proof)
//   songs/playlists → 'firestore' (HELD; CEO personal go/no-go). Their Supabase
//   impls are authored below but dormant until the flag flips.
//
// DEPENDS ON
//   - window.SITE_CONFIG.supabase (url + anonKey)   — config.js
//   - window.READ_SOURCE                            — config.js
//   - @supabase/supabase-js v2 UMD                  — lazy-loaded here on demand
(function (global) {
  'use strict';

  // Self-hosted, version-pinned supabase-js (story-supabase-js-sri-pin).
  // Root-absolute: the lazy injector below resolves against the DOCUMENT URL
  // and is callable from any page depth.
  var SUPABASE_UMD = '/js/vendor/supabase-js-2.110.2.umd.js';

  var _client = null;       // Supabase client singleton
  var _loadingPromise = null;

  function _cfg() {
    return (global.SITE_CONFIG && global.SITE_CONFIG.supabase) || null;
  }

  function _source(collection) {
    var rs = global.READ_SOURCE || {};
    return rs[collection] || 'firestore';
  }

  // Lazily load the Supabase UMD bundle, then create one client.
  // Mirrors the GBE band-player v2 lazy-load pattern (bp2-core getSupabase()).
  function _getSupabase() {
    if (_client) return Promise.resolve(_client);
    var cfg = _cfg();
    if (!cfg || !cfg.url || !cfg.anonKey) {
      return Promise.reject(new Error('Supabase config missing'));
    }

    function _create() {
      if (global.supabase && typeof global.supabase.createClient === 'function') {
        _client = global.supabase.createClient(cfg.url, cfg.anonKey);
        global.GBE_SUPABASE = _client;
        return _client;
      }
      throw new Error('supabase-js UMD not available after load');
    }

    // Already on the page (e.g. another module loaded it)?
    if (global.supabase && typeof global.supabase.createClient === 'function') {
      return Promise.resolve(_create());
    }

    if (!_loadingPromise) {
      _loadingPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = SUPABASE_UMD;
        s.async = true;
        s.onload = function () { resolve(); };
        s.onerror = function () { reject(new Error('Failed to load supabase-js UMD')); };
        document.head.appendChild(s);
      });
    }
    return _loadingPromise.then(_create);
  }

  // ── Normalizers ───────────────────────────────────────────────────────
  // Map a Supabase row back to the Firestore *document shape* the render code
  // already consumes. The render path reads: doc.id, data.src, data.caption,
  // data.type, data.deleted. We return { id, data() } objects so the existing
  // snapshot.forEach(doc => doc.data()) consumer works unchanged.
  function _galleryRowToDoc(row) {
    var data = {
      src: row.src || '',
      caption: row.caption || '',
      type: row.type || '',
      deleted: row.deleted === true,
      createdAt: row.created_at || null
    };
    return { id: row.id, data: function () { return data; } };
  }

  // A minimal snapshot facade so the Supabase result is consumed identically
  // to a Firestore QuerySnapshot (forEach + .empty).
  function _makeSnapshot(docs) {
    return {
      empty: docs.length === 0,
      size: docs.length,
      forEach: function (fn) { docs.forEach(fn); }
    };
  }

  // ── gallery_feed ──────────────────────────────────────────────────────
  // Supabase impl — mirrors the live Firestore query:
  //   .collection('gallery_feed').orderBy('createdAt','desc').limit(100)
  //   then render skips docs where data.deleted === true.
  // We push the deleted!=true filter into the query (deleted=eq.false) AND
  // keep the client-side skip in the render path, so behaviour is identical.
  function _galleryFromSupabase() {
    return _getSupabase().then(function (sb) {
      return sb
        .from('gallery_feed')
        .select('id,src,caption,type,deleted,created_at')
        .eq('deleted', false)
        .order('created_at', { ascending: false })
        .limit(100)
        .then(function (res) {
          if (res.error) throw res.error;
          var rows = res.data || [];
          var docs = rows.map(_galleryRowToDoc);
          return _makeSnapshot(docs);
        });
    });
  }

  // Public entry: returns a Promise<snapshot-like>. The caller passes its
  // EXACT existing Firestore query as `firestoreImpl` (a function returning a
  // Promise<QuerySnapshot>) so the Firestore path stays byte-for-byte intact.
  function getGalleryFeed(firestoreImpl) {
    if (_source('gallery_feed') === 'supabase') {
      return _galleryFromSupabase();
    }
    return firestoreImpl();
  }

  // ── songs / playlists — AUTHORED, DORMANT (CEO go/no-go, D-20) ─────────
  // These are wired the same way but the flag keeps them on 'firestore'. They
  // exist so the CEO's eventual approval is a single one-value flag change.
  // (Tables: songs, playlists — Class-A anon SELECT, already imported.)
  function _songsFromSupabase() {
    return _getSupabase().then(function (sb) {
      return sb.from('songs').select('*').then(function (res) {
        if (res.error) throw res.error;
        var docs = (res.data || []).map(function (row) {
          var data = row.raw_doc || row;
          return { id: row.id, data: function () { return data; } };
        });
        return _makeSnapshot(docs);
      });
    });
  }
  function getSongs(firestoreImpl) {
    if (_source('songs') === 'supabase') return _songsFromSupabase();
    return firestoreImpl();
  }

  function _playlistsFromSupabase() {
    return _getSupabase().then(function (sb) {
      return sb.from('playlists').select('*').then(function (res) {
        if (res.error) throw res.error;
        var docs = (res.data || []).map(function (row) {
          // song_order is SACRED (D-20 / spec §7) — preserve verbatim, no sort.
          var data = row.raw_doc || row;
          return { id: row.id, data: function () { return data; } };
        });
        return _makeSnapshot(docs);
      });
    });
  }
  function getPlaylists(firestoreImpl) {
    if (_source('playlists') === 'supabase') return _playlistsFromSupabase();
    return firestoreImpl();
  }

  // ── Expose ────────────────────────────────────────────────────────────
  global.GalleryData = {
    getGalleryFeed: getGalleryFeed,
    getSongs: getSongs,          // dormant (flag = firestore)
    getPlaylists: getPlaylists,  // dormant (flag = firestore)
    _getSupabase: _getSupabase,
    _source: _source
  };
})(typeof window !== 'undefined' ? window : this);
