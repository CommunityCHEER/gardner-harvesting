import { Text } from 'react-native';
import { Link } from 'expo-router';
import Button from '@/components/Button';
import { useContext, useState, useEffect } from 'react';
import { i18nContext } from '@/i18n';
import { styles } from '@/constants/style';
import { participationContext, firebaseContext } from '@/context';
import { addDoc, collection, doc, getDocs } from 'firebase/firestore';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import {
  Participation as ParticipationInterface,
  Garden,
} from '@/types/firestore';
import { Calendar } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';
import { getDateString } from '@/utility/functions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthState } from '@/hooks/useAuthState';

/**
 * A screen for logging and viewing participation in garden activities.
 * @returns {JSX.Element} The rendered screen.
 */
export default function Participation() {
  const i18n = useContext(i18nContext);
  const t = i18n.t.bind(i18n);

  const [gardens, setGardens] = useState<ItemType<string>[]>([]);
  const [gardenListOpen, setGardenListOpen] = useState(false);
  const [garden, setGarden] = useState<string | null>(null);

  useEffect(() => {
    const effect = async () => {
      const gardensCollection = await getDocs(collection(db, 'gardens'));
      const gardens: ItemType<string>[] = [];
      gardensCollection.forEach(doc => {
        const garden = doc.data() as Garden;
        gardens.push({
          value: doc.id,
          label: `${garden.streetName}${garden.houseNumber ? ', ' + garden.houseNumber + ' ' : ''}${garden.nickname ? '(' + garden.nickname + ')' : ''}`,
        });
      });

      setGardens(gardens);
    };

    effect();
  }, []);

  const [participationLogged, setParticipationLogged] =
    useContext(participationContext);

  const { db, auth } = useContext(firebaseContext);
  const loggedIn = !!useAuthState(auth)[0];

  const logParticipation = async () => {
    setParticipationLogged(true);
    const Participation: ParticipationInterface = {
      date: getDateString(),
      garden: doc(db, 'gardens', garden ?? ''),
    };
    addDoc(
      collection(db, 'people', auth.currentUser?.uid ?? '', 'participation'),
      Participation
    );
  };

  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  useEffect(() => {
    const effect = async () => {
      const participationCollection = await getDocs(
        collection(db, 'people', auth.currentUser?.uid ?? '', 'participation')
      );
      const participation: MarkedDates = {};
      participationCollection.forEach(doc => {
        const participationDoc = doc.data() as ParticipationInterface;
        participation[participationDoc.date] = {
          selected: true,
          selectedColor: '#7CFC00',
        };
      });

      setMarkedDates(participation);
    };

    effect();
  }, []);

  useEffect(() => {
    if (participationLogged)
      setMarkedDates({
        [getDateString()]: {
          selected: true,
          selectedColor: '#7CFC00',
        },
        ...markedDates,
      });
  }, [participationLogged]);

  return (
    <SafeAreaView style={styles.centeredView}>
      {loggedIn ? (
        <>
          <Calendar
            markedDates={markedDates}
            theme={{
              arrowColor: '#0101FF',
              todayTextColor: '#0101FF',
              textDayFontSize: 20,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 16,
            }}
            disabledByDefault
            disableAllTouchEventsForDisabledDays
            style={{ width: 250 }}
          />
          {!participationLogged && (
            <>
              <DropDownPicker
                placeholder={t('selectGarden')}
                open={gardenListOpen}
                setOpen={setGardenListOpen}
                value={garden}
                setValue={setGarden}
                items={gardens}
                setItems={setGardens}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdown}
                textStyle={styles.text}
              />
              {garden && (
                <Button
                  title={t('logParticipation')}
                  onPress={logParticipation}
                />
              )}
            </>
          )}
        </>
      ) : (
        <>
          <Text style={styles.text}>{t('signInWarning')}</Text>
          <Link href="/user" asChild>
            <Button title={t('goToUser')} />
          </Link>
        </>
      )}
    </SafeAreaView>
  );
}
