import { View, Text, TextInput, Keyboard } from 'react-native';
import { useRef, useContext } from 'react';
import { DisplayUnit } from './HarvestForm';
import { styles } from '@/constants/style';
import { i18nContext } from '@/i18n';

export default function MeasureInput({
  measure,
  setMeasure,
  unit,
  optional = false,
}: {
  measure: string;
  setMeasure: (measure: string) => void;
  unit: DisplayUnit;
  optional?: boolean;
}) {
  const i18n = useContext(i18nContext);
  const t = i18n.t.bind(i18n);

  console.log('unit:', JSON.stringify(unit));

  // Determine if the unit can have a sub-unit (only pounds supports this right now)
  const hasSubUnit = unit.id === 'pounds';
  console.log('hasSubUnit:', hasSubUnit);
  const subUnit = hasSubUnit ? 'ounces' : null;
  console.log('subUnit:', subUnit);
  const subUnitName = hasSubUnit && subUnit ? t(subUnit) : null;
  console.log('subUnitName:', subUnitName);
  const unitMeasure = hasSubUnit
    ? measure?.split('.')[0] || '0'
    : measure;
  console.log('unitMeasure:', unitMeasure);
  const subUnitMeasure = hasSubUnit
    ? Number(measure?.split('.')[1] || '0') * 16
    : null;
  console.log('subUnitMeasure:', subUnitMeasure);

  const measureInputRef = useRef<TextInput>(null);
  const subUnitInputRef = useRef<TextInput>(null);
  Keyboard.addListener('keyboardDidHide', () => {
    measureInputRef.current?.blur();
    subUnitInputRef.current?.blur();
  });

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <TextInput
        ref={measureInputRef}
        inputMode="numeric"
        value={unitMeasure.toString()}
        onChangeText={text => {
          if (!(text.startsWith('.') && (text.match(/\./g) ?? []).length > 1))
            setMeasure(
              text.replace(/,|-| /g, '').replace(
                // Checks if the input starts with a dot and contains more than one dot
                // if so, it ignores the input (prevents invalid leading decimals)
                // Otherwise, it
                // removes commas, dashes, and spaces
                // uses a regex to extract and format the number,
                // allowing for up to 2 decimal places if the unit allows it
                // calls setMeasure with the cleaned and formatted value
                /(\.?)\.*([0-9]{0,2})([0-9]*)(\.?)\.*([0-9]{0,2})(?:\.|[0-9])*/g,
                `${unit.fractional && !hasSubUnit ? '$1' : ''}${
                  unit.fractional && !hasSubUnit && text.startsWith('.') ? '$2' : '$2$3'
                }${unit.fractional && !hasSubUnit ? '$4$5' : ''}`
              )
            );
        }}
        style={styles.input}
      />
      <Text style={styles.text}>
        {unit?.name} {optional && !hasSubUnit && `(${t('optional')})`}
      </Text>
      {hasSubUnit && (
        <>
          <TextInput
            ref={subUnitInputRef}
            inputMode="numeric"
            value={subUnitMeasure?.toString() || '0'}
                    onChangeText={text => {
              if (!(text.startsWith('.') && (text.match(/\./g) ?? []).length > 1))
                setMeasure(
                  text.replace(/,|-| /g, '').replace(
                    // Checks if the input starts with a dot and contains more than one dot
                    // if so, it ignores the input (prevents invalid leading decimals)
                    // Otherwise, it
                    // removes commas, dashes, and spaces
                    // uses a regex to extract and format the number,
                    // allowing for up to 2 decimal places if the unit allows it
                    // calls setMeasure with the cleaned and formatted value
                    /(\.?)\.*([0-9]{0,2})([0-9]*)(\.?)\.*([0-9]{0,2})(?:\.|[0-9])*/g,
                    '$2$3'
                  )
                );
            }}
            style={styles.input}
            />
          <Text style={styles.text}>
            {subUnitName} {optional && `(${t('optional')})`}
          </Text>
        </>
      )}
    </View>
  );
}
