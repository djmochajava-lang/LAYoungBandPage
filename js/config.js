// js/config.js
window.SITE_CONFIG = {
  showPerformancesMenu: true,

  // ── Contact Registry (CEO rule 2026-07-22) ─────────────────────────────
  // Single source for business contact addresses on this site. Booking is
  // handled by the agency (Gold Bottom Ent.) — booking.agent@ is the canonical
  // public booking contact (D-60). NEVER hardcode a business email in pages
  // or scripts; hydrate [data-gbe-email] elements or read this object.
  contacts: {
    booking: 'booking.agent@goldbottoment-llc.com'
  },

  // Firebase config removed (fbexit S7): the client Firebase SDK no longer
  // loads anywhere on this site — auth + data run on Supabase (see
  // LA_AUTH_SOURCE below). Every SITE_CONFIG.firebase consumer guards
  // undefined and resolves its no-firebase fallback path.

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
// Each collection reads from 'supabase' or 'firestore' (legacy). POST-FBEXIT
// REALITY (S9): the Firestore backend is retired — the client SDK left in S7
// and Firestore 403s — so a 'firestore' value no longer selects a working
// read; it marks that collection's GalleryData read path DORMANT (zero
// callers). songs/playlists stay 'firestore' as HELD placeholders: flipping
// them to 'supabase' is the CEO's personal go/no-go (DECISIONS_LOG D-20
// Condition 1) and is NEVER done autonomously. The Supabase implementations
// are authored-and-ready behind this flag, so that approval remains a single
// one-value change.
window.READ_SOURCE = {
  gallery_feed: 'supabase',   // ← FLIPPED (Week-2 live proof)
  songs:        'firestore',  // HELD — CEO go/no-go (D-20)
  playlists:    'firestore'   // HELD — CEO go/no-go (D-20)
};

// ── AUTH-SOURCE flag (LIVE on Supabase since the Week-3 cutover) ────────
// 'supabase' => every auth + auth-coupled data read/write in fan-points.js /
// mobile-menu.js / music-player-app.js / mobile-gallery.js / forms.js runs
// the Supabase path (shared user pool with GBE, D-16). The legacy firebase
// branches are dead code: the client Firebase SDK was removed (fbexit S7)
// and no firebaseConfig ships, so those branches only no-op behind their
// typeof-firebase guards.
window.LA_AUTH_SOURCE = window.LA_AUTH_SOURCE || 'supabase';

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
    function makeQuery(filters, orders, lim) {
      filters = filters || []; orders = orders || [];
      return {
        where: function (field, op, value) {
          var f = filters.slice(); f.push({ field: field, op: op, value: value });
          return makeQuery(f, orders, lim);
        },
        // Firestore .orderBy(field, dir) -> Supabase .order(). Call sites:
        // fan-points leaderboard (.orderBy('monthlyPoints','desc')) + fan wall
        // (.orderBy('commentedAt','desc')); mobile-gallery gallery_feed
        // (.orderBy('createdAt','desc')). All chain .orderBy().limit().get()
        // directly on the collection. Without this, .orderBy is undefined ->
        // 'orderBy is not a function' and those panels never render. Field names
        // pass verbatim (these tables share the Firestore doc field names), the
        // same convention .where() already uses here -- no snake-casing.
        orderBy: function (field, dir) {
          var o = orders.slice(); o.push({ field: field, dir: dir });
          return makeQuery(filters, o, lim);
        },
        // Was a no-op that dropped n (returned ALL rows). Now applies the cap so
        // .limit(20)/.limit(100) actually bound the result set.
        limit: function (n) { return makeQuery(filters, orders, n); },
        get: function () {
          var q = sb.from(table).select('*');
          filters.forEach(function (fl) {
            if (fl.op === '==') q = q.eq(fl.field, fl.value);
            else if (fl.op === 'in') q = q.in(fl.field, fl.value);
          });
          orders.forEach(function (o) {
            q = q.order(o.field, { ascending: (o.dir !== 'desc') });
          });
          if (lim) q = q.limit(lim);
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
      where: function (field, op, value) { return makeQuery([{ field: field, op: op, value: value }], [], null); },
      // .collection(name).orderBy(...) / .limit(...) / .get() with no preceding
      // .where() — the fan-points leaderboard, fan wall, and gallery_feed all
      // start the chain with .orderBy() directly on the collection.
      orderBy: function (field, dir) { return makeQuery([], [{ field: field, dir: dir }], null); },
      limit: function (n) { return makeQuery([], [], n); },
      get: function () { return makeQuery([], [], null).get(); }
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

// ── Contact Registry hydration (CEO rule 2026-07-22) ─────────────────────
// Fills every [data-gbe-email] element from SITE_CONFIG.contacts.booking —
// <a data-gbe-email></a>                        → href=mailto:X, text=X
// <a data-gbe-email data-email-href-only></a>   → href only (keeps custom label)
// <a data-gbe-email data-email-subject="...">   → href=mailto:X?subject=...
// Called by PageLoader after each fragment injection; standalone pages
// (EPK) load config.js and call it inline. Safe to call repeatedly.
window.hydrateContacts = function (root) {
  var cfg = window.SITE_CONFIG;
  if (!cfg || !cfg.contacts || !cfg.contacts.booking) return;
  var email = cfg.contacts.booking;
  var nodes = (root || document).querySelectorAll('[data-gbe-email]');
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    if (el.tagName === 'A') {
      var subj = el.getAttribute('data-email-subject');
      el.setAttribute('href', 'mailto:' + email + (subj ? '?subject=' + encodeURIComponent(subj) : ''));
    }
    if (!el.hasAttribute('data-email-href-only')) el.textContent = email;
  }
};
