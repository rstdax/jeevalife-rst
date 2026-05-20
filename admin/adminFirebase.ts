/**
 * Separate Firebase app instance for the admin panel.
 * This keeps admin auth completely isolated from the user app's auth session.
 * Both use the same Firebase project/database, but different Auth instances
 * so login/logout on one side never affects the other.
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Use a unique app name 'jeevalife-admin' so it's a separate instance
// from the default app used by the user-facing site
const ADMIN_APP_NAME = 'jeevalife-admin';

const adminApp = getApps().find(a => a.name === ADMIN_APP_NAME)
  ?? initializeApp(firebaseConfig, ADMIN_APP_NAME);

export const adminAuth = getAuth(adminApp);
export const adminDb   = getFirestore(adminApp);
