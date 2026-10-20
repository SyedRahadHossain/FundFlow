const { initializeApp, cert } = require('firebase-admin/app');

let auth = null;
let attempted = false;

/**
 * Returns a firebase-admin Auth instance, or null when no service account is
 * configured. There is deliberately no fallback: an unverifiable Google sign-in
 * must fail closed instead of trusting a client-supplied email.
 *
 * The modular entry points are used because firebase-admin v13 removed the
 * namespaced API — `admin.credential` and `app.auth()` no longer exist.
 *
 * `firebase-admin/auth` is required lazily on purpose: it pulls in the ESM-only
 * `jose` package, which the Jest CommonJS runtime cannot load. Requiring it at
 * module scope breaks every suite that mounts the app, even the ones that never
 * touch Google sign-in.
 */
function getFirebaseAuth() {
  if (auth) return auth;
  if (attempted) return null;
  attempted = true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  try {
    const { getAuth } = require('firebase-admin/auth');
    const app = initializeApp({ credential: cert(JSON.parse(raw)) }, 'fundflow');
    auth = getAuth(app);
    return auth;
  } catch (err) {
    console.error('firebase-admin init failed:', err.message);
    return null;
  }
}

module.exports = { getFirebaseAuth };
