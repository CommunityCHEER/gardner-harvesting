import React, { useState, useEffect, useContext, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
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
import { ref as realtimeRef, set } from 'firebase/database';
import { useList } from 'react-firebase-hooks/database';
import { getDateString } from '@/utility/functions';
import MeasureInput from './MeasureInput';
import {
  ImagePickerAsset,
  launchCameraAsync,
  requestCameraPermissionsAsync,
} from 'expo-image-picker';
import { ref, uploadBytes } from 'firebase/storage';

export interface DisplayUnit {
  id: string;
  name: string;
  fractional: boolean;
}
// test comment
export interface HarvestFormProps {
  garden: string | null;
  setGarden: Dispatch<SetStateAction<string | null>>;
  gardens: ItemType<string>[];
  gardenListOpen: boolean;
  setGardenListOpen: Dispatch<SetStateAction<boolean>>;
  onBack: () => void;
}

export default function HarvestForm({
  garden,
  setGarden,
  gardens,
  gardenListOpen,
  setGardenListOpen,
  onBack,
}: HarvestFormProps) {
  const locales = useLocales();
  const locale = locales[0].languageCode ?? '';

  const i18n = useContext(i18nContext);
  const t = i18n.t.bind(i18n);

  const { db, auth, realtime, storage } = useContext(firebaseContext);

  // Crop-related state
  const [crops, setCrops] = useState<ItemType<string>[]>([]);
  const [cropListOpen, setCropListOpen] = useState(false);
  const [crop, setCrop] = useState<string | null>(null);
  const [requiredUnit, setRequiredUnit] = useState<DisplayUnit | null>(null);
  const [optionalUnits, setOptionalUnits] = useState<DisplayUnit[]>([]);

  // Measure state
  const [requiredMeasure, setRequiredMeasure] = useState<string>('');
  const [optionalMeasures, setOptionalMeasures] = useState<string[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<ImagePickerAsset>();
  const [note, setNote] = useState<string>('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  useEffect(() => {
    const effect = async () => {
      const cropsCollection = await getDocs(collection(db, 'crops'));
      const crops: ItemType<string>[] = await Promise.all(
        cropsCollection.docs.map(async document => ({
          value: document.id,
          label:
            (await getDoc(doc(db, 'crops', document.id, 'name', locale))).data()
              ?.value || '',
        }))
      );
      crops.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
      setCrops(crops);
    };
    effect();
  }, [locale]);

  useEffect(() => {
    const effect = async () => {
      setRequiredMeasure('');
      setOptionalMeasures([]);
      if (!crop) {
        setRequiredUnit(null);
        setOptionalUnits([]);
      } else {
        (await getDocs(collection(db, 'crops', crop, 'units'))).forEach(
          async document => {
            const unitDoc = await getDoc(
              document.data()?.value as DocumentReference
            );
            const unitData = unitDoc.data() as Unit;
            const displayUnit: DisplayUnit = {
              id: unitDoc.id,
              name: (
                await getDoc(doc(db, 'cropUnits', unitDoc.id, 'name', locale))
              ).data()?.value,
              fractional: unitData?.fractional,
            };

            if (document.id === 'required') setRequiredUnit(displayUnit);
            else setOptionalUnits([displayUnit]);
          }
        );
      }
    };

    effect();
  }, [crop, locale]);

  useEffect(() => {
    setCrop(null);
  }, [garden]);

  const [participationLogged, setParticipationLogged] =
    useContext(participationContext);

  const logParticipation = async () => {
    if (!garden) return;
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
    realtimeRef(realtime, `harvests/${getDateString()}/${garden}/${crop}`)
  );

  const submit = async () => {
    if (!garden) return;
    setSubmitting(true);

    Keyboard.dismiss();

    try {
      const measures: HarvestMeasure[] = [];
      measures.push({
        unit: doc(db, 'cropUnits', requiredUnit?.id ?? ''),
        measure: parseFloat(requiredMeasure),
      });
      optionalMeasures.forEach((measure, index) => {
        if (measure !== '.' && measure !== '')
          measures.push({
            unit: doc(db, 'cropUnits', optionalUnits[index].id),
            measure: parseFloat(measure),
          });
      });

      const realtimeHarvest: RealtimeHarvest = {
        person: auth.currentUser?.uid ?? '',
        measures: measures.map(measure => {
          return { unit: measure.unit.path, measure: measure.measure };
        }),
      };

      set(
        realtimeRef(realtime, `harvests/${getDateString()}/${garden}/${crop}`),
        [
          realtimeHarvest,
          ...(harvestsData?.map(harvest => harvest.val() as Harvest) ?? []),
        ]
      );

      const harvest: Harvest = {
        date: getDateString(),
        person: doc(db, 'people', auth.currentUser?.uid ?? ''),
        garden: doc(db, 'gardens', garden),
        crop: doc(db, 'crops', crop ?? ''),
        ...(note && { note }),
      };

      const newHarvest = await addDoc(collection(db, 'harvests'), harvest);
      measures.forEach(measure =>
        addDoc(collection(db, 'harvests', newHarvest.id, 'measures'), measure)
      );

      if (!participationLogged) logParticipation();

      if (!image) {
        finishSubmitting();
        return;
      }

      const imageRef = ref(storage, `harvests/${newHarvest.id}`);
      const res = await fetch(image?.uri as string);
      const blob = await res.blob();
      uploadBytes(imageRef, blob)
        .then(() => finishSubmitting())
        .catch(error => {
          setSubmitting(false);
          console.warn(error);
          Toast.show({
            type: 'error',
            text1: 'Error uploading image',
            text2: error.message,
          });
        });
    } catch (e: any) {
      setSubmitting(false);
      console.warn(e);
      Toast.show({
        type: 'error',
        text1: 'Error submitting harvest',
        text2: e.message,
      });
    }
  };

  const finishSubmitting = () => {
    setSubmitting(false);
    setRequiredMeasure('');
    setOptionalMeasures([]);
    setImage(undefined);
    setNote('');
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

  const [optionalInputs, setOptionalInputs] = useState<React.JSX.Element[]>([]);

  useEffect(() => {
    if (!crop) return;
    let inputs: React.JSX.Element[] = [];

    optionalUnits.forEach(unit => {
      const key = inputs.length;
      inputs.push(
        <MeasureInput
          key={key}
          measure={optionalMeasures[key]}
          setMeasure={measure => {
            optionalMeasures[key] = measure;
            setOptionalMeasures([...optionalMeasures]);
          }}
          unit={unit}
          optional
        />
      );
    });

    setOptionalInputs(inputs);
  }, [optionalUnits, optionalMeasures]);

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={noteModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <SafeAreaView style={[styles.container, { padding: 20 }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <View style={{ flex: 1 }}>
              <TextInput
                style={[
                  styles.text,
                  {
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    padding: 10,
                    minHeight: 200,
                    textAlignVertical: 'top',
                  },
                ]}
                multiline
                placeholder="Enter note..."
                value={note}
                onChangeText={setNote}
                autoFocus
              />
            </View>
            <View style={{ marginBottom: 20 }}>
              <Button
                title={t('saveNote')}
                onPress={() => setNoteModalVisible(false)}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 64}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
        >
          {gardens.length > 0 && (
            <DropDownPicker
              placeholder={t('selectGarden')}
              open={gardenListOpen}
              setOpen={setGardenListOpen}
              value={garden}
              setValue={setGarden}
              items={gardens}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdown}
              textStyle={styles.text}
              onPress={Keyboard.dismiss}
              listMode="MODAL"
            />
          )}
          <Button
            title={t('takePhoto')}
            onPress={async () => {
              Keyboard.dismiss();
              const permissions = await requestCameraPermissionsAsync();
              if (permissions.granted) {
                const result = await launchCameraAsync();
                if (result.canceled) return;
                setImage(result.assets[0]);
              }
            }}
          />
          <Button
            title={note ? t('editNote') : t('addNote')}
            onPress={() => {
              Keyboard.dismiss();
              setNoteModalVisible(true);
            }}
          />
          {image && (
            <Image
              src={image.uri}
              style={{
                aspectRatio: image.width / image.height,
                height: Math.min(image.height / 60, 75),
              }}
            />
          )}
          {crops.length > 0 && (
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
            onPress={Keyboard.dismiss}
            listMode="MODAL"
          />
          )}
          {crop && !requiredUnit && <ActivityIndicator />}
          {requiredUnit && (
            <>
              <MeasureInput
                measure={requiredMeasure}
                setMeasure={setRequiredMeasure}
                unit={requiredUnit}
              />
              {optionalInputs}
              {harvestsLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.text}>
                  {t('totalToday')}:{' '}
                  {totalToday.toLocaleString(undefined, {
                    minimumFractionDigits: requiredUnit.fractional ? 2 : 0,
                    maximumFractionDigits: requiredUnit.fractional ? 2 : 0,
                  })}{' '}
                  {requiredUnit.name}
                </Text>
              )}
            </>
          )}
          {requiredMeasure &&
            requiredMeasure !== '.' &&
            (submitting ? (
              <ActivityIndicator />
            ) : (
              <View style={{ marginBottom: 16 }}>
                <Button title={t('submit')} onPress={submit} />
              </View>
            ))}
          <Button title={t('back')} onPress={onBack} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
