import { auth, firebaseConfig } from '@/firebaseConfig';
import {
    AdminParticipationRosterResponse,
    ToggleParticipationResponse,
} from '@/types/firestore';

type GetParticipationRosterPayload = {
    date: string;
};

type ToggleParticipationPayload = {
    uid: string;
    date: string;
    gardenId: string;
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
    getParticipationRoster:
        'https://getparticipationroster-k2ziyymiwa-uc.a.run.app',
    toggleParticipationForUser:
        'https://toggleparticipationforuser-k2ziyymiwa-uc.a.run.app',
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

export const getParticipationRoster = async (
    payload: GetParticipationRosterPayload
): Promise<AdminParticipationRosterResponse> => {
    return callFunction<GetParticipationRosterPayload, AdminParticipationRosterResponse>(
        'getParticipationRoster',
        payload
    );
};

export const toggleParticipationForUser = async (
    payload: ToggleParticipationPayload
): Promise<ToggleParticipationResponse> => {
    return callFunction<ToggleParticipationPayload, ToggleParticipationResponse>(
        'toggleParticipationForUser',
        payload
    );
};
