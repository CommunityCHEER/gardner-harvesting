import { Stack } from 'expo-router/stack';
import {
  firebaseContext,
  FirebaseContext,
  participationContext,
} from '@/context';
import { auth as authImport, db, storage, realtime } from '@/firebaseConfig';
import { i18nContext, useI18n } from '@/i18n';
import { useState, useEffect } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { getDateString } from '@/utility/functions';
import { Participation } from '@/types/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function Layout() {
  const i18n = useI18n();

  const firebaseState: FirebaseContext = {
    auth: authImport,
    db,
    storage,
    realtime,
  };
  const auth = useAuthState(firebaseState.auth)[0];

  const [participationLogged, setParticipationLogged] = useState(false);
  useEffect(() => {
    const effect = async () => {
      if (!auth?.uid) return;
      console.warn('checking for participation');
      const participationCollection = await getDocs(
        collection(db, 'people', auth?.uid ?? '', 'participation')
      );
      if (
        participationCollection.docs.find(doc => {
          const data = doc.data() as Participation;
          return data.date === getDateString();
        })
      )
        setParticipationLogged(true);
    };

    effect();
  }, [auth]);

  return (
    <participationContext.Provider
      value={[participationLogged, setParticipationLogged]}
    >
      <i18nContext.Provider value={i18n}>
        <firebaseContext.Provider value={firebaseState}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </firebaseContext.Provider>
      </i18nContext.Provider>
    </participationContext.Provider>
  );
}
