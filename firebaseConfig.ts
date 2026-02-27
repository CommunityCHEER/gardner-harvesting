import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getReactNativePersistence,
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  Auth,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The configuration object for the Firebase app.
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
const missing = requiredKeys.filter(k => !firebaseConfig[k]);
if (missing.length > 0) {
  console.error(`Firebase config missing: ${missing.join(', ')}. Check EXPO_PUBLIC_FIREBASE_* env vars.`);
}

/**
 * The initialized Firebase app instance.
 */
export const app = initializeApp(firebaseConfig);

let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
  auth.setPersistence(inMemoryPersistence);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

/**
 * The Firebase Authentication instance.
 */
export { auth };
/**
 * The Firestore database instance.
 */
export const db = getFirestore(app);
/**
 * The Firebase Storage instance.
 */
export const storage = getStorage(app);
/**
 * The Firebase Realtime Database instance.
 */
export const realtime = getDatabase(app);
