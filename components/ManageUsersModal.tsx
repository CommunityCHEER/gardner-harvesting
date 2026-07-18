import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Button from '@/components/Button';
import { styles } from '@/constants/style';
import {
  ManageUsersRow,
  ParticipationRosterRoles,
  UpdateCustomClaimsResponse,
} from '@/types/firestore';
import {
  getUsersForRoleManagement,
  updateCustomClaimsForUser,
} from '@/services/adminUsers';

interface ManageUsersModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  loadingLabel: string;
  noUsersLabel: string;
  refreshLabel: string;
  closeLabel: string;
  updateErrorLabel: string;
  roleNoneLabel: string;
  roleGardLabel: string;
  roleAdmLabel: string;
  roleDevLabel: string;
}

type ClaimKey = 'admin' | 'gardener' | 'developer' | 'none';

const getDisplayName = (user: ManageUsersRow): string => {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  if (fullName) return fullName;
  if (user.email) return user.email;
  return user.uid;
};

const getActiveClaim = (roles: ParticipationRosterRoles): ClaimKey => {
  if (roles.admin) return 'admin';
  if (roles.developer) return 'developer';
  if (roles.gardener) return 'gardener';
  return 'none';
};

export default function ManageUsersModal({
  visible,
  onClose,
  title,
  loadingLabel,
  noUsersLabel,
  refreshLabel,
  closeLabel,
  updateErrorLabel,
  roleNoneLabel,
  roleGardLabel,
  roleAdmLabel,
  roleDevLabel,
}: ManageUsersModalProps) {
  const [users, setUsers] = useState<ManageUsersRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (!visible) return;
    setUsers([]);
    setErrorMessage('');
    setPendingUpdates({});
  }, [visible]);

  const setPending = (uid: string, pending: boolean) => {
    setPendingUpdates(previous => ({
      ...previous,
      [uid]: pending,
    }));
  };

  const loadUsers = async () => {
    if (!visible) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await getUsersForRoleManagement();
      const sortedUsers = [...response.users].sort((a, b) =>
        getDisplayName(a).localeCompare(getDisplayName(b), undefined, {
          sensitivity: 'base',
        })
      );
      setUsers(sortedUsers);
    } catch (error: any) {
      setErrorMessage(error?.message ?? 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [visible]);

  const handleRoleChange = async (user: ManageUsersRow, key: ClaimKey) => {
    if (pendingUpdates[user.uid]) return;

    setPending(user.uid, true);
    setErrorMessage('');

    try {
      const result: UpdateCustomClaimsResponse = await updateCustomClaimsForUser({
        uid: user.uid,
        key,
      });

      setUsers(previous =>
        previous.map(entry =>
          entry.uid === user.uid ? { ...entry, roles: result.roles } : entry
        )
      );
    } catch (error: any) {
      setErrorMessage(error?.message ?? updateErrorLabel);
    } finally {
      setPending(user.uid, false);
    }
  };

  const roleOptions: Array<{ key: ClaimKey; label: string }> = [
    { key: 'none', label: roleNoneLabel },
    { key: 'gardener', label: roleGardLabel },
    { key: 'admin', label: roleAdmLabel },
    { key: 'developer', label: roleDevLabel },
  ];

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <View style={{ backgroundColor: 'white', borderRadius: 12, maxHeight: '90%' }}>
          <ScrollView
            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
            keyboardShouldPersistTaps='handled'
          >
            <Text style={[styles.text, { fontWeight: '700', marginBottom: 12 }]}>{title}</Text>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator />
                <Text style={[styles.text, { fontSize: 14, marginTop: 8 }]}>{loadingLabel}</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {users.length === 0 ? (
                  <Text style={[styles.text, { fontSize: 14 }]}>{noUsersLabel}</Text>
                ) : null}
                {users.map(user => {
                  const pending = !!pendingUpdates[user.uid];
                  const activeClaim = getActiveClaim(user.roles);

                  return (
                    <View
                      key={user.uid}
                      style={{
                        borderWidth: 1,
                        borderColor: '#CFCFCF',
                        borderRadius: 8,
                        padding: 10,
                        opacity: pending ? 0.5 : 1,
                        gap: 8,
                      }}
                    >
                      <Text style={[styles.text, { fontSize: 16, textAlign: 'left' }]}>
                        {getDisplayName(user)}
                      </Text>
                      {user.email ? (
                        <Text style={[styles.text, { fontSize: 12, color: '#555', textAlign: 'left' }]}>
                          {user.email}
                        </Text>
                      ) : null}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {roleOptions.map(option => {
                          const selected = activeClaim === option.key;
                          return (
                            <Pressable
                              key={`${user.uid}-${option.key}`}
                              onPress={() => handleRoleChange(user, option.key)}
                              disabled={pending}
                              style={{
                                borderWidth: 1,
                                borderColor: selected ? '#5bb974' : '#CFCFCF',
                                backgroundColor: selected ? '#e9f8ed' : '#FFFFFF',
                                borderRadius: 20,
                                paddingVertical: 6,
                                paddingHorizontal: 10,
                              }}
                            >
                              <Text style={[styles.text, { fontSize: 13 }]}>{option.label}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {errorMessage ? (
              <Text style={[styles.text, { fontSize: 13, color: '#8B0000', marginTop: 8 }]}>
                {errorMessage}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
              <Button title={refreshLabel} onPress={loadUsers} />
              <Button title={closeLabel} onPress={onClose} variant='secondary' />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
