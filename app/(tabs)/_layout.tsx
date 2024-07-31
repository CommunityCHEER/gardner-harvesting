import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useContext } from 'react';
import { i18nContext } from '@/i18n';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseContext } from '@/context';

export default function TabLayout() {
  const i18n = useContext(i18nContext);
  const t = i18n.t.bind(i18n);

  const { auth } = useContext(firebaseContext);

  const loggedIn = !!useAuthState(auth)[0];

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue', headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('harvest'),
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="shopping-basket" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="participation"
        options={{
          // Here, `undefined` makes it use the tab name as the href
          href: loggedIn ? undefined : null,
          title: t('participation'),
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="calendar-check-o" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: t('user'),
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
