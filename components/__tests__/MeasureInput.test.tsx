import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';
import MeasureInput from '../MeasureInput';

describe('MeasureInput', () => {
    const unit = { id: 'ounces', name: 'ounces', fractional: true } as any;

    test('uses design-system spacing token value for optional label top margin', () => {
        const { UNSAFE_getAllByType } = render(
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
        const { UNSAFE_getAllByType } = render(
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
});
