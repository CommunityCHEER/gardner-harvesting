import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import User from '../user';
import { firebaseContext } from '@/context';

jest.mock('@/context', () => {
    const React = require('react');

    return {
        firebaseContext: React.createContext({
            auth: null,
            db: null,
            storage: null,
            realtime: null,
        }),
    };
});

const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockDeleteUser = jest.fn();

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: (...args: unknown[]) =>
        mockCreateUserWithEmailAndPassword(...args),
    signInWithEmailAndPassword: (...args: unknown[]) =>
        mockSignInWithEmailAndPassword(...args),
    sendPasswordResetEmail: (...args: unknown[]) =>
        mockSendPasswordResetEmail(...args),
    deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
}));

jest.mock('firebase/firestore', () => ({
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    doc: (...args: unknown[]) => mockDoc(...args),
}));

jest.mock('react-native-toast-message', () => {
    const React = require('react');
    const { View } = require('react-native');

    const MockToast = () => React.createElement(View, { testID: 'mock-toast' });
    MockToast.show = jest.fn();

    return {
        __esModule: true,
        default: MockToast,
        BaseToast: MockToast,
    };
});

describe('User tab keyboard and tap behavior', () => {
    const mockAuth = {
        currentUser: null,
        signOut: jest.fn(),
        languageCode: 'en',
    } as any;

    const mockDb = {} as any;

    const renderUser = () => {
        return render(
            <firebaseContext.Provider
                value={{ auth: mockAuth, db: mockDb, storage: {} as any, realtime: {} as any }}
            >
                <User />
            </firebaseContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockAuth.currentUser = null;
        mockDoc.mockReturnValue({});
        mockGetDoc.mockResolvedValue({
            data: () => ({
                firstName: 'Test',
                lastName: 'User',
                role: '',
                admin: false,
                gardener: false,
                developer: false,
            }),
        });
        mockSetDoc.mockResolvedValue(undefined);
        mockSignInWithEmailAndPassword.mockResolvedValue({
            user: {
                uid: 'test-uid',
                email: 'test@example.com',
                getIdTokenResult: jest.fn().mockResolvedValue({ claims: {} }),
            },
        });
        mockSendPasswordResetEmail.mockResolvedValue(undefined);
    });

    test('requires keyboard tap persistence on the main ScrollView', () => {
        const { UNSAFE_getByType } = renderUser();

        const scrollView = UNSAFE_getByType(ScrollView);

        expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
    });

    test('triggers sign-in action on first tap while password input is focused', async () => {
        const { getAllByPlaceholderText, getByPlaceholderText, getByText } = renderUser();

        mockSignInWithEmailAndPassword.mockRejectedValueOnce(
            new Error('invalid-credential')
        );

        const emailInputs = getAllByPlaceholderText('Email');

        fireEvent.changeText(emailInputs[0], 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'Validpass123!');
        fireEvent(getByPlaceholderText('Password'), 'focus');

        fireEvent.press(getByText('Login'));

        await waitFor(() => {
            expect(mockSignInWithEmailAndPassword).toHaveBeenCalledTimes(1);
            expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
                mockAuth,
                'test@example.com',
                'Validpass123!'
            );
        });
    });

    test('triggers reset-password action on first tap while reset email input is focused', async () => {
        const { getAllByPlaceholderText, getByText } = renderUser();

        const emailInputs = getAllByPlaceholderText('Email');
        fireEvent.changeText(emailInputs[1], 'reset@example.com');
        fireEvent(emailInputs[1], 'focus');

        fireEvent.press(getByText('Request password reset'));

        await waitFor(() => {
            expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
            expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
                mockAuth,
                'reset@example.com'
            );
        });
    });

    test('preserves keyboard avoiding layout contract', () => {
        const { UNSAFE_getByType } = renderUser();

        const keyboardAvoidingView = UNSAFE_getByType(KeyboardAvoidingView);

        expect(keyboardAvoidingView.props.behavior).toBe(
            Platform.OS === 'ios' ? 'padding' : 'height'
        );
        expect(keyboardAvoidingView.props.keyboardVerticalOffset).toBe(64);
    });
});
