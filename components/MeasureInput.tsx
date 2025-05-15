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

  const measureInputRef = useRef<TextInput>(null);
  Keyboard.addListener('keyboardDidHide', () => {
    measureInputRef.current?.blur();
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
        value={measure?.toString()}
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
                `${unit.fractional ? '$1' : ''}${
                  unit.fractional && text.startsWith('.') ? '$2' : '$2$3'
                }${unit.fractional ? '$4$5' : ''}`
              )
              // .replace(/[^0-9.]/g, '')
            );
        }}
        style={styles.input}
      />
      <Text style={styles.text}>
        {unit?.name} {optional && `(${t('optional')})`}
      </Text>
    </View>
  );
}
