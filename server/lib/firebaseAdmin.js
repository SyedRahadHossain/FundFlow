const admin = require('firebase-admin');

let app = null;
let attempted = false;

/**
 * Returns an initialized firebase-admin app, or null when no service account is
 * configured. There is deliberately no fallback: an unverifiable Google sign-in
 * must fail closed instead of trusting a client-supplied email.
 */
function getFirebaseAdmin() {
  if (app) return app;
  if (attempted) return null;
  attempted = true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  try {
    const credential = admin.credential.cert(JSON.parse(raw));
    app = admin.initializeApp({ credential }, 'fundflow');
    return app;
  } catch (err) {
    console.error('firebase-admin init failed:', err.message);
    return null;
  }
}

module.exports = { getFirebaseAdmin };
