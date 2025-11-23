import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, inMemoryPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

/**
 * The configuration object for the Firebase app - WEB ONLY with hardcoded values
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAql__a3U-pgQ21bTofEN_otegnM0N11lM",
  authDomain: "cheer-app-prototype.firebaseapp.com",
  projectId: "cheer-app-prototype",
  storageBucket: "cheer-app-prototype.appspot.com",
  messagingSenderId: "949576645162",
  appId: "1:949576645162:web:5ebaa19d4c8b88dcff6153",
};

/**
 * The initialized Firebase app instance.
 */
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
auth.setPersistence(inMemoryPersistence);

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
