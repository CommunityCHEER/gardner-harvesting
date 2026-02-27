import { useState, useEffect } from 'react';
import type { Auth, User } from 'firebase/auth';

/**
 * Custom hook that subscribes to Firebase auth state changes.
 * React 19-compatible replacement for react-firebase-hooks/auth useAuthState.
 * @param auth - Firebase Auth instance
 * @returns [user, loading] tuple
 */
export function useAuthState(auth: Auth): [User | null, boolean] {
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return unsubscribe;
    }, [auth]);

    return [user, loading];
}
