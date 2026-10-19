'use client';
// Firebase is client-only — all imports deferred to avoid SSR prerender errors

let _auth = null;
let _googleProvider = null;

async function getFirebase() {
  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth, GoogleAuthProvider } = await import('firebase/auth');

  if (!_auth) {
    const firebaseConfig = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const app = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];
    _auth = getAuth(app);
    _googleProvider = new GoogleAuthProvider();
  }
  return { auth: _auth, googleProvider: _googleProvider };
}

export async function signInWithGoogle() {
  const { auth, googleProvider } = await getFirebase();
  const { signInWithPopup } = await import('firebase/auth');
  const result = await signInWithPopup(auth, googleProvider);
  // The Firebase ID token is the only credential the server accepts. It verifies
  // the token and reads identity from the verified claims, so nothing here is
  // trusted on its own.
  const idToken = await result.user.getIdToken();
  return { idToken };
}
