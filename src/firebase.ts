import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

console.log('🔥 Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '✓ Set' : '✗ Missing',
  authDomain: firebaseConfig.authDomain ? '✓ Set' : '✗ Missing',
  projectId: firebaseConfig.projectId ? '✓ Set' : '✗ Missing',
  storageBucket: firebaseConfig.storageBucket ? '✓ Set' : '✗ Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Set' : '✗ Missing',
  appId: firebaseConfig.appId ? '✓ Set' : '✗ Missing',
});

// Safe Firebase initialization with better error handling
let app: any;
let auth: any;
let db: any;
let storage: any;
let isFirebaseAvailable = false;

try {
  const existingApps = getApps();
  
  if (existingApps.length === 0) {
    console.log('🔥 Initializing Firebase for the first time...');
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } else {
    console.log('ℹ️ Firebase already initialized, reusing existing instance');
    app = existingApps[0];
  }
  
  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseAvailable = true;
  
  console.log('✅ Firebase services initialized');
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('⚠️ App will continue without Firebase');
  
  // Create dummy objects so app doesn't crash
  auth = null;
  db = null;
  storage = null;
  isFirebaseAvailable = false;
}

// Export with null checks
export { auth, db, storage, isFirebaseAvailable };

// Delayed anonymous sign-in - only if Firebase is available
if (isFirebaseAvailable && auth) {
  setTimeout(() => {
    try {
      if (!auth.currentUser) {
        console.log('🔐 Starting anonymous authentication...');
        signInAnonymously(auth)
          .then(() => {
            console.log('✅ Anonymous auth successful, User ID:', auth.currentUser?.uid);
          })
          .catch((error) => {
            console.error('❌ Anonymous auth failed:', error);
          });
      } else {
        console.log('ℹ️ User already authenticated:', auth.currentUser.uid);
      }
    } catch (authError) {
      console.error('❌ Auth error:', authError);
    }
  }, 3000);
}

// Test Firebase connection
export async function testFirebaseConnection(): Promise<boolean> {
  if (!isFirebaseAvailable || !auth || !db) {
    console.error('❌ Firebase not available');
    return false;
  }
  
  try {
    console.log('Testing Firebase connection...');
    
    // Wait for auth to complete
    if (!auth.currentUser) {
      console.log('Waiting for anonymous auth...');
      await signInAnonymously(auth);
    }
    
    console.log('User authenticated:', auth.currentUser?.uid);
    
    // Try to write to Firestore
    const testDoc = await addDoc(collection(db, 'test_connection'), {
      message: 'Firebase connection test',
      timestamp: Timestamp.now(),
      userId: auth.currentUser?.uid,
      testData: {
        platform: 'expo',
        environment: 'development'
      }
    });
    
    console.log('✅ Firebase connection successful!');
    console.log('Document written with ID:', testDoc.id);
    return true;
  } catch (error: any) {
    console.error('❌ Firebase connection failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return false;
  }
}
