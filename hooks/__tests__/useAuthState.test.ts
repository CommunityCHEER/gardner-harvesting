import { renderHook, act } from '@testing-library/react-native';
import { useAuthState } from '../useAuthState';
import type { Auth, User } from 'firebase/auth';

describe('useAuthState', () => {
    let mockAuth: Auth;
    let authCallback: ((user: User | null) => void) | null;
    const unsubscribe = jest.fn();

    beforeEach(() => {
        authCallback = null;
        unsubscribe.mockClear();

        mockAuth = {
            currentUser: null,
            onAuthStateChanged: jest.fn((callback: (user: User | null) => void) => {
                authCallback = callback;
                return unsubscribe;
            }),
        } as unknown as Auth;
    });

    it('returns [null, true] initially while loading', () => {
        const { result } = renderHook(() => useAuthState(mockAuth));

        expect(result.current[0]).toBeNull();
        expect(result.current[1]).toBe(true);
    });

    it('subscribes to onAuthStateChanged', () => {
        renderHook(() => useAuthState(mockAuth));

        expect(mockAuth.onAuthStateChanged).toHaveBeenCalledTimes(1);
    });

    it('returns [user, false] after auth state resolves', () => {
        const { result } = renderHook(() => useAuthState(mockAuth));
        const mockUser = { uid: 'test-uid', email: 'test@example.com' } as User;

        act(() => {
            authCallback?.(mockUser);
        });

        expect(result.current[0]).toEqual(mockUser);
        expect(result.current[1]).toBe(false);
    });

    it('returns [null, false] when signed out', () => {
        const { result } = renderHook(() => useAuthState(mockAuth));

        act(() => {
            authCallback?.(null);
        });

        expect(result.current[0]).toBeNull();
        expect(result.current[1]).toBe(false);
    });

    it('unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useAuthState(mockAuth));

        unmount();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('updates when user changes', () => {
        const { result } = renderHook(() => useAuthState(mockAuth));
        const user1 = { uid: 'user-1' } as User;
        const user2 = { uid: 'user-2' } as User;

        act(() => {
            authCallback?.(user1);
        });
        expect(result.current[0]?.uid).toBe('user-1');

        act(() => {
            authCallback?.(user2);
        });
        expect(result.current[0]?.uid).toBe('user-2');
    });
});
