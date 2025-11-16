import { createContext } from 'react';
import { auth, db, storage, realtime } from '@/firebaseConfig';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import React from 'react';
import { Database } from 'firebase/database';

/**
 * Interface for the Firebase context, providing access to Firebase services.
 */
export interface FirebaseContext {
  /** The Firebase Authentication instance. */
  auth: Auth;
  /** The Firestore database instance. */
  db: Firestore;
  /** The Firebase Storage instance. */
  storage: FirebaseStorage;
  /** The Firebase Realtime Database instance. */
  realtime: Database;
}

/**
 * React context for providing Firebase services to components.
 */
export const firebaseContext = createContext<FirebaseContext>({
  auth,
  db,
  storage,
  realtime,
});

/**
 * React context for managing participation state.
 */
export const participationContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>]
>([false, () => {}]);
