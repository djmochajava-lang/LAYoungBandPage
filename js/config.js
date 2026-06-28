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
