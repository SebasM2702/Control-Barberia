// Firebase initialization helper
// Place your Firebase config here and import this file once (e.g. in `app/_layout.tsx`) to initialize the SDK.

import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAkCwMa8jxqtdHH2s87H1Adx7FGJnk4ig8",
  authDomain: "control-barberia.firebaseapp.com",
  projectId: "control-barberia",
  storageBucket: "control-barberia.firebasestorage.app",
  messagingSenderId: "1069168682494",
  appId: "1:1069168682494:web:62c0a06eb915ce3fc7ccaf",
  measurementId: "G-J2FF9WCZ41",
};

// Initialize or reuse existing app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize or reuse auth and firestore instances
let auth: any = null;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // initializeAuth with AsyncStorage persistence on React Native
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(ReactNativeAsyncStorage) });
  } catch (e) {
    // fallback to getAuth if initializeAuth fails
    console.warn('initializeAuth failed, falling back to getAuth', e);
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

// Firebase Analytics is web-only in the Firebase JS SDK; avoid importing it on native to prevent runtime errors.
// We dynamically import analytics only on web.
let analytics: any = null;
if (Platform.OS === 'web') {
  // dynamic import so bundlers on native platforms don't try to include the module
  import('firebase/analytics')
    .then(({ getAnalytics }) => {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        // ignore analytics errors
        console.warn('Firebase analytics init failed:', e);
      }
    })
    .catch((e) => {
      console.warn('Failed to load firebase/analytics module:', e);
    });
}

export { app, analytics, firebaseConfig, auth, db };

// Optional: exports you might use later (commented examples)
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// export const auth = getAuth(app);
// export const db = getFirestore(app);
