import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { i18nContext } from '@/i18n';
import SmartHarvestOverlay from '../SmartHarvestOverlay';

const mockI18n = {
    t: (key: string, params?: Record<string, string>) => {
        const translations: Record<string, string> = {
            analyzingPhoto: 'Analyzing photo...',
            photoMatchedTo: 'Photo matched to',
            useCrop: `Use ${params?.cropName ?? ''}`,
            takeADifferentPhoto: 'Take a different photo',
            chooseManually: 'Choose manually',
            cancel: 'Cancel',
            noMatchFound: 'No match found.',
        };
        return translations[key] || key;
    },
};

const renderOverlay = (
    props: Partial<React.ComponentProps<typeof SmartHarvestOverlay>> = {}
) => {
    const defaultProps: React.ComponentProps<typeof SmartHarvestOverlay> = {
        phase: 'idle',
        cropName: null,
        errorMessage: null,
        onAccept: jest.fn(),
        onRetakePhoto: jest.fn(),
        onChooseManually: jest.fn(),
        onCancel: jest.fn(),
    };

    return render(
        <i18nContext.Provider value={mockI18n as any}>
            <SmartHarvestOverlay {...defaultProps} {...props} />
        </i18nContext.Provider>
    );
};

describe('SmartHarvestOverlay', () => {
    it('should be hidden in idle phase', () => {
        const { queryByTestId, queryByText } = renderOverlay({ phase: 'idle' });

        expect(queryByTestId('smart-harvest-overlay')).toBeNull();
        expect(queryByText('Analyzing photo...')).toBeNull();
    });

    it('should show analyzing state content', () => {
        const { getByTestId, getByText } = renderOverlay({ phase: 'analyzing' });

        const modal = getByTestId('smart-harvest-overlay');
        expect(modal.props.visible).toBe(true);
        expect(modal.props.transparent).toBe(true);
        expect(getByText('Analyzing photo...')).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
    });

    it('should show matched state content and trigger all matched callbacks', () => {
        const onAccept = jest.fn();
        const onRetakePhoto = jest.fn();
        const onChooseManually = jest.fn();
        const onCancel = jest.fn();

        const { getByText } = renderOverlay({
            phase: 'matched',
            cropName: 'Tomato',
            onAccept,
            onRetakePhoto,
            onChooseManually,
            onCancel,
        });

        expect(getByText('Photo matched to')).toBeTruthy();
        expect(getByText('Tomato')).toBeTruthy();

        fireEvent.press(getByText('Use Tomato'));
        fireEvent.press(getByText('Take a different photo'));
        fireEvent.press(getByText('Choose manually'));
        fireEvent.press(getByText('Cancel'));

        expect(onAccept).toHaveBeenCalledTimes(1);
        expect(onRetakePhoto).toHaveBeenCalledTimes(1);
        expect(onChooseManually).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should show failed state content and trigger failed callbacks', () => {
        const onRetakePhoto = jest.fn();
        const onChooseManually = jest.fn();
        const onCancel = jest.fn();

        const { getByText } = renderOverlay({
            phase: 'failed',
            errorMessage: 'Unable to identify crop.',
            onRetakePhoto,
            onChooseManually,
            onCancel,
        });

        expect(getByText('Unable to identify crop.')).toBeTruthy();

        fireEvent.press(getByText('Take a different photo'));
        fireEvent.press(getByText('Choose manually'));
        fireEvent.press(getByText('Cancel'));

        expect(onRetakePhoto).toHaveBeenCalledTimes(1);
        expect(onChooseManually).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should trigger cancel callback from analyzing state', () => {
        const onCancel = jest.fn();
        const { getByText } = renderOverlay({
            phase: 'analyzing',
            onCancel,
        });

        fireEvent.press(getByText('Cancel'));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});