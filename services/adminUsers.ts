import { auth, firebaseConfig } from '@/firebaseConfig';
import {
    ManageUsersListResponse,
    UpdateCustomClaimsResponse,
} from '@/types/firestore';

type UpdateCustomClaimsPayload = {
    uid: string;
    key: 'admin' | 'gardener' | 'developer' | 'none';
};

interface CallableSuccess<T> {
    result: T;
}

interface CallableErrorResponse {
    error?: {
        message?: string;
        status?: string;
    };
}

const region = 'us-central1';
const callableUrls: Record<string, string> = {
    getUsersForRoleManagement:
        'https://getusersforrolemanagement-k2ziyymiwa-uc.a.run.app',
    updateCustomClaimsForUser:
        'https://updatecustomclaimsforuser-k2ziyymiwa-uc.a.run.app',
};

const getCallableUrl = (functionName: string): string => {
    const url = callableUrls[functionName];

    if (!url) {
        const projectId = firebaseConfig.projectId ?? 'unknown-project';
        throw new Error(
            `No callable URL configured for ${functionName} in ${projectId}/${region}`
        );
    }

    return url;
};

const callFunction = async <TPayload, TResult>(
    functionName: string,
    payload: TPayload
): Promise<TResult> => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error('Authentication required');
    }

    const token = await currentUser.getIdToken();
    const response = await fetch(getCallableUrl(functionName), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: payload }),
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(
            `Callable ${functionName} returned non-JSON response (${response.status}): ${text.slice(0, 120)}`
        );
    }

    const json = (await response.json()) as CallableSuccess<TResult> &
        CallableErrorResponse;

    if (!response.ok || json.error) {
        throw new Error(json.error?.message ?? `Callable ${functionName} failed`);
    }

    return json.result;
};

export const getUsersForRoleManagement = async (): Promise<ManageUsersListResponse> => {
    return callFunction<Record<string, never>, ManageUsersListResponse>(
        'getUsersForRoleManagement',
        {}
    );
};

export const updateCustomClaimsForUser = async (
    payload: UpdateCustomClaimsPayload
): Promise<UpdateCustomClaimsResponse> => {
    return callFunction<UpdateCustomClaimsPayload, UpdateCustomClaimsResponse>(
        'updateCustomClaimsForUser',
        payload
    );
};
