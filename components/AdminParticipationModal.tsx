import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Button from '@/components/Button';
import Dropdown, { DropdownItem } from '@/components/Dropdown';
import { styles } from '@/constants/style';
import {
  ParticipationRosterUser,
  ToggleParticipationResponse,
} from '@/types/firestore';
import {
  getParticipationRoster,
  toggleParticipationForUser,
} from '@/services/adminParticipation';
import { getDateString } from '@/utility/functions';

interface AdminParticipationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  selectDateLabel: string;
  selectGardenLabel: string;
  swipeHintLabel: string;
  loadingLabel: string;
  noUsersLabel: string;
  refreshLabel: string;
  closeLabel: string;
  checkedLabel: string;
  uncheckedLabel: string;
  gardens: DropdownItem[];
}

const addDays = (dateString: string, days: number): string => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const getDisplayName = (user: ParticipationRosterUser): string => {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  if (fullName) return fullName;
  if (user.email) return user.email;
  return user.uid;
};

export default function AdminParticipationModal({
  visible,
  onClose,
  title,
  selectDateLabel,
  selectGardenLabel,
  swipeHintLabel,
  loadingLabel,
  noUsersLabel,
  refreshLabel,
  closeLabel,
  checkedLabel,
  uncheckedLabel,
  gardens,
}: AdminParticipationModalProps) {
  const today = getDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [gardenListOpen, setGardenListOpen] = useState(false);
  const [gardenId, setGardenId] = useState<string | null>(null);
  const [users, setUsers] = useState<ParticipationRosterUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (!visible) return;
    setSelectedDate(getDateString());
  }, [visible]);

  const loadRoster = async () => {
    if (!visible) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await getParticipationRoster({ date: selectedDate });
      const sortedUsers = [...response.users].sort((a, b) =>
        getDisplayName(a).localeCompare(getDisplayName(b), undefined, {
          sensitivity: 'base',
        })
      );
      setUsers(sortedUsers);
    } catch (error: any) {
      setErrorMessage(error?.message ?? 'Unable to load roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [visible, selectedDate]);

  const setPending = (uid: string, pending: boolean) => {
    setPendingToggles(previous => ({
      ...previous,
      [uid]: pending,
    }));
  };

  const handleToggle = async (user: ParticipationRosterUser) => {
    if (!gardenId) return;
    if (pendingToggles[user.uid]) return;

    setPending(user.uid, true);

    try {
      const result: ToggleParticipationResponse = await toggleParticipationForUser({
        uid: user.uid,
        date: selectedDate,
        gardenId,
      });

      setUsers(previous =>
        previous.map(entry =>
          entry.uid === user.uid
            ? { ...entry, hasParticipation: result.hasParticipation }
            : entry
        )
      );
    } catch (error: any) {
      setErrorMessage(error?.message ?? 'Unable to update participation');
    } finally {
      setPending(user.uid, false);
    }
  };

  const previousDay = () => setSelectedDate(value => addDays(value, -1));
  const nextDay = () =>
    setSelectedDate(value => {
      const candidate = addDays(value, 1);
      return candidate > today ? value : candidate;
    });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 18 && Math.abs(gestureState.dy) < 20,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -40) {
            previousDay();
            return;
          }
          if (gestureState.dx >= 40) {
            nextDay();
          }
        },
      }),
    [today]
  );

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
            <Text style={[styles.text, { fontSize: 14, marginBottom: 8 }]}>{selectDateLabel}</Text>
            <Calendar
              maxDate={today}
              current={selectedDate}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: '#5bb974',
                },
              }}
              onDayPress={(day) => {
                if (day.dateString <= today) {
                  setSelectedDate(day.dateString);
                }
              }}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.text, { fontSize: 14 }]}>{swipeHintLabel}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
              <Button title='<' onPress={previousDay} />
              <Text style={[styles.text, { fontSize: 16, marginHorizontal: 8, alignSelf: 'center' }]}>
                {selectedDate}
              </Text>
              <Button title='>' onPress={nextDay} disabled={selectedDate >= today} />
            </View>

            <Text style={[styles.text, { fontSize: 14, marginBottom: 6 }]}>{selectGardenLabel}</Text>
            <Dropdown
              placeholder={selectGardenLabel}
              open={gardenListOpen}
              setOpen={setGardenListOpen}
              value={gardenId}
              setValue={setGardenId}
              items={gardens}
              style={styles.dropdown}
              textStyle={styles.text}
            />

            <View {...panResponder.panHandlers} style={{ marginTop: 8 }}>
              {loading ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator />
                  <Text style={[styles.text, { fontSize: 14, marginTop: 8 }]}>{loadingLabel}</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {users.length === 0 && (
                    <Text style={[styles.text, { fontSize: 14 }]}>{noUsersLabel}</Text>
                  )}
                  {users.map(user => {
                    const checked = user.hasParticipation;
                    const pending = !!pendingToggles[user.uid];
                    return (
                      <Pressable
                        key={user.uid}
                        onPress={() => handleToggle(user)}
                        disabled={!gardenId || pending}
                        style={{
                          borderWidth: 1,
                          borderColor: checked ? '#5bb974' : '#CFCFCF',
                          backgroundColor: checked ? '#e9f8ed' : '#FFFFFF',
                          borderRadius: 8,
                          padding: 10,
                          opacity: !gardenId || pending ? 0.5 : 1,
                        }}
                      >
                        <Text style={[styles.text, { fontSize: 16, textAlign: 'left' }]}>
                          {getDisplayName(user)}
                        </Text>
                        <Text style={[styles.text, { fontSize: 13, textAlign: 'left' }]}>
                          {checked ? checkedLabel : uncheckedLabel}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {errorMessage ? (
              <Text style={[styles.text, { fontSize: 13, color: '#8B0000', marginTop: 8 }]}>
                {errorMessage}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
              <Button title={refreshLabel} onPress={loadRoster} />
              <Button title={closeLabel} onPress={onClose} variant='secondary' />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
