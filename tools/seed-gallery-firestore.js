// Run once: node tools/seed-gallery-firestore.js

const path = require('path');

// firebase-admin is not installed in LAYoungBandPage/node_modules.
// Resolve it from the private server's node_modules instead.
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  const adminPath = path.resolve(
    __dirname,
    '../../GoldBottomEntLLC-private/server/node_modules/firebase-admin'
  );
  try {
    admin = require(adminPath);
  } catch (e2) {
    console.error(
      'firebase-admin not found. Run: npm install firebase-admin\n' +
      '(or run this script from a directory that has firebase-admin in node_modules)'
    );
    process.exit(1);
  }
}

const SERVICE_ACCOUNT_PATH = path.resolve(
  __dirname,
  '../../GoldBottomEntLLC-private/server/.secrets/firebase-admin-key.json'
);

admin.initializeApp({
  credential: admin.credential.cert(SERVICE_ACCOUNT_PATH),
});

const db = admin.firestore();

const TOTAL = 62;
const COLLECTION = 'gallery_feed';
const BASE_DATE = new Date('2024-01-01T00:00:00Z');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function seed() {
  const batch = db.batch();

  for (let i = 1; i <= TOTAL; i++) {
    const padded = String(i).padStart(3, '0');
    const docId = `event_${padded}`;
    const imageNum = padded; // e.g. "001"

    const docDate = new Date(BASE_DATE.getTime() + (i - 1) * MS_PER_DAY);

    console.log(`Seeding ${padded}/62: ${docId}`);

    const ref = db.collection(COLLECTION).doc(docId);
    batch.set(ref, {
      src: `https://layoungbandpage.com/images/gallery/event${imageNum}.jpg`,
      caption: `BackStage photo ${i}`,
      type: 'static',
      deleted: false,
      createdAt: admin.firestore.Timestamp.fromDate(docDate),
    });
  }

  await batch.commit();
  console.log(`Done! ${TOTAL} images seeded to ${COLLECTION}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
