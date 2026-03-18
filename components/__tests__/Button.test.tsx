import React from 'react';
import { render } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
    test('renders with primary (green) background by default', () => {
        const { getByText } = render(<Button title="Test" />);
        const pressable = getByText('Test').parent?.parent;
        expect(pressable?.props.style).toMatchObject({ backgroundColor: '#5bb974' });
    });

    test('renders with primary (green) background when variant is "primary"', () => {
        const { getByText } = render(<Button title="Test" variant="primary" />);
        const pressable = getByText('Test').parent?.parent;
        expect(pressable?.props.style).toMatchObject({ backgroundColor: '#5bb974' });
    });

    test('renders with transparent background and green text when variant is "secondary"', () => {
        const { getByText } = render(<Button title="Test" variant="secondary" />);
        const textEl = getByText('Test').parent;
        const pressable = textEl?.parent;
        expect(pressable?.props.style).toMatchObject({ backgroundColor: 'transparent' });
        expect(textEl?.props.style).toMatchObject({ color: '#5bb974' });
    });

    test('secondary variant has a green border', () => {
        const { getByText } = render(<Button title="Test" variant="secondary" />);
        const pressable = getByText('Test').parent?.parent;
        expect(pressable?.props.style).toMatchObject({ borderColor: '#5bb974', borderWidth: 1 });
    });
});

