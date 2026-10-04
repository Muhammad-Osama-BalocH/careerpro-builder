import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;

function getAdminCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return cert(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  return null;
}

try {
  if (!getApps().length) {
    const credential = getAdminCredential();
    if (credential) {
      adminApp = initializeApp({
        credential,
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      console.error(
        'Firebase Admin credentials not found. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local'
      );
    }
  } else {
    adminApp = getApps()[0];
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization failed:', error);
}

function requireAdmin() {
  if (!adminApp) {
    throw new Error(
      'Firebase Admin SDK is not initialized. ' +
      'Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local'
    );
  }
  return adminApp;
}

export const adminDb: Firestore = adminApp ? getFirestore(adminApp) : new Proxy({} as Firestore, {
  get(_target, prop) {
    if (prop === 'then' || prop === 'toJSON' || prop === 'constructor') return undefined;
    throw new Error(
      'Firebase Admin Firestore is not initialized. ' +
      'Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local'
    );
  },
});

export const adminAuth: Auth = adminApp ? getAuth(adminApp) : new Proxy({} as Auth, {
  get(_target, prop) {
    if (prop === 'then' || prop === 'toJSON' || prop === 'constructor') return undefined;
    throw new Error(
      'Firebase Admin Auth is not initialized. ' +
      'Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local'
    );
  },
});

export { requireAdmin };
