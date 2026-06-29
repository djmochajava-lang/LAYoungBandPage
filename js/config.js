// js/config.js
window.SITE_CONFIG = {
  showPerformancesMenu: true,

  firebase: {
    apiKey: 'AIzaSyBxdl4Rq11ogyXwhH-2QCKhxB_RnT_bSEk',
    authDomain: 'goldbottoment.firebaseapp.com',
    projectId: 'goldbottoment',
    storageBucket: 'goldbottoment.firebasestorage.app',
    messagingSenderId: '963268881384',
    appId: '1:963268881384:web:2ca6af27366263f23dd25d'
  },

  // ── Supabase (PostgreSQL data layer) — Week 2 migration ──────────────
  // Public-read catalog data is being migrated Firestore → Supabase one
  // collection at a time, behind a per-collection read-source flag below.
  // ONLY the anon (publishable) key may live here — it is client-safe by
  // design (RLS gates every table). The service_role key must NEVER appear
  // in any public repo (RULE-S05).
  supabase: {
    url: 'https://rklvvuzedmadydmohouu.supabase.co',
    anonKey: 'sb_publishable_oIOHXXN_pwkeoeAfcQkNbg_rJkDFNZK'
  }
};

// ── Per-collection READ-SOURCE flag (Supabase Week-2 cutover) ──────────
// Each collection reads from 'firestore' (default, live) or 'supabase'.
// Flipping a value here is the entire cutover — and a one-value rollback.
// gallery_feed is flipped FIRST as the harmless live proof (public, non-auth,
// lowest blast radius). songs/playlists are HELD on Firestore: their flip is
// the CEO's personal go/no-go (DECISIONS_LOG D-20 Condition 1) and is NEVER
// flipped autonomously. The Supabase implementations for songs/playlists are
// authored-and-ready behind this flag so the CEO's eventual approval is a
// single one-value change.
window.READ_SOURCE = {
  gallery_feed: 'supabase',   // ← FLIPPED (Week-2 live proof)
  songs:        'firestore',  // HELD — CEO go/no-go (D-20)
  playlists:    'firestore'   // HELD — CEO go/no-go (D-20)
};

// ── DARK AUTH-SOURCE flag (Supabase Week-3 Auth cutover) ───────────────
// Default 'firebase' => every auth + auth-coupled Firestore read/write in
// fan-points.js / mobile-menu.js / music-player-app.js / mobile-gallery.js /
// forms.js runs the EXISTING Firebase path, byte-identical to before. The
// Supabase branches are present but UNREACHED until this is flipped to
// 'supabase' in the SAME owner-present window as GBE (shared user pool, D-16),
// then AC-1 device-tested. Firebase Auth stays LIVE underneath as the rollback
// net; flip-back is this one value. NOTE: the L.A. Young `followers` Supabase
// table must exist+be imported BEFORE this flip (music-player-app follower
// reads) — a pre-flip dependency, NOT a blocker for shipping this DARK.
window.LA_AUTH_SOURCE = window.LA_AUTH_SOURCE || 'firebase';

// ── Shared Supabase-auth helper (DARK) ─────────────────────────────────
// Single home for the entire Supabase Auth + Firestore-shaped data surface so
// the 5 SDK files only add tiny dark branches. Creates ONE Supabase client
// (lazy), exposes auth (signInWithOAuth google live; apple/azure dormant;
// signInWithPassword/signUp/resetPasswordForEmail/signOut; onAuthStateChange)
// and a Firestore-shaped db() adapter (.collection(name).doc(id).get/set/update,
// .collection(name).add(obj), .collection(name).where(f,op,v)[.where..].get()).
// Firestore hyphen collection names map to Week-2 underscore tables
// (layoung-fans→layoung_fans, fan-wall→fan_wall). Reached ONLY when
// LA_AUTH_SOURCE==='supabase'. The supabase-js UMD must be loaded first (the
// 5 files' loaders also load it in the dark branch). Returns null if the SDK or
// config is absent — callers fall back gracefully (dark path is unreached
// anyway by default).
window.LAAuth = (function () {
  var _client = null;
  var TABLE_MAP = { 'layoung-fans': 'layoung_fans', 'fan-wall': 'fan_wall' };
  function tableFor(name) { return TABLE_MAP[name] || name; }

  function client() {
    if (_client) return _client;
    var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.supabase) || null;
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    if (typeof window.supabase === 'undefined' ||
        typeof window.supabase.createClient !== 'function') return null;
    _client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return _client;
  }

  function adaptUser(su) {
    if (!su) return null;
    var meta = su.user_metadata || {};
    return {
      uid: su.id,
      email: su.email || meta.email || '',
      displayName: meta.display_name || meta.full_name || meta.name || '',
      photoURL: meta.avatar_url || meta.picture || '',
      _supabase: su
    };
  }

  // Firestore-shaped doc/query adapter over a Supabase table.
  function collection(name) {
    var sb = client();
    var table = tableFor(name);
    function doc(id) {
      return {
        get: function () {
          return sb.from(table).select('*').eq('id', id).maybeSingle()
            .then(function (res) {
              if (res && res.error && res.error.code !== 'PGRST116') throw res.error;
              var row = res ? res.data : null;
              return { id: id, exists: !!row, data: function () { return row || undefined; } };
            });
        },
        set: function (obj, opts) {
          var row = Object.assign({}, obj); row.id = id;
          if (opts && opts.merge) {
            return sb.from(table).upsert(row, { onConflict: 'id' })
              .then(function (res) { if (res && res.error) throw res.error; });
          }
          return sb.from(table).upsert(row, { onConflict: 'id' })
            .then(function (res) { if (res && res.error) throw res.error; });
        },
        update: function (obj) {
          return sb.from(table).update(obj).eq('id', id)
            .then(function (res) { if (res && res.error) throw res.error; });
        }
      };
    }
    function add(obj) {
      return sb.from(table).insert(obj)
        .then(function (res) { if (res && res.error) throw res.error; return res; });
    }
    function makeQuery(filters) {
      return {
        where: function (field, op, value) {
          var f = filters.slice(); f.push({ field: field, op: op, value: value });
          return makeQuery(f);
        },
        limit: function () { return makeQuery(filters); },
        get: function () {
          var q = sb.from(table).select('*');
          filters.forEach(function (fl) {
            if (fl.op === '==') q = q.eq(fl.field, fl.value);
            else if (fl.op === 'in') q = q.in(fl.field, fl.value);
          });
          return q.then(function (res) {
            if (res && res.error) throw res.error;
            var rows = (res && res.data) || [];
            var docs = rows.map(function (r) {
              return { id: r.id, exists: true, data: function () { return r; }, ref: doc(r.id) };
            });
            return {
              empty: docs.length === 0, size: docs.length, docs: docs,
              forEach: function (fn) { docs.forEach(fn); }
            };
          });
        }
      };
    }
    return {
      doc: doc,
      add: add,
      where: function (field, op, value) { return makeQuery([{ field: field, op: op, value: value }]); }
    };
  }

  return {
    available: function () { return !!client(); },
    serverTimestamp: function () { return new Date().toISOString(); },
    db: function () { return { collection: collection }; },
    getUser: function () {
      var sb = client();
      if (!sb) return Promise.resolve(null);
      return sb.auth.getUser().then(function (res) {
        return res && res.data ? adaptUser(res.data.user) : null;
      });
    },
    onAuthStateChange: function (cb) {
      var sb = client();
      if (!sb) return function () {};
      var sub = sb.auth.onAuthStateChange(function (event, session) {
        cb((session && session.user) ? adaptUser(session.user) : null, event);
      });
      return function () { try { sub.data.subscription.unsubscribe(); } catch (e) {} };
    },
    signInWithOAuth: function (providerKey) {
      var sb = client();
      if (!sb) return Promise.reject(new Error('Supabase auth unavailable'));
      var map = { google: 'google', apple: 'apple', microsoft: 'azure' };
      var redirectTo = (window.location && (window.location.origin + window.location.pathname)) || undefined;
      return sb.auth.signInWithOAuth({
        provider: map[providerKey] || 'google',
        options: { redirectTo: redirectTo, queryParams: { prompt: 'select_account' } }
      }).then(function (res) { if (res && res.error) throw res.error; return res; });
    },
    signInWithPassword: function (email, password) {
      var sb = client();
      if (!sb) return Promise.reject(new Error('Supabase auth unavailable'));
      return sb.auth.signInWithPassword({ email: email, password: password })
        .then(function (res) { if (res && res.error) throw res.error; return res; });
    },
    signUp: function (email, password) {
      var sb = client();
      if (!sb) return Promise.reject(new Error('Supabase auth unavailable'));
      var redirectTo = (window.location && (window.location.origin + window.location.pathname)) || undefined;
      return sb.auth.signUp({ email: email, password: password, options: { emailRedirectTo: redirectTo } })
        .then(function (res) { if (res && res.error) throw res.error; return res; });
    },
    resetPasswordForEmail: function (email) {
      var sb = client();
      if (!sb) return Promise.reject(new Error('Supabase auth unavailable'));
      var redirectTo = (window.location && (window.location.origin + window.location.pathname)) || undefined;
      return sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo })
        .then(function (res) { if (res && res.error) throw res.error; });
    },
    signOut: function () {
      var sb = client();
      if (!sb) return Promise.resolve();
      return sb.auth.signOut().then(function (res) { if (res && res.error) throw res.error; });
    },
    currentUserSync: function () { return null; }
  };
})();
