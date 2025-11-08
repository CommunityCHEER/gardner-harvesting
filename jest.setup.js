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
