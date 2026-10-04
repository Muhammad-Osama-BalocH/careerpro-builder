import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || '',
};

const requiredConfigFields: Array<keyof FirebaseOptions> = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

const hasRequiredConfig = requiredConfigFields.every((field) => Boolean(firebaseConfig[field]));

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

if (hasRequiredConfig) {
  try {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Failed to set auth persistence:', err);
    });
    db = getFirestore(firebaseApp);
    isFirebaseConfigured = Boolean(firebaseApp && auth && db);
  } catch (error) {
    console.warn('Firebase was not initialized:', error);
  }
}

if (!isFirebaseConfigured) {
  console.warn('Firebase is not configured. Add your NEXT_PUBLIC_FIREBASE_* values to enable Firebase features.');
}

export { firebaseApp, auth, db, firebaseConfig, isFirebaseConfigured };
export default firebaseApp;
