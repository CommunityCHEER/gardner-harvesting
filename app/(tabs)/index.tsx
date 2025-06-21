import { Keyboard, KeyboardAvoidingView, Platform, Text } from 'react-native';
import Button from '@/components/Button';
import { useContext, useState, useEffect } from 'react';
import { i18nContext } from '@/i18n';
import { Link } from 'expo-router';
import { styles } from '@/constants/style';
import HarvestForm from '@/components/HarvestForm';
import Welcome from '@/components/Welcome';
import Toast from 'react-native-toast-message';
import { participationContext, firebaseContext } from '@/context';
import { addDoc, collection, getDocs, doc } from 'firebase/firestore';
import { Participation, Garden } from '@/types/firestore';
import { getDateString } from '@/utility/functions';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function Index() {
  const { db, auth } = useContext(firebaseContext);
  const loggedIn = !!useAuthState(auth)[0];

  const i18n = useContext(i18nContext);
  const translate = i18n.t.bind(i18n);

  const [gardens, setGardens] = useState<ItemType<string>[]>([]);
  const [gardenListOpen, setGardenListOpen] = useState(false);
  const [garden, setGarden] = useState<string | null>(null);

  const [claims, setClaims] = useState<any>(null);
  const [claimsChecks, setClaimsChecks] = useState<number>(0);

  useEffect(() => {
    const fetchClaims = async () => {
      if(!loggedIn || !auth.currentUser) return;

      const token = await auth.currentUser.getIdTokenResult(claimsChecks > 0);
      setClaims(token.claims);
    };

    fetchClaims();
  }, [claimsChecks]);

  useEffect(() => {
    const fetchGardens = async () => {
      if (!loggedIn || !auth.currentUser) return;

      const gardensCollection = await getDocs(collection(db, 'gardens'));
      const gardens: ItemType<string>[] = [];
      gardensCollection.forEach(doc => {
        const garden = doc.data() as Garden;
        gardens.push({
          value: doc.id,
          label: `${garden.streetName}${
            garden.houseNumber ? ', ' + garden.houseNumber + ' ' : ''
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
    <SafeAreaView style={styles.centeredView}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 64} // Adjust the offset as needed
      >
        <SafeAreaView style={styles.centeredView}>
          {loggedIn && !!auth.currentUser ? (
            <>
              {!harvesting && <Welcome />}
              <DropDownPicker
                placeholder={translate('selectGarden')}
                open={gardenListOpen}
                setOpen={setGardenListOpen}
                value={garden}
                setValue={setGarden}
                items={gardens}
                setItems={setGardens}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdown}
                textStyle={styles.text}
                onPress={Keyboard.dismiss}
                listMode="MODAL"
              />
              {(!claims || (!claims.developer && !claims.admin && !claims.gardener)) && (
                <>
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
                  />
                </>
              )}
              {harvesting && (
                <>
                  <HarvestForm garden={garden ?? ''} />
                  <Button
                    title={translate('back')}
                    onPress={() => setHarvesting(false)}
                  />
                </>
              )}
              {!harvesting && garden && (
                <>
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
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.text}>{translate('signInWarning')}</Text>
              <Link href="/user" asChild>
                <Button title={translate('goToUser')} />
              </Link>
            </>
          )}
          <Toast position="bottom" />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
