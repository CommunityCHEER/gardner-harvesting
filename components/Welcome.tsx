import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { i18nContext } from '@/i18n';
import { firebaseContext } from '@/context';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/types/firestore';
import { styles } from '@/constants/style';

/**
 * A component that displays a welcome message to the currently logged-in user.
 * @returns {JSX.Element} The rendered component.
 */
export default function Welcome() {
  const i18n = useContext(i18nContext);
  const t = i18n.t.bind(i18n);

  const { db, auth } = useContext(firebaseContext);

  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const effect = async () => {
      const user = (
        await getDoc(doc(db, 'people', auth.currentUser?.uid ?? ''))
      ).data() as User;
      setFullName(`${user.firstName} ${user.lastName}`);
    };

    effect();
  });

  return (
    <View style={{ alignItems: 'center', padding: 20 }}>
      {fullName ? (
        <Text style={{ fontSize: 40, fontWeight: 'bold', textAlign: 'center' }}>
          {t('hello')}, {fullName}
        </Text>
      ) : (
        <ActivityIndicator />
      )}
    </View>
  );
}
