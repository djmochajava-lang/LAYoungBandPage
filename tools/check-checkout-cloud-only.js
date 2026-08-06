#!/usr/bin/env node
/* ============================================================================
   check-checkout-cloud-only.js — story-offline-checkout-cloud-cutover (band-side guard)

   The standing rule: a ticket TRANSACTION must complete with the home-office Mac
   fully OFFLINE. The checkout in pages/shows.html now talks to Supabase directly
   for every leg of the transaction (verify-link edge fn, resume_checkout,
   purchase_ticket) and has NO home-office/tunnel fallback. This guard fails the
   build if the retired Mac-routing fallback ever reappears.

   It is the band-site-side complement to the GBE-HomeOffice server-side Jest
   guard (server/tests/offline-checkout-cloud-cutover.test.js), which cannot
   assert on this file without coupling two independent repos.

   Fails (exit 1) if pages/shows.html contains, in CODE (comments are allowed to
   name the retired constructs so we can explain the retirement):
     • the GBE_API_BASE ticket-Worker base constant, or the derived API base
     • the '/api/v1/tickets' tunnel path prefix (the Mac checkout endpoints)
     • a "? … : GBE_API_BASE" / "? … : (API + …)" checkout fallback ternary

   Usage:  node tools/check-checkout-cloud-only.js
   ============================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'pages', 'shows.html');

/** Strip JS/HTML comments so only executable code is analyzed. The retirement
 *  notes in shows.html legitimately name GBE_API_BASE / API / /api/v1/tickets;
 *  code never may. */
function codeOnly(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')       // HTML comments
    .replace(/\/\*[\s\S]*?\*\//g, '')      // JS block comments
    .replace(/^\s*\/\/.*$/gm, '')          // full-line JS comments
    .replace(/([^:'"])\/\/.*$/gm, '$1');   // trailing JS comments (protects https://)
}

const FORBIDDEN = [
  {
    id: 'GBE_API_BASE base constant',
    re: /GBE_API_BASE/,
    why: 'the gbe-tickets Cloudflare Worker base → quick tunnel → home Mac. Checkout is cloud-only (Supabase); there is no tunnel/Mac fallback.',
  },
  {
    id: "'/api/v1/tickets' tunnel path prefix",
    re: /\/api\/v1\/tickets/,
    why: 'the home-Mac ticket endpoints (orders/public, orders/:id/pay, checkout/verify-link, checkout/resume, orders/purchase, orders/confirm). No purchase or read may route through the Mac from this page.',
  },
  {
    id: 'checkout Mac-fallback ternary ( : GBE_API_BASE / : (API + …) )',
    re: /:\s*GBE_API_BASE|:\s*\(?\s*API\s*\+/,
    why: 'the "supaCfg() ? … : GBE_API_BASE/API" fallback that silently routed the checkout to the Mac when Supabase config was absent. It must FAIL CLOSED instead.',
  },
];

function main() {
  let src;
  try {
    src = fs.readFileSync(FILE, 'utf8');
  } catch (e) {
    console.error(`[checkout-cloud-only] cannot read ${FILE}: ${e.message}`);
    process.exit(2);
  }

  const code = codeOnly(src);
  const violations = [];
  for (const rule of FORBIDDEN) {
    if (rule.re.test(code)) violations.push(rule);
  }

  if (violations.length) {
    console.error('[checkout-cloud-only] FAIL — retired Mac-routing checkout fallback found in pages/shows.html:');
    for (const v of violations) {
      console.error(`  • ${v.id}\n      ${v.why}`);
    }
    console.error('\nstory-offline-checkout-cloud-cutover: checkout is cloud-only (Supabase). Do not re-add the tunnel/Mac fallback (offline-rule).');
    process.exit(1);
  }

  console.log('[checkout-cloud-only] OK — pages/shows.html has no home-office/tunnel checkout fallback (cloud-only).');
}

main();
