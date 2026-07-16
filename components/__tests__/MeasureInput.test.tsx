import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet, View, TextInput } from 'react-native';
import MeasureInput from '../MeasureInput';
import { i18nContext } from '@/i18n';

const mockI18n = {
    t: (key: string) => key,
};

describe('MeasureInput', () => {
    const unit = { id: 'ounces', name: 'ounces', fractional: true } as any;

    const renderWithI18n = (component: React.ReactElement) =>
        render(<i18nContext.Provider value={mockI18n as any}>{component}</i18nContext.Provider>);

    test('uses design-system spacing token value for optional label top margin', () => {
        const { UNSAFE_getAllByType } = renderWithI18n(
            <MeasureInput
                measure=""
                setMeasure={jest.fn()}
                unit={unit}
                optional={true}
            />
        );

        const allViews = UNSAFE_getAllByType(View);
        const optionalContainer = allViews.find(view => {
            const style = StyleSheet.flatten(view.props.style);
            return style?.marginTop === 48 && style?.flexDirection === 'row';
        });

        expect(optionalContainer).toBeTruthy();
    });

    test('does not render optional margin container when optional is false', () => {
        const { UNSAFE_getAllByType } = renderWithI18n(
            <MeasureInput
                measure=""
                setMeasure={jest.fn()}
                unit={unit}
                optional={false}
            />
        );

        const allViews = UNSAFE_getAllByType(View);
        const optionalContainer = allViews.find(view => {
            const style = StyleSheet.flatten(view.props.style);
            return style?.marginTop === 48 && style?.flexDirection === 'row';
        });

        expect(optionalContainer).toBeUndefined();
    });

    test('renders blank pounds input for required field when measure prop resets to empty string', () => {
        const poundsUnit = { id: 'pounds', name: 'pounds', fractional: false } as any;
        const { UNSAFE_getAllByType, rerender } = renderWithI18n(
            <MeasureInput
                measure="2.5"
                setMeasure={jest.fn()}
                unit={poundsUnit}
                optional={false}
            />
        );

        rerender(
            <i18nContext.Provider value={mockI18n as any}>
                <MeasureInput
                    measure=""
                    setMeasure={jest.fn()}
                    unit={poundsUnit}
                    optional={false}
                />
            </i18nContext.Provider>
        );

        const textInputs = UNSAFE_getAllByType(require('react-native').TextInput);
        expect(textInputs[0].props.value).toBe('');
    });

    test('preserves optional pounds zero-default behavior when measure prop is empty', () => {
        const poundsUnit = { id: 'pounds', name: 'pounds', fractional: false } as any;
        const { UNSAFE_getAllByType } = renderWithI18n(
            <MeasureInput
                measure=""
                setMeasure={jest.fn()}
                unit={poundsUnit}
                optional={true}
            />
        );

        const textInputs = UNSAFE_getAllByType(require('react-native').TextInput);
        expect(textInputs[0].props.value).toBe('0');
    });

    test('renders separate pounds and ounces inputs and combines to decimal measure', () => {
        const poundsUnit = { id: 'pounds', name: 'pounds', fractional: false } as any;
        const setMeasure = jest.fn();
        const { UNSAFE_getAllByType } = renderWithI18n(
            <MeasureInput
                measure=""
                setMeasure={setMeasure}
                unit={poundsUnit}
                optional={false}
            />
        );

        const textInputs = UNSAFE_getAllByType(TextInput);
        expect(textInputs).toHaveLength(2);

        fireEvent.changeText(textInputs[0], '2');
        fireEvent.changeText(textInputs[1], '8');

        expect(setMeasure).toHaveBeenCalledWith('2');
        expect(setMeasure).toHaveBeenCalledWith('2.5');
    });
});
