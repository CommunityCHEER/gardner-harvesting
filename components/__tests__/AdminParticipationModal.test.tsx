import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AdminParticipationModal from '../AdminParticipationModal';

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: {
    open: jest.fn(),
  },
}));

jest.mock('react-native-calendars', () => ({
  __esModule: true,
  Calendar: () => null,
}));

jest.mock('@/services/adminParticipation', () => ({
  getParticipationRoster: jest.fn(),
  toggleParticipationForUser: jest.fn(),
}));

jest.mock('@/components/Button', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ title, onPress }: any) => (
      <Pressable accessibilityRole='button' onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/components/Dropdown', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ items, setValue, placeholder }: any) => (
      <View>
        <Text>{placeholder}</Text>
        {items.map((item: any) => (
          <Pressable
            key={item.value}
            accessibilityRole='button'
            onPress={() => setValue(item.value)}
          >
            <Text>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    ),
  };
});

jest.mock('@/constants/style', () => ({
  styles: {
    text: {},
    dropdown: {},
  },
}));

jest.mock('@/utility/functions', () => ({
  getDateString: () => '2026-07-18',
}));

const { getParticipationRoster, toggleParticipationForUser } = require('@/services/adminParticipation');

const gardens = [
  { label: 'Garden A', value: 'garden-a' },
  { label: 'Garden B', value: 'garden-b' },
];

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  title: 'Admin participation manager',
  selectDateLabel: 'Select date',
  selectGardenLabel: 'Select garden',
  loadingLabel: 'Loading roster...',
  noUsersLabel: 'No users found',
  refreshLabel: 'Refresh',
  closeLabel: 'Close',
  checkedLabel: 'Participation logged',
  uncheckedLabel: 'Not logged',
  gardens,
};

describe('AdminParticipationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getParticipationRoster as jest.Mock).mockImplementation(({ gardenId }: any) => {
      if (gardenId === 'garden-a') {
        return Promise.resolve({
          date: '2026-07-18',
          users: [
            {
              uid: 'user-1',
              email: 'user@example.com',
              firstName: 'Ava',
              lastName: 'Stone',
              roles: { admin: false, gardener: true, developer: false },
              hasParticipation: true,
            },
          ],
        });
      }

      if (gardenId === 'garden-b') {
        return Promise.resolve({
          date: '2026-07-18',
          users: [
            {
              uid: 'user-1',
              email: 'user@example.com',
              firstName: 'Ava',
              lastName: 'Stone',
              roles: { admin: false, gardener: true, developer: false },
              hasParticipation: false,
            },
          ],
        });
      }

      return Promise.resolve({ date: '2026-07-18', users: [] });
    });

    (toggleParticipationForUser as jest.Mock).mockResolvedValue({
      uid: 'user-1',
      date: '2026-07-18',
      hasParticipation: true,
    });
  });

  it('reloads roster when the garden changes', async () => {
    const screen = render(<AdminParticipationModal {...baseProps} />);

    fireEvent.press(screen.getByText('Garden A'));

    await waitFor(() => {
      expect(getParticipationRoster).toHaveBeenCalledWith({
        date: '2026-07-18',
        gardenId: 'garden-a',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Participation logged')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Garden B'));

    await waitFor(() => {
      expect(getParticipationRoster).toHaveBeenCalledWith({
        date: '2026-07-18',
        gardenId: 'garden-b',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Not logged')).toBeTruthy();
    });
  });
});