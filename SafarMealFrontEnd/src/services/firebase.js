import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let auth = null;
let db = null;

// Determine if we have a valid configuration (not placeholders)
const hasValidConfig = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.authDomain && 
  firebaseConfig.authDomain !== 'your_auth_domain_here';

console.log('Firebase Config loaded:', firebaseConfig);
console.log('hasValidConfig:', hasValidConfig);

if (!hasValidConfig) {
  console.warn(
    'Firebase Client SDK is not initialized because configuration keys are using placeholders. ' +
    'Please configure them in SafarMealFrontEnd/.env to enable real-time SMS. Falling back to Mock SMS OTP.'
  );
} else {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { auth, db };
