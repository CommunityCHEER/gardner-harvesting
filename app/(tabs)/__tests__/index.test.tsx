import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Index from '../index';
import { firebaseContext } from '@/context';

const mockAuth = {
  currentUser: null as
    | null
    | { uid: string; getIdTokenResult: (forceRefresh?: boolean) => Promise<any> },
};

let mockAuthStateUser: null | { uid: string } = null;

const mockCollection = jest.fn((...args: unknown[]) => ({
  path: args.slice(1).join('/'),
}));

const mockGetDocs = jest.fn((ref: { path?: string }) => {
  if (ref?.path === 'gardens') {
    const docs = [
      {
        id: 'garden-1',
        data: () => ({ streetName: 'Main', houseNumber: '1', nickname: 'North' }),
      },
    ];

    return Promise.resolve({
      docs,
      forEach: (callback: (doc: any) => void) => docs.forEach(callback),
    });
  }

  return Promise.resolve({ docs: [], forEach: () => undefined });
});

jest.mock('@/context', () => {
  const React = require('react');

  return {
    firebaseContext: React.createContext({
      auth: mockAuth,
      db: {},
      storage: {},
      realtime: {},
    }),
    participationContext: React.createContext([false, jest.fn()]),
  };
});

jest.mock('@/hooks/useAuthState', () => ({
  useAuthState: () => [mockAuthStateUser],
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: jest.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
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
  const firebaseValue = {
    auth: mockAuth,
    db: {},
    storage: {},
    realtime: {},
  };

  beforeEach(() => {
    mockAuthStateUser = null;
    mockAuth.currentUser = null;
    jest.clearAllMocks();
  });

  test('renders the screen logo on the main screen', () => {
    const { getByTestId } = render(
      <firebaseContext.Provider value={firebaseValue as any}>
        <Index />
      </firebaseContext.Provider>
    );

    expect(getByTestId('screen-logo')).toBeTruthy();
  });

  test('fetches gardens after auth state resolves from logged out to logged in', async () => {
    const getIdTokenResult = jest
      .fn()
      .mockResolvedValue({ claims: { gardener: true } });

    const { rerender } = render(
      <firebaseContext.Provider value={firebaseValue as any}>
        <Index />
      </firebaseContext.Provider>
    );

    mockAuthStateUser = { uid: 'user-1' };
    mockAuth.currentUser = {
      uid: 'user-1',
      getIdTokenResult,
    };

    rerender(
      <firebaseContext.Provider value={firebaseValue as any}>
        <Index />
      </firebaseContext.Provider>
    );

    await waitFor(() => {
      expect(mockCollection).toHaveBeenCalledWith(firebaseValue.db, 'gardens');
      expect(mockGetDocs).toHaveBeenCalledWith({ path: 'gardens' });
    });
  });
});