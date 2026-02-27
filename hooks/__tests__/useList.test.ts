import { renderHook, act } from '@testing-library/react-native';
import { useList } from '../useList';
import { onValue } from 'firebase/database';
import type { DatabaseReference, DataSnapshot } from 'firebase/database';

jest.mock('firebase/database', () => ({
    onValue: jest.fn(),
}));

const mockOnValue = onValue as jest.MockedFunction<typeof onValue>;

describe('useList', () => {
    const unsubscribe = jest.fn();
    let onValueCallback: ((snapshot: DataSnapshot) => void) | null;
    let onErrorCallback: ((error: Error) => void) | null;
    const mockRef = {} as DatabaseReference;

    beforeEach(() => {
        onValueCallback = null;
        onErrorCallback = null;
        unsubscribe.mockClear();
        mockOnValue.mockClear();

        mockOnValue.mockImplementation(((_ref: any, callback: any, errorCb: any) => {
            onValueCallback = callback;
            onErrorCallback = errorCb;
            return unsubscribe;
        }) as any);
    });

    it('returns [[], true, undefined] initially', () => {
        const { result } = renderHook(() => useList(mockRef));

        expect(result.current[0]).toEqual([]);
        expect(result.current[1]).toBe(true);
        expect(result.current[2]).toBeUndefined();
    });

    it('subscribes via onValue', () => {
        renderHook(() => useList(mockRef));

        expect(mockOnValue).toHaveBeenCalledTimes(1);
    });

    it('returns snapshots after data arrives', () => {
        const { result } = renderHook(() => useList(mockRef));

        const mockChildren = [
            { key: '1', val: () => ({ name: 'item1' }) },
            { key: '2', val: () => ({ name: 'item2' }) },
        ];
        const mockSnapshot = createMockSnapshot(mockChildren);

        act(() => {
            onValueCallback?.(mockSnapshot);
        });

        expect(result.current[0]).toHaveLength(2);
        expect(result.current[1]).toBe(false);
        expect(result.current[2]).toBeUndefined();
    });

    it('returns error when listener errors', () => {
        const { result } = renderHook(() => useList(mockRef));
        const error = new Error('permission denied');

        act(() => {
            onErrorCallback?.(error);
        });

        expect(result.current[2]).toEqual(error);
        expect(result.current[1]).toBe(false);
    });

    it('unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useList(mockRef));

        unmount();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
});

function createMockSnapshot(children: Array<{ key: string; val: () => any }>): DataSnapshot {
    return {
        forEach: (cb: (child: DataSnapshot) => boolean | void) => {
            children.forEach(child => cb(child as unknown as DataSnapshot));
            return false;
        },
    } as unknown as DataSnapshot;
}
