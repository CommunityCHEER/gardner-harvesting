import { useState, useEffect } from 'react';
import { onValue, type DatabaseReference, type DataSnapshot } from 'firebase/database';

/**
 * Custom hook that subscribes to a Firebase Realtime Database list reference.
 * React 19-compatible replacement for react-firebase-hooks/database useList.
 * @param ref - Firebase DatabaseReference to listen to
 * @returns [snapshots, loading, error] tuple
 */
export function useList(
    ref: DatabaseReference
): [DataSnapshot[], boolean, Error | undefined] {
    const [snapshots, setSnapshots] = useState<DataSnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | undefined>(undefined);

    useEffect(() => {
        const unsubscribe = onValue(
            ref,
            (snapshot) => {
                const children: DataSnapshot[] = [];
                snapshot.forEach((child) => {
                    children.push(child);
                });
                setSnapshots(children);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [ref]);

    return [snapshots, loading, error];
}
