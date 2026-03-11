import React, { useState, useEffect, useContext, useRef, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { i18nContext } from '@/i18n';
import { styles } from '@/constants/style';
import Dropdown, { DropdownItem } from '@/components/Dropdown';
import { participationContext, FirebaseContext } from '@/context';
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
import { useList } from '@/hooks/useList';
import { getDateString } from '@/utility/functions';
import MeasureInput from './MeasureInput';
import { ImagePickerAsset } from 'expo-image-picker';
import { ref, uploadBytes } from 'firebase/storage';
import NoteModal from './NoteModal';
import ImagePicker from './ImagePicker';
import SmartHarvestOverlay from './SmartHarvestOverlay';
import { identifyCrop } from '@/services/smartHarvest';
import { logger } from '@/utility/logger';

export interface DisplayUnit {
  id: string;
  name: string;
  fractional: boolean;
}

interface UnitMetadataCacheEntry {
  status: 'loading' | 'ready' | 'error';
  requiredUnit: DisplayUnit | null;
  optionalUnits: DisplayUnit[];
  errorMessage: string | null;
}

const getUnitMetadataKey = (cropId: string, locale: string) => `${locale}:${cropId}`;

export interface HarvestFormProps {
  garden: string | null;
  setGarden: Dispatch<SetStateAction<string | null>>;
  gardens: DropdownItem[];
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
  db,
  auth,
  realtime,
  storage,
}: HarvestFormProps & FirebaseContext) {
  const locales = useLocales();
  const locale = locales[0].languageCode ?? '';

  const i18n = useContext(i18nContext);
  const t = i18n.t.bind(i18n);

  // Crop-related state
  const [crops, setCrops] = useState<DropdownItem[]>([]);
  const [cropListOpen, setCropListOpen] = useState(false);
  const [crop, setCrop] = useState<string | null>(null);
  const [unitMetadataCache, setUnitMetadataCache] = useState<
    Record<string, UnitMetadataCacheEntry>
  >({});

  // Measure state
  const [requiredMeasure, setRequiredMeasure] = useState<string>('');
  const [optionalMeasures, setOptionalMeasures] = useState<string[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<ImagePickerAsset>();
  const [note, setNote] = useState<string>('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'matched' | 'failed'>('idle');
  const [pendingCropValue, setPendingCropValue] = useState<string | null>(null);
  const [pendingCropLabel, setPendingCropLabel] = useState<string | null>(null);
  const [smartHarvestError, setSmartHarvestError] = useState<string | null>(null);
  const smartHarvestRequestRef = useRef(0);

  const resetSmartHarvestState = () => {
    setPhase('idle');
    setPendingCropValue(null);
    setPendingCropLabel(null);
    setSmartHarvestError(null);
  };

  const cancelSmartHarvest = () => {
    smartHarvestRequestRef.current += 1;
    resetSmartHarvestState();
  };

  const handleSmartHarvest = async (asset: ImagePickerAsset) => {
    if (crops.length < 2) {
      logger.warn('HarvestForm.handleSmartHarvest', 'Insufficient crops for identification', {
        numCrops: crops.length,
      });
      return;
    }
    const requestId = smartHarvestRequestRef.current + 1;
    smartHarvestRequestRef.current = requestId;
    setPendingCropValue(null);
    setPendingCropLabel(null);
    setSmartHarvestError(null);
    setPhase('analyzing');
    try {
      logger.info('HarvestForm.handleSmartHarvest', 'Starting smart harvest', {
        numCrops: crops.length,
      });
      const matchedCrop = await identifyCrop(asset.uri, crops);
      if (smartHarvestRequestRef.current !== requestId) return;
      if (matchedCrop) {
        logger.info('HarvestForm.handleSmartHarvest', 'Crop identified successfully', {
          matchedCrop,
        });
        // Look up the crop label from crops array
        const matchedCropItem = crops.find(c => c.value === matchedCrop);
        setPendingCropValue(matchedCrop);
        setPendingCropLabel(matchedCropItem?.label || null);
        setPhase('matched');
      } else {
        logger.warn('HarvestForm.handleSmartHarvest', 'No crop matched', {
          numCrops: crops.length,
        });
        setSmartHarvestError(t('noMatchFound'));
        setPhase('failed');
      }
    } catch (error) {
      if (smartHarvestRequestRef.current !== requestId) return;
      logger.error('HarvestForm.handleSmartHarvest', 'Crop identification failed', {
        error: error instanceof Error ? error.message : String(error),
        numCrops: crops.length,
      });
      setSmartHarvestError(error instanceof Error ? error.message : String(error));
      setPhase('failed');
    }
  };

  const unitMetadataKey = crop ? getUnitMetadataKey(crop, locale) : null;
  const activeUnitMetadata = unitMetadataKey ? unitMetadataCache[unitMetadataKey] : null;
  const activeUnitStatus = activeUnitMetadata?.status;
  const requiredUnit =
    activeUnitMetadata?.status === 'ready' ? activeUnitMetadata.requiredUnit : null;
  const optionalUnits =
    activeUnitMetadata?.status === 'ready' ? activeUnitMetadata.optionalUnits : [];

  useEffect(() => {
    const effect = async () => {
      const cropsCollection = await getDocs(collection(db, 'crops'));
      const crops: DropdownItem[] = await Promise.all(
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
    setRequiredMeasure('');
    setOptionalMeasures([]);
  }, [crop]);

  useEffect(() => {
    if (!crop) return;

    const cacheKey = getUnitMetadataKey(crop, locale);
    const cachedEntry = unitMetadataCache[cacheKey];

    if (cachedEntry) {
      return;
    }

    let active = true;

    const loadUnits = async () => {
      setUnitMetadataCache(previous => ({
        ...previous,
        [cacheKey]: {
          status: 'loading',
          requiredUnit: null,
          optionalUnits: [],
          errorMessage: null,
        },
      }));

      try {
        const unitsSnapshot = await getDocs(collection(db, 'crops', crop, 'units'));
        const resolvedUnits = await Promise.all(
          unitsSnapshot.docs.map(async unitDocument => {
            const unitDoc = await getDoc(
              unitDocument.data()?.value as DocumentReference
            );
            const unitData = unitDoc.data() as Unit;
            const localizedName = (
              await getDoc(doc(db, 'cropUnits', unitDoc.id, 'name', locale))
            ).data()?.value;

            return {
              kind: unitDocument.id,
              displayUnit: {
                id: unitDoc.id,
                name: localizedName,
                fractional: unitData?.fractional,
              } as DisplayUnit,
            };
          })
        );

        if (!active) return;

        const requiredUnitEntry =
          resolvedUnits.find(unit => unit.kind === 'required')?.displayUnit ?? null;
        const optionalUnitById = new Map<string, DisplayUnit>();
        resolvedUnits
          .filter(unit => unit.kind !== 'required')
          .forEach(unit => {
            optionalUnitById.set(unit.displayUnit.id, unit.displayUnit);
          });

        const optionalUnitEntry = Array.from(optionalUnitById.values()).pop() ?? null;
        const optionalUnitEntries = optionalUnitEntry ? [optionalUnitEntry] : [];

        setUnitMetadataCache(previous => ({
          ...previous,
          [cacheKey]: {
            status: 'ready',
            requiredUnit: requiredUnitEntry,
            optionalUnits: optionalUnitEntries,
            errorMessage: null,
          },
        }));
      } catch (error) {
        if (!active) return;

        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('HarvestForm.loadUnits', 'Failed to load unit metadata', {
          crop,
          locale,
          error: errorMessage,
        });

        setUnitMetadataCache(previous => ({
          ...previous,
          [cacheKey]: {
            status: 'error',
            requiredUnit: null,
            optionalUnits: [],
            errorMessage,
          },
        }));
      }
    };

    loadUnits();

    return () => {
      active = false;
    };
  }, [crop, db, locale]);

  useEffect(() => {
    setCrop(null);
    cancelSmartHarvest();
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

  const totalToday =
    crop && garden
      ? (harvestsData?.map(harvest => harvest.val() as RealtimeHarvest) ?? []).reduce(
        (acc, harvest) => acc + harvest.measures[0].measure,
        0
      )
      : 0;

  const optionalInputs = optionalUnits.map((unit, index) => (
    <MeasureInput
      key={unit.id}
      measure={optionalMeasures[index]}
      setMeasure={measure => {
        optionalMeasures[index] = measure;
        setOptionalMeasures([...optionalMeasures]);
      }}
      unit={unit}
      optional
    />
  ));

  return (
    <SafeAreaView style={styles.container}>
      <NoteModal
        visible={noteModalVisible}
        note={note}
        onClose={() => setNoteModalVisible(false)}
        onSave={newNote => {
          setNote(newNote);
          setNoteModalVisible(false);
        }}
        saveButtonTitle={t('saveNote')}
      />
      <SmartHarvestOverlay
        phase={phase}
        cropName={pendingCropLabel}
        errorMessage={smartHarvestError}
        onAccept={() => {
          setCrop(pendingCropValue);
          resetSmartHarvestState();
        }}
        onRetakePhoto={resetSmartHarvestState}
        onChooseManually={resetSmartHarvestState}
        onCancel={cancelSmartHarvest}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 64}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
          keyboardShouldPersistTaps='handled'
        >
          {gardens.length > 0 && (
            <Dropdown
              placeholder={t('selectGarden')}
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
          {crops.length > 0 && (
            <Dropdown
              placeholder={t('selectCrop')}
              open={cropListOpen}
              setOpen={setCropListOpen}
              value={crop}
              setValue={setCrop}
              items={crops}
              style={styles.dropdown}
              textStyle={styles.text}
              searchable={true}
              searchPlaceholder="Search..."
              onPress={Keyboard.dismiss}
            />
          )}
          {!crop && crops.length > 0 && (
            <>
              <Text style={styles.text}>{t('orDivider')}</Text>
              <ImagePicker
                onImageSelected={setImage}
                onSmartHarvest={handleSmartHarvest}
                buttonTitle={t('takePhoto')}
              />
              <Text style={[styles.text, { textAlign: 'center' }]}>{t('smartHarvestHelp')}</Text>
            </>
          )}
          {!crop && (
            <Button title={t('back')} onPress={onBack} />
          )}
          {crop && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              <Button
                title={note ? t('editNote') : t('addNote')}
                onPress={() => {
                  Keyboard.dismiss();
                  setNoteModalVisible(true);
                }}
              />
            </View>
          )}
          {crop && (!activeUnitMetadata || activeUnitMetadata.status === 'loading') && (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <ActivityIndicator />
              <Text style={styles.text}>{t('loadingUnitOptions')}</Text>
            </View>
          )}
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
          {crop && activeUnitMetadata?.status === 'error' && activeUnitMetadata.errorMessage && (
            <Text style={styles.text}>{activeUnitMetadata.errorMessage}</Text>
          )}
          {requiredMeasure &&
            requiredMeasure !== '.' &&
            (submitting ? (
              <ActivityIndicator />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <Button title={t('back')} onPress={onBack} />
                <Button title={t('submit')} onPress={submit} />
              </View>
            ))}
          {crop && (!requiredMeasure || requiredMeasure === '.') && (
            <Button title={t('back')} onPress={onBack} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
