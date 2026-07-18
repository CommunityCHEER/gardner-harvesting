import { Text } from 'react-native';
import { Link } from 'expo-router';
import Button from '@/components/Button';
import { useContext, useState, useEffect } from 'react';
import { i18nContext } from '@/i18n';
import { styles } from '@/constants/style';
import { participationContext, firebaseContext } from '@/context';
import { collection, getDocs } from 'firebase/firestore';
import Dropdown, { DropdownItem } from '@/components/Dropdown';
import ScreenLogo from '@/components/ScreenLogo';
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

  const [gardens, setGardens] = useState<DropdownItem[]>([]);
  const [gardenListOpen, setGardenListOpen] = useState(false);
  const [garden, setGarden] = useState<string | null>(null);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [canManageParticipation, setCanManageParticipation] = useState(false);

  useEffect(() => {
    const effect = async () => {
      const gardensCollection = await getDocs(collection(db, 'gardens'));
      const gardens: DropdownItem[] = [];
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

  useEffect(() => {
    const loadClaims = async () => {
      if (!loggedIn || !auth.currentUser) {
        setCanManageParticipation(false);
        return;
      }

      const token = await auth.currentUser.getIdTokenResult();
      setCanManageParticipation(
        token.claims.admin === true || token.claims.developer === true
      );
    };

    loadClaims();
  }, [loggedIn, auth.currentUser]);

  const logParticipation = async () => {
    if (!auth.currentUser?.uid || !garden) return;
    setParticipationLogged(true);
    const { logParticipationForUser } = require('@/services/participation');
    await logParticipationForUser(db, auth.currentUser.uid, garden);
  };

  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  const AdminParticipationModal = adminModalVisible
    ? require('@/components/AdminParticipationModal').default
    : null;

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
      <ScreenLogo />
      {loggedIn ? (
        <>
          <Text style={[styles.text, { fontSize: 12, fontWeight: 'bold', marginBottom: 20 }]}>
            {t('recordYourParticipation')}
          </Text>
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
          <Dropdown
            placeholder={t('selectGarden')}
            open={gardenListOpen}
            setOpen={setGardenListOpen}
            value={garden}
            setValue={setGarden}
            items={gardens}
            style={styles.dropdown}
            textStyle={styles.text}
          />
          {garden && !participationLogged && (
            <Button title={t('logParticipation')} onPress={logParticipation} />
          )}
          {participationLogged ? (
            <Text style={[styles.text, { marginTop: 8 }]}>
              {t('participationLogged')}
            </Text>
          ) : null}
          {canManageParticipation && (
            <Button
              title={t('manageParticipationAsAdmin')}
              onPress={() => setAdminModalVisible(true)}
            />
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
      {AdminParticipationModal ? (
        <AdminParticipationModal
          visible={adminModalVisible}
          onClose={() => setAdminModalVisible(false)}
          title={t('adminParticipationTitle')}
          selectDateLabel={t('adminSelectDate')}
          selectGardenLabel={t('adminSelectGarden')}
          loadingLabel={t('adminLoadingRoster')}
          noUsersLabel={t('adminNoUsers')}
          refreshLabel={t('adminRefresh')}
          closeLabel={t('adminClose')}
          checkedLabel={t('adminChecked')}
          uncheckedLabel={t('adminUnchecked')}
          gardens={gardens}
        />
      ) : null}
    </SafeAreaView>
  );
}
