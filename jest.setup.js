// Setup file for jest
import '@testing-library/react-native';

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const createIconComponent = (name) => {
    return ({ name: iconName, ...props }) => React.createElement(Text, props, iconName || name);
  };
  
  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === '__esModule') return true;
      if (prop === 'default') return target;
      return createIconComponent(String(prop));
    }
  });
});

jest.mock('expo-localization', () => ({
  getLocales: () => ([{
    languageCode: 'en',
    languageTag: 'en-US',
  }]),
  useLocales: () => ([{
    languageCode: 'en',
    languageTag: 'en-US',
  }]),
}));

jest.mock('@/firebaseConfig', () => ({
  db: {},
  auth: {},
  realtime: {},
  storage: {},
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    _getProvider: () => ({
      getImmediate: () => ({
        isInitialized: () => Promise.resolve(true),
      }),
    }),
  })),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  getDoc: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  set: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

jest.mock('react-firebase-hooks/database', () => ({
  useList: () => ([[], false, undefined]),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn(),
}));

jest.mock('react-native-dropdown-picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props) => {
    return React.createElement(View, { ...props, testID: props.testID || 'mocked-dropdown' });
  };
});
