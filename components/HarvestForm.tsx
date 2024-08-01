import { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Keyboard,
  TextInput,
} from 'react-native';
import Button from '@/components/Button';
import { i18nContext } from '@/i18n';
import { styles } from '@/constants/style';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import { firebaseContext, participationContext } from '@/context';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  DocumentReference,
} from 'firebase/firestore';
import { useLocales } from 'expo-localization';
import {
  Harvest,
  HarvestMeasure,
  RealtimeHarvest,
  Participation,
  Unit,
} from '@/types/firestore';
import Toast from 'react-native-toast-message';
import { ref, set } from 'firebase/database';
import { useList } from 'react-firebase-hooks/database';
import { getDateString } from '@/utility/functions';

export default function HarvestForm({ garden }: { garden: string }) {
  const locales = useLocales();
  const locale = locales[0].languageCode ?? '';

  const i18n = useContext(i18nContext);
  const t = i18n.t.bind(i18n);

  const { db, auth, realtime } = useContext(firebaseContext);

  const [crops, setCrops] = useState<ItemType<string>[]>([]);
  const [cropListOpen, setCropListOpen] = useState(false);
  const [crop, setCrop] = useState<string | null>(null);
  const [unit, setUnit] = useState<{
    id: string;
    name: string;
    fractional: boolean;
  } | null>(null);

  useEffect(() => {
    const effect = async () => {
      const cropsCollection = await getDocs(collection(db, 'crops'));
      const crops: ItemType<string>[] = [];
      cropsCollection.forEach(async document => {
        crops.push({
          value: document.id,
          label: (
            await getDoc(doc(db, 'crops', document.id, 'name', locale))
          ).data()?.value,
        });
      });

      setCrops(crops);
    };

    effect();
  }, [locale]);

  useEffect(() => {
    const effect = async () => {
      if (!crop) setUnit(null);
      else {
        const unitDoc = (
          await getDoc(doc(db, 'crops', crop, 'units', 'required'))
        ).data()?.value as DocumentReference;
        const unitData = (
          await getDoc(doc(db, 'cropUnits', unitDoc.id))
        ).data() as Unit;
        setUnit({
          id: unitDoc.id,
          name: (
            await getDoc(doc(db, 'cropUnits', unitDoc.id, 'name', locale))
          ).data()?.value,
          fractional: unitData?.fractional,
        });
      }
    };

    effect();
  }, [crop, locale]);

  const [measure, setMeasure] = useState<string>('');

  const measureInputRef = useRef<TextInput>(null);
  Keyboard.addListener('keyboardDidHide', () => {
    measureInputRef.current?.blur();
  });

  const [participationLogged, setParticipationLogged] =
    useContext(participationContext);

  const logParticipation = async () => {
    setParticipationLogged(true);
    const participation: Participation = {
      date: getDateString(),
      garden: doc(db, 'gardens', garden),
    };
    addDoc(
      collection(db, 'people', auth.currentUser?.uid ?? '', 'participation'),
      participation
    );

    Toast.show({ type: 'info', text1: t('participationLogged') });
  };

  const [harvestsData, harvestsLoading, _] = useList(
    ref(realtime, `harvests/${getDateString()}/${garden}/${crop}`)
  );

  const submit = async () => {
    const realtimeHarvest: RealtimeHarvest = {
      person: auth.currentUser?.uid ?? '',
      measures: [
        {
          unit: `cropUnits/${unit?.id ?? ''}`,
          measure: parseFloat(measure),
        },
      ],
    };

    set(ref(realtime, `harvests/${getDateString()}/${garden}/${crop}`), [
      realtimeHarvest,
      ...(harvestsData?.map(harvest => harvest.val() as Harvest) ?? []),
    ]);

    const harvest: Harvest = {
      date: getDateString(),
      person: doc(db, 'people', auth.currentUser?.uid ?? ''),
      garden: doc(db, 'gardens', garden),
      crop: doc(db, 'crops', crop ?? ''),
    };

    const newHarvest = await addDoc(collection(db, 'harvests'), harvest);
    const harvestMeasure: HarvestMeasure = {
      unit: doc(db, 'cropUnits', unit?.id ?? ''),
      measure: parseFloat(measure),
    };
    addDoc(
      collection(db, 'harvests', newHarvest.id, 'measures'),
      harvestMeasure
    );

    if (!participationLogged) logParticipation();
  };

  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => {
    if (!crop || !garden) return;
    const harvests =
      harvestsData?.map(harvest => harvest.val() as RealtimeHarvest) ?? [];
    setTotalToday(
      harvests.reduce((acc, harvest) => acc + harvest.measures[0].measure, 0)
    );
  }, [crop, garden, harvestsData]);

  return (
    <View style={styles.centeredView}>
      {garden && (
        <DropDownPicker
          placeholder={t('selectCrop')}
          open={cropListOpen}
          setOpen={setCropListOpen}
          value={crop}
          setValue={setCrop}
          items={crops}
          setItems={setCrops}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdown}
          textStyle={styles.text}
          searchable={true}
          searchPlaceholder="Search..."
        />
      )}
      {crop && !unit && <ActivityIndicator />}
      {unit && (
        <>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextInput
              ref={measureInputRef}
              keyboardType="numeric"
              value={measure?.toString()}
              onChangeText={text => {
                if (
                  !(
                    text.startsWith('.') && (text.match(/\./g) ?? []).length > 1
                  )
                )
                  setMeasure(
                    text.replace(/,|-| /g, '').replace(
                      // matches the possible text, capturing only the desired output
                      /(\.?)\.*([0-9]*)(\.?)\.*([0-9]{0,2})(?:\.|[0-9])*/g,
                      `${unit.fractional ? '$1' : ''}$2${unit.fractional ? '$3$4' : ''}`
                    )
                  );
              }}
              style={styles.input}
            />
            <Text style={styles.text}>{unit?.name}</Text>
          </View>
          {harvestsLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.text}>
              {t('totalToday')}:{' '}
              {totalToday.toLocaleString(undefined, {
                minimumFractionDigits: unit.fractional ? 2 : 0,
                maximumFractionDigits: unit.fractional ? 2 : 0,
              })}
            </Text>
          )}
        </>
      )}
      {measure && measure !== '.' && (
        <Button title={t('submit')} onPress={submit} />
      )}
    </View>
  );
}
