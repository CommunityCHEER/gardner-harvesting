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

export const firebaseConfig = {
  apiKey: 'AIzaSyAql__a3U-pgQ21bTofEN_otegnM0N11lM',
  authDomain: 'cheer-app-prototype.firebaseapp.com',
  projectId: 'cheer-app-prototype',
  storageBucket: 'cheer-app-prototype.appspot.com',
  messagingSenderId: '949576645162',
  appId: '1:949576645162:web:5ebaa19d4c8b88dcff6153',
};

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

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtime = getDatabase(app);
