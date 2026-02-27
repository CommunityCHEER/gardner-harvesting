import { Text, Keyboard, View } from 'react-native';
import Button from '@/components/Button';
import { useContext, useState, useEffect } from 'react';
import { i18nContext } from '@/i18n';
import { Link } from 'expo-router';
import { styles } from '@/constants/style';
import HarvestForm from '@/components/HarvestForm';
import Welcome from '@/components/Welcome';
import VersionDisplay from '@/components/VersionDisplay';
import Toast from 'react-native-toast-message';
import { participationContext, firebaseContext } from '@/context';
import { addDoc, collection, getDocs, doc } from 'firebase/firestore';
import { Participation, Garden } from '@/types/firestore';
import { getDateString } from '@/utility/functions';
import Dropdown, { DropdownItem } from '@/components/Dropdown';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthState } from '@/hooks/useAuthState';

/**
 * The main screen of the app, where users can select a garden and start harvesting.
 * @returns {JSX.Element} The rendered screen.
 */
export default function Index() {
  const firebase = useContext(firebaseContext);
  const { db, auth } = firebase;
  const loggedIn = !!useAuthState(auth)[0];

  const i18n = useContext(i18nContext);
  const translate = i18n.t.bind(i18n);

  const [gardens, setGardens] = useState<DropdownItem[]>([]);
  const [gardenListOpen, setGardenListOpen] = useState(false);
  const [garden, setGarden] = useState<string | null>(null);

  const [claims, setClaims] = useState<any>(null);
  const [claimsChecks, setClaimsChecks] = useState<number>(0);
  const [claimsLoading, setClaimsLoading] = useState(false);

  useEffect(() => {
    const fetchClaims = async () => {
      if (!loggedIn || !auth.currentUser) return;
      setClaimsLoading(true);
      try {
        const token = await auth.currentUser.getIdTokenResult(claimsChecks > 0);
        setClaims(token.claims);
      } finally {
        setClaimsLoading(false);
      }
    };

    fetchClaims();
  }, [claimsChecks]);

  useEffect(() => {
    const fetchGardens = async () => {
      if (!loggedIn || !auth.currentUser) return;

      const gardensCollection = await getDocs(collection(db, 'gardens'));
      const gardens: DropdownItem[] = [];
      gardensCollection.forEach(doc => {
        const garden = doc.data() as Garden;
        gardens.push({
          value: doc.id,
          label: `${garden.streetName}${garden.houseNumber ? ', ' + garden.houseNumber + ' ' : ''
            }${garden.nickname ? '(' + garden.nickname + ')' : ''}`,
        });
      });

      setGardens(gardens);
    };

    fetchGardens();
  }, [claims]);

  const [harvesting, setHarvesting] = useState(false);
  const [participationLogged, setParticipationLogged] = useContext(participationContext);

  const logParticipation = () => {
    if (!loggedIn || !auth.currentUser || !garden) {
      Toast.show({ type: 'error', text1: translate('signInWarning') });
      return;
    }

    const participation: Participation = {
      date: getDateString(),
      garden: doc(db, 'gardens', garden),
    };

    addDoc(
      collection(db, 'people', auth.currentUser.uid, 'participation'),
      participation
    ).then(() => {
      Toast.show({ type: 'info', text1: translate('participationLogged') });
      setParticipationLogged(true);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {loggedIn && !!auth.currentUser ? (
        <>
          {!harvesting && !garden && <Welcome />}
          {(!claims || (!claims.developer && !claims.admin && !claims.gardener)) && (
            <View style={styles.centeredView}>
              <Text style={styles.text}>{translate('noClaimsForGardens')}</Text>
              {claims && (
                <Text style={styles.text}>
                  {claims.developer && translate('youAreDeveloper')}
                  {claims.admin && translate('youAreAdmin')}
                  {claims.gardener && translate('youAreGardener')}
                  {!claims.developer &&
                    !claims.admin &&
                    !claims.gardener &&
                    translate('youHaveNoRole')}
                </Text>
              )}
              <Button
                title={translate('refreshClaims')}
                onPress={() =>
                  setClaimsChecks(prevClaimsChecks => prevClaimsChecks + 1)
                }
                disabled={claimsLoading}
              />
            </View>
          )}
          {harvesting && db && (
            <HarvestForm
              garden={garden}
              setGarden={setGarden}
              gardens={gardens}
              gardenListOpen={gardenListOpen}
              setGardenListOpen={setGardenListOpen}
              onBack={() => setHarvesting(false)}
              db={db}
              auth={auth}
              realtime={firebase.realtime}
              storage={firebase.storage}
            />
          )}
          {!harvesting && garden && (
            <View style={styles.centeredView}>
              {gardens.length > 0 && (
                <Dropdown
                  placeholder={translate('selectGarden')}
                  open={gardenListOpen}
                  setOpen={setGardenListOpen}
                  value={garden}
                  setValue={setGarden}
                  items={gardens}
                  style={styles.dropdown}
                  textStyle={styles.text}
                  onPress={Keyboard.dismiss}
                />
              )}
              <Button
                title={translate('startHarvest')}
                onPress={() => setHarvesting(true)}
              />
              {!participationLogged && (
                <Button
                  title={translate('logParticipation')}
                  onPress={logParticipation}
                />
              )}
            </View>
          )}
          {!harvesting && !garden && gardens.length > 0 && (
            <Dropdown
              placeholder={translate('selectGarden')}
              open={gardenListOpen}
              setOpen={setGardenListOpen}
              value={garden}
              setValue={setGarden}
              items={gardens}
              style={styles.dropdown}
              textStyle={styles.text}
              onPress={Keyboard.dismiss}
            />
          )}
        </>
      ) : (
        <View style={styles.centeredView}>
          <Text style={styles.text}>{translate('signInWarning')}</Text>
          <Link href="/user" asChild>
            <Button title={translate('goToUser')} />
          </Link>
        </View>
      )}
      <VersionDisplay />
      <Toast position="bottom" />
    </SafeAreaView>
  );
}
