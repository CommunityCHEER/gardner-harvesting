import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useContext } from 'react';
import { i18nContext } from '@/i18n';
import { useAuthState } from '@/hooks/useAuthState';
import { firebaseContext } from '@/context';

/**
 * The layout component for the main tabs of the application.
 * @returns {JSX.Element} The rendered tab layout.
 */
export default function TabLayout() {
  const i18n = useContext(i18nContext);
  const t = i18n.t.bind(i18n);
  const isAndroid = Platform.OS === 'android';

  const { auth } = useContext(firebaseContext);

  const loggedIn = !!useAuthState(auth)[0];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5bb974',
        headerShown: false,
        tabBarStyle: {
          height: isAndroid ? 72 : 60,
          paddingBottom: isAndroid ? 10 : 0,
          paddingTop: isAndroid ? 6 : 0,
        },
        tabBarItemStyle: { paddingHorizontal: 4 },
        tabBarLabelStyle: {
          fontSize: 14,
          lineHeight: 16,
          marginBottom: isAndroid ? 2 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('harvest'),
          tabBarIcon: ({ color }) => (
            <FontAwesome size={12} name="shopping-basket" color={color} />
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
            <FontAwesome size={12} name="calendar-check-o" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: t('user'),
          tabBarIcon: ({ color }) => (
            <FontAwesome size={12} name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
