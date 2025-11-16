import { View, Text, TextInput, Keyboard } from 'react-native';
import { useRef, useContext, useEffect, useState } from 'react';
import { DisplayUnit } from './HarvestForm';
import { styles } from '@/constants/style';
import { i18nContext } from '@/i18n';


/**
 * A component for inputting a measurement, with optional sub-unit support.
 * @param {object} props - The component props.
 * @param {string} props.measure - The current measurement value.
 * @param {(measure: string) => void} props.setMeasure - The function to call when the measurement changes.
 * @param {DisplayUnit} props.unit - The unit of measurement.
 * @param {boolean} [props.optional=false] - Whether the input is optional.
 * @returns {JSX.Element} The rendered component.
 */
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

  const hasSubUnit = unit.id === 'pounds';
  const subUnit = hasSubUnit ? 'ounces' : null;
  const subUnitName = hasSubUnit && subUnit ? t(subUnit) : null;

  // Helper: Convert float pounds string to {pounds, ounces}
  function parsePoundsOunces(measureStr: string): { pounds: string; ounces: string } {
    if (!hasSubUnit) return { pounds: measureStr, ounces: '0' };
    const floatVal = parseFloat(measureStr || '0');
    const pounds = Math.floor(floatVal);
    const ounces = Math.round((floatVal - pounds) * 16);
    return { pounds: pounds.toString(), ounces: ounces.toString() };
  }

  // Helper: Convert {pounds, ounces} to float pounds string
  function combinePoundsOunces(pounds: string, ounces: string): string {
    const lbs = parseInt(pounds || '0', 10);
    const oz = parseInt(ounces || '0', 10);
    if (isNaN(lbs) && isNaN(oz)) return '';
    const total = lbs + oz / 16;
    // Remove trailing .0 if possible
    return total % 1 === 0 ? total.toString() : total.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }

  // UI state for pounds/ounces
  const [{ pounds, ounces }, setPO] = useState(() => parsePoundsOunces(measure));

  // Keep UI state in sync with measure prop
  useEffect(() => {
    setPO(parsePoundsOunces(measure));
  }, [measure]);

  // Refs for blurring
  const measureInputRef = useRef<TextInput>(null);
  const subUnitInputRef = useRef<TextInput>(null);
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      measureInputRef.current?.blur();
      subUnitInputRef.current?.blur();
    });
    return () => sub.remove();
  }, []);

  // Handlers
  const handlePoundsChange = (text: string) => {
    if (hasSubUnit) {
      // For pounds with ounces subunit: only allow whole numbers
      const cleaned = text.replace(/[^0-9]/g, '');
      setPO(po => ({ ...po, pounds: cleaned }));
      setMeasure(combinePoundsOunces(cleaned, ounces));
    } else {
      // For non-pound units: allow decimals if unit.fractional is true
      if (!(text.startsWith('.') && (text.match(/\./g) ?? []).length > 1)) {
        const formatted = text.replace(/,|-| /g, '').replace(
          /(\.?)\.*([0-9]{0,2})([0-9]*)(\.?)\.*([0-9]{0,2})(?:\.|[0-9])*/g,
          `${unit.fractional ? '$1' : ''}${
            unit.fractional && text.startsWith('.') ? '$2' : '$2$3'
          }${unit.fractional ? '$4$5' : ''}`
        );
        setMeasure(formatted);
      }
    }
  };

  const handleOuncesChange = (text: string) => {
    // Only allow whole numbers
    let cleaned = text.replace(/[^0-9]/g, '');
    // Allow any number of ounces (including > 15)
    setPO(po => ({ ...po, ounces: cleaned }));
    setMeasure(combinePoundsOunces(pounds, cleaned));
  };

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
        inputMode={hasSubUnit || !unit.fractional ? "numeric" : "decimal"}
        value={pounds}
        onChangeText={handlePoundsChange}
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
            value={ounces}
            onChangeText={handleOuncesChange}
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
