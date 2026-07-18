import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ManageUsersModal from '../ManageUsersModal';

jest.mock('@/services/adminUsers', () => ({
  getUsersForRoleManagement: jest.fn(),
  updateCustomClaimsForUser: jest.fn(),
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

jest.mock('@/constants/style', () => ({
  styles: {
    text: {},
  },
}));

const { getUsersForRoleManagement, updateCustomClaimsForUser } = require('@/services/adminUsers');

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  title: 'Manage users',
  loadingLabel: 'Loading users...',
  noUsersLabel: 'No users found',
  refreshLabel: 'Refresh',
  closeLabel: 'Close',
  updateErrorLabel: 'Unable to update role',
  roleNoneLabel: 'none',
  roleGardLabel: 'gard',
  roleAdmLabel: 'adm',
  roleDevLabel: 'dev',
};

describe('ManageUsersModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getUsersForRoleManagement as jest.Mock).mockResolvedValue({
      users: [
        {
          uid: 'user-1',
          email: 'user1@example.com',
          firstName: 'Ava',
          lastName: 'Stone',
          roles: { admin: false, gardener: true, developer: false },
        },
      ],
    });

    (updateCustomClaimsForUser as jest.Mock).mockResolvedValue({
      uid: 'user-1',
      email: 'user1@example.com',
      roles: { admin: true, gardener: false, developer: false },
    });
  });

  it('loads and displays users when visible', async () => {
    const screen = render(<ManageUsersModal {...baseProps} />);

    await waitFor(() => {
      expect(getUsersForRoleManagement).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Ava Stone')).toBeTruthy();
    expect(screen.getByText('gard')).toBeTruthy();
    expect(screen.getByText('adm')).toBeTruthy();
    expect(screen.getByText('dev')).toBeTruthy();
    expect(screen.getByText('none')).toBeTruthy();
  });

  it('updates a user role when selecting a role option', async () => {
    const screen = render(<ManageUsersModal {...baseProps} />);

    await waitFor(() => {
      expect(getUsersForRoleManagement).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByText('adm'));

    await waitFor(() => {
      expect(updateCustomClaimsForUser).toHaveBeenCalledWith({
        uid: 'user-1',
        key: 'admin',
      });
    });
  });

  it('sends none when clearing all claims', async () => {
    const screen = render(<ManageUsersModal {...baseProps} />);

    await waitFor(() => {
      expect(getUsersForRoleManagement).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByText('none'));

    await waitFor(() => {
      expect(updateCustomClaimsForUser).toHaveBeenCalledWith({
        uid: 'user-1',
        key: 'none',
      });
    });
  });
});