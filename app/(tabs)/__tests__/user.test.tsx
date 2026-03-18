import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

    test('uses top-aligned ScrollView content for auth controls', () => {
        const { UNSAFE_getByType } = renderUser();

        const scrollView = UNSAFE_getByType(ScrollView);
        const contentStyle = StyleSheet.flatten(scrollView.props.contentContainerStyle);

        expect(contentStyle.justifyContent).toBe('flex-start');
    });

    test('does not vertically center the keyboard-avoiding layout container', () => {
        const { UNSAFE_getByType } = renderUser();

        const safeAreaView = UNSAFE_getByType(SafeAreaView);
        const safeAreaStyle = StyleSheet.flatten(safeAreaView.props.style);

        expect(safeAreaStyle.flex).toBe(1);
        expect(safeAreaStyle.justifyContent).toBeUndefined();
        expect(safeAreaStyle.alignItems).toBeUndefined();
    });

    test('preserves keyboard avoiding layout contract', () => {
        const { UNSAFE_getByType } = renderUser();

        const keyboardAvoidingView = UNSAFE_getByType(KeyboardAvoidingView);

        expect(keyboardAvoidingView.props.behavior).toBe(
            Platform.OS === 'ios' ? 'padding' : 'height'
        );
        expect(keyboardAvoidingView.props.keyboardVerticalOffset).toBe(64);
    });

    // --- Auth flow state machine tests ---

    test('initial state shows Login and Register buttons with no input fields', () => {
        const { getByText, UNSAFE_queryAllByType } = renderUser();

        expect(getByText('Login')).toBeTruthy();
        expect(getByText('Register')).toBeTruthy();
        expect(getByText('or')).toBeTruthy();
        expect(UNSAFE_queryAllByType(TextInput)).toHaveLength(0);
    });

    test('tapping Login shows email + password fields, Submit, Go Back, and Forgot button', () => {
        const { getByText, getByPlaceholderText, queryByText } = renderUser();

        fireEvent.press(getByText('Login'));

        expect(getByPlaceholderText('Email')).toBeTruthy();
        expect(getByPlaceholderText('Password')).toBeTruthy();
        expect(getByText('Submit')).toBeTruthy();
        expect(getByText('Go Back')).toBeTruthy();
        expect(getByText('Forgot your password?')).toBeTruthy();
        expect(queryByText('or')).toBeNull();
        expect(queryByText('Register')).toBeNull();
    });

    test('tapping Register shows all four fields, Submit, and Go Back', () => {
        const { getByText, getByPlaceholderText, queryByText } = renderUser();

        fireEvent.press(getByText('Register'));

        expect(getByPlaceholderText('First Name')).toBeTruthy();
        expect(getByPlaceholderText('Last Name')).toBeTruthy();
        expect(getByPlaceholderText('Email')).toBeTruthy();
        expect(getByPlaceholderText('Password')).toBeTruthy();
        expect(getByText('Submit')).toBeTruthy();
        expect(getByText('Go Back')).toBeTruthy();
        expect(queryByText('or')).toBeNull();
        expect(queryByText('Login')).toBeNull();
    });

    test('Go Back from login returns to initial state', () => {
        const { getByText, UNSAFE_queryAllByType, queryByText } = renderUser();

        fireEvent.press(getByText('Login'));
        fireEvent.press(getByText('Go Back'));

        expect(getByText('Login')).toBeTruthy();
        expect(getByText('Register')).toBeTruthy();
        expect(getByText('or')).toBeTruthy();
        expect(UNSAFE_queryAllByType(TextInput)).toHaveLength(0);
        expect(queryByText('Submit')).toBeNull();
    });

    test('Go Back from register returns to initial state', () => {
        const { getByText, UNSAFE_queryAllByType, queryByText } = renderUser();

        fireEvent.press(getByText('Register'));
        fireEvent.press(getByText('Go Back'));

        expect(getByText('Login')).toBeTruthy();
        expect(getByText('Register')).toBeTruthy();
        expect(getByText('or')).toBeTruthy();
        expect(UNSAFE_queryAllByType(TextInput)).toHaveLength(0);
        expect(queryByText('Submit')).toBeNull();
    });

    test('tapping Forgot from login shows only email field plus Request reset and Go Back', () => {
        const { getByText, getByPlaceholderText, queryByPlaceholderText, queryByText } = renderUser();

        fireEvent.press(getByText('Login'));
        fireEvent.press(getByText('Forgot your password?'));

        expect(getByPlaceholderText('Email')).toBeTruthy();
        expect(queryByPlaceholderText('Password')).toBeNull();
        expect(getByText('Request password reset')).toBeTruthy();
        expect(getByText('Go Back')).toBeTruthy();
        expect(queryByText('Submit')).toBeNull();
        expect(queryByText('or')).toBeNull();
    });

    test('Go Back from forgot returns to login mode (email and password fields visible)', () => {
        const { getByText, getByPlaceholderText, queryByText } = renderUser();

        fireEvent.press(getByText('Login'));
        fireEvent.press(getByText('Forgot your password?'));
        fireEvent.press(getByText('Go Back'));

        expect(getByPlaceholderText('Email')).toBeTruthy();
        expect(getByPlaceholderText('Password')).toBeTruthy();
        expect(getByText('Submit')).toBeTruthy();
        expect(getByText('Forgot your password?')).toBeTruthy();
        expect(queryByText('Register')).toBeNull();
    });

    test('email is retained when switching from login to forgot mode', () => {
        const { getByText, getByPlaceholderText } = renderUser();

        fireEvent.press(getByText('Login'));
        fireEvent.changeText(getByPlaceholderText('Email'), 'kept@example.com');
        fireEvent.press(getByText('Forgot your password?'));

        expect(getByPlaceholderText('Email').props.value).toBe('kept@example.com');
    });

    test('Submit in login mode calls signInWithEmailAndPassword', async () => {
        const { getByText, getByPlaceholderText } = renderUser();

        mockSignInWithEmailAndPassword.mockRejectedValueOnce(new Error('invalid-credential'));

        fireEvent.press(getByText('Login'));
        fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'Validpass123!');
        fireEvent.press(getByText('Submit'));

        await waitFor(() => {
            expect(mockSignInWithEmailAndPassword).toHaveBeenCalledTimes(1);
            expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
                mockAuth,
                'test@example.com',
                'Validpass123!'
            );
        });
    });

    test('Submit in register mode calls createUserWithEmailAndPassword', async () => {
        const { getByText, getByPlaceholderText } = renderUser();

        mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
            user: {
                uid: 'new-uid',
                email: 'new@example.com',
                getIdTokenResult: jest.fn().mockResolvedValue({ claims: {} }),
            },
        });

        fireEvent.press(getByText('Register'));
        fireEvent.changeText(getByPlaceholderText('First Name'), 'Jane');
        fireEvent.changeText(getByPlaceholderText('Last Name'), 'Smith');
        fireEvent.changeText(getByPlaceholderText('Email'), 'new@example.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'Validpass123!');
        fireEvent.press(getByText('Submit'));

        await waitFor(() => {
            expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
            expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
                mockAuth,
                'new@example.com',
                'Validpass123!'
            );
        });
    });

    test('Request password reset calls sendPasswordResetEmail', async () => {
        const { getByText, getByPlaceholderText } = renderUser();

        fireEvent.press(getByText('Login'));
        fireEvent.press(getByText('Forgot your password?'));
        fireEvent.changeText(getByPlaceholderText('Email'), 'reset@example.com');
        fireEvent.press(getByText('Request password reset'));

        await waitFor(() => {
            expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
            expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
                mockAuth,
                'reset@example.com'
            );
        });
    });

    // --- Inline password requirements hint tests ---

    test('password requirements hint is not shown when password field is empty in login mode', () => {
        const { getByText, queryByText } = renderUser();

        fireEvent.press(getByText('Login'));

        expect(queryByText(/12 and 50 characters/)).toBeNull();
    });

    test('password requirements hint appears inline when password is non-empty and invalid in login mode', () => {
        const { getByText, getByPlaceholderText, queryByText } = renderUser();

        fireEvent.press(getByText('Login'));
        fireEvent.changeText(getByPlaceholderText('Password'), 'weak');

        expect(queryByText(/12 and 50 characters/)).toBeTruthy();
    });

    test('password requirements hint disappears when password becomes valid in login mode', () => {
        const { getByText, getByPlaceholderText, queryByText } = renderUser();

        fireEvent.press(getByText('Login'));
        fireEvent.changeText(getByPlaceholderText('Password'), 'weak');
        expect(queryByText(/12 and 50 characters/)).toBeTruthy();

        fireEvent.changeText(getByPlaceholderText('Password'), 'Validpass123!');
        expect(queryByText(/12 and 50 characters/)).toBeNull();
    });

    test('invalid password does not trigger a toast in login mode', async () => {
        const MockToast = require('react-native-toast-message').default;
        const { getByText, getByPlaceholderText } = renderUser();

        fireEvent.press(getByText('Login'));
        fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'weak');
        fireEvent.press(getByText('Submit'));

        await waitFor(() => {
            expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
            expect(MockToast.show).not.toHaveBeenCalledWith(
                expect.objectContaining({ text1: expect.stringContaining('12 and 50') })
            );
        });
    });

    test('password requirements hint appears inline when password is non-empty and invalid in register mode', () => {
        const { getByText, getByPlaceholderText, queryByText } = renderUser();

        fireEvent.press(getByText('Register'));
        fireEvent.changeText(getByPlaceholderText('Password'), 'weak');

        expect(queryByText(/12 and 50 characters/)).toBeTruthy();
    });
});

