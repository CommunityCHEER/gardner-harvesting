import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import TabLayout from '../_layout';

const mockTabs = jest.fn();
const mockTabsScreen = jest.fn();

const mockUseSafeAreaInsets = jest.fn(() => ({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}));

jest.mock('expo-router', () => ({
  __esModule: true,
  Tabs: Object.assign(
    (props: unknown) => {
      mockTabs(props);
      return null;
    },
    {
      Screen: (props: unknown) => {
        mockTabsScreen(props);
        return null;
      },
    }
  ),
}));

jest.mock('@expo/vector-icons/FontAwesome', () => 'FontAwesome');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockUseSafeAreaInsets(),
}));

jest.mock('@/hooks/useAuthState', () => ({
  useAuthState: () => [null],
}));

jest.mock('@/context', () => {
  const React = require('react');

  return {
    firebaseContext: React.createContext({
      auth: { currentUser: null },
      db: {},
      storage: {},
      realtime: {},
    }),
  };
});

describe('TabLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      configurable: true,
    });
  });

  test('uses minimum Android bottom spacing when inset is small', () => {
    mockUseSafeAreaInsets.mockReturnValue({ top: 0, right: 0, bottom: 0, left: 0 });

    render(<TabLayout />);

    const screenOptions = mockTabs.mock.calls[0][0].screenOptions;

    expect(screenOptions.tabBarStyle.paddingBottom).toBe(10);
    expect(screenOptions.tabBarStyle.height).toBe(72);
    expect(screenOptions.tabBarHideOnKeyboard).toBe(true);
  });

  test('increases Android tab bar spacing when bottom inset is large', () => {
    mockUseSafeAreaInsets.mockReturnValue({ top: 0, right: 0, bottom: 24, left: 0 });

    render(<TabLayout />);

    const screenOptions = mockTabs.mock.calls[0][0].screenOptions;

    expect(screenOptions.tabBarStyle.paddingBottom).toBe(28);
    expect(screenOptions.tabBarStyle.height).toBe(90);
  });
});