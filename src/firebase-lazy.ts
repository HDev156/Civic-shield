/**
 * Lazy Firebase Loader
 * Firebase is NOT imported at module level
 * Only loaded when actually needed
 */

let firebaseApp: any = null;
let firebaseAuth: any = null;
let firebaseDb: any = null;
let firebaseStorage: any = null;
let isInitialized = false;

/**
 * Initialize Firebase - call this before using Firebase
 */
export async function initFirebase() {
  if (isInitialized) {
    console.log('ℹ️ Firebase already initialized');
    return { auth: firebaseAuth, db: firebaseDb, storage: firebaseStorage };
  }

  try {
    console.log('🔥 Lazy loading Firebase...');
    
    // Dynamically import Firebase modules
    const { initializeApp, getApps } = require('firebase/app');
    const { getAuth, signInAnonymously } = require('firebase/auth');
    const { getFirestore } = require('firebase/firestore');
    const { getStorage } = require('firebase/storage');

    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
    };

    console.log('🔥 Firebase Config loaded');

    // Initialize Firebase
    const existingApps = getApps();
    if (existingApps.length === 0) {
      console.log('🔥 Initializing Firebase app...');
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      console.log('ℹ️ Using existing Firebase app');
      firebaseApp = existingApps[0];
    }

    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);

    console.log('✅ Firebase initialized successfully');

    // Sign in anonymously
    if (!firebaseAuth.currentUser) {
      console.log('🔐 Signing in anonymously...');
      await signInAnonymously(firebaseAuth);
      console.log('✅ Anonymous auth successful');
    }

    isInitialized = true;

    return { auth: firebaseAuth, db: firebaseDb, storage: firebaseStorage };
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

/**
 * Get Firebase instances (must call initFirebase first)
 */
export function getFirebase() {
  if (!isInitialized) {
    throw new Error('Firebase not initialized. Call initFirebase() first.');
  }
  return { auth: firebaseAuth, db: firebaseDb, storage: firebaseStorage };
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseReady(): boolean {
  return isInitialized;
}
