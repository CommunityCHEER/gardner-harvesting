import React from 'react';
import { render } from '@testing-library/react-native';
import Index from '../index';

jest.mock('@/context', () => {
  const React = require('react');

  return {
    firebaseContext: React.createContext({
      auth: { currentUser: null },
      db: {},
      storage: {},
      realtime: {},
    }),
    participationContext: React.createContext([false, jest.fn()]),
  };
});

jest.mock('@/hooks/useAuthState', () => ({
  useAuthState: () => [null],
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [], forEach: () => undefined })),
}));

jest.mock('expo-router', () => ({
  __esModule: true,
  Link: ({ children }: any) => children,
}));

jest.mock('@/components/Button', () => {
  const { Text } = jest.requireActual('react-native');
  return { __esModule: true, default: ({ title }: any) => <Text>{title}</Text> };
});

jest.mock('@/components/VersionDisplay', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  show: jest.fn(),
  default: () => null,
}));

jest.mock('@/components/Welcome', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/HarvestForm', () => ({
  __esModule: true,
  default: () => null,
}));

describe('Index tab', () => {
  test('renders the screen logo on the main screen', () => {
    const { getByTestId } = render(<Index />);

    expect(getByTestId('screen-logo')).toBeTruthy();
  });
});