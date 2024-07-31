import { createContext } from 'react';
import { auth, db, storage, realtime } from '@/firebaseConfig';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import React from 'react';
import { Database } from 'firebase/database';

export interface FirebaseContext {
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  realtime: Database;
}

export const firebaseContext = createContext<FirebaseContext>({
  auth,
  db,
  storage,
  realtime,
});

export const participationContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>]
>([false, () => {}]);
