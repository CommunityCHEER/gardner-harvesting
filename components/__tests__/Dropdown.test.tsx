import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Dropdown from '../Dropdown';

describe('Dropdown', () => {
    const items = [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
    ];

    const defaultProps = {
        placeholder: 'Select fruit',
        open: false,
        setOpen: jest.fn(),
        value: null as string | null,
        setValue: jest.fn(),
        items,
    };

    beforeEach(() => jest.clearAllMocks());

    describe('closed state', () => {
        test('renders placeholder when no value selected', () => {
            const { getByText } = render(<Dropdown {...defaultProps} />);
            expect(getByText('Select fruit')).toBeTruthy();
        });

        test('renders selected item label when value is set', () => {
            const { getByText } = render(
                <Dropdown {...defaultProps} value="banana" />
            );
            expect(getByText('Banana')).toBeTruthy();
        });

        test('calls setOpen(true) when pressed', () => {
            const setOpen = jest.fn();
            const { getByText } = render(
                <Dropdown {...defaultProps} setOpen={setOpen} />
            );
            fireEvent.press(getByText('Select fruit'));
            expect(setOpen).toHaveBeenCalledWith(true);
        });
    });

    describe('open state (modal)', () => {
        test('shows all items when open', () => {
            const { getByText } = render(
                <Dropdown {...defaultProps} open={true} />
            );
            expect(getByText('Apple')).toBeTruthy();
            expect(getByText('Banana')).toBeTruthy();
            expect(getByText('Cherry')).toBeTruthy();
        });

        test('calls setValue and closes on item press', () => {
            const setValue = jest.fn();
            const setOpen = jest.fn();
            const { getByText } = render(
                <Dropdown
                    {...defaultProps}
                    open={true}
                    setValue={setValue}
                    setOpen={setOpen}
                />
            );
            fireEvent.press(getByText('Banana'));
            expect(setValue).toHaveBeenCalledWith('banana');
            expect(setOpen).toHaveBeenCalledWith(false);
        });

        test('closes modal when close button is pressed', () => {
            const setOpen = jest.fn();
            const { getByTestId } = render(
                <Dropdown {...defaultProps} open={true} setOpen={setOpen} />
            );
            fireEvent.press(getByTestId('dropdown-close'));
            expect(setOpen).toHaveBeenCalledWith(false);
        });
    });

    describe('search', () => {
        test('filters items when searchable and text entered', () => {
            const { getByPlaceholderText, queryByText } = render(
                <Dropdown
                    {...defaultProps}
                    open={true}
                    searchable={true}
                    searchPlaceholder="Search..."
                />
            );
            fireEvent.changeText(getByPlaceholderText('Search...'), 'ban');
            expect(queryByText('Banana')).toBeTruthy();
            expect(queryByText('Apple')).toBeNull();
            expect(queryByText('Cherry')).toBeNull();
        });

        test('does not render search input when searchable is false', () => {
            const { queryByPlaceholderText } = render(
                <Dropdown {...defaultProps} open={true} searchable={false} />
            );
            expect(queryByPlaceholderText('Search...')).toBeNull();
        });
    });

    describe('onPress callback', () => {
        test('calls onPress when trigger is pressed', () => {
            const onPress = jest.fn();
            const { getByText } = render(
                <Dropdown {...defaultProps} onPress={onPress} />
            );
            fireEvent.press(getByText('Select fruit'));
            expect(onPress).toHaveBeenCalled();
        });
    });
});
