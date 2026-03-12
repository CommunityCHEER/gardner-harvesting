import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { ClassifyRequest, ClassifyResponse } from '@/types/smartHarvest';
import { logger } from '@/utility/logger';

export const SMART_HARVEST_URL =
    process.env.EXPO_PUBLIC_SMART_HARVEST_URL ?? 'https://smart-harvest.run.app';

const MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.8;

const ANDROID_LOCAL_HOSTS = new Set(['10.0.2.2', 'localhost', '127.0.0.1']);

export function isAndroidLocalSmartHarvestUrl(
    baseUrl: string,
    platform: string = Platform.OS,
): boolean {
    if (platform !== 'android') return false;

    try {
        const host = new URL(baseUrl).hostname;
        return ANDROID_LOCAL_HOSTS.has(host);
    } catch {
        return false;
    }
}

async function runLocalAndroidPreflight(baseUrl: string): Promise<void> {
    if (!isAndroidLocalSmartHarvestUrl(baseUrl)) return;

    const healthUrl = `${baseUrl}/health`;

    try {
        const healthResponse = await fetch(healthUrl, { method: 'GET' });
        if (!healthResponse.ok) {
            throw new Error(`Health check failed (${healthResponse.status})`);
        }
    } catch (error) {
        logger.error('SmartHarvest.classifyImage', 'Local Android preflight failed', {
            baseUrl,
            healthUrl,
            error: error instanceof Error ? error.message : String(error),
        });
        throw new Error(
            'Smart Harvest local backend unreachable on Android. Emulator: use http://10.0.2.2:8080. Physical device via adb: run "adb reverse tcp:8080 tcp:8080" and use http://127.0.0.1:8080.',
        );
    }
}

export async function resizeForUpload(uri: string): Promise<string> {
    const result = await manipulateAsync(
        uri,
        [{ resize: { width: MAX_WIDTH } }],
        { compress: COMPRESS_QUALITY, format: SaveFormat.JPEG },
    );
    return result.uri;
}

export async function classifyImage(req: ClassifyRequest): Promise<ClassifyResponse> {
    if (req.labels.length < 2) {
        throw new Error('At least 2 labels required');
    }
    logger.info('SmartHarvest.classifyImage', 'Starting image classification', {
        url: `${SMART_HARVEST_URL}/classify`,
        numLabels: req.labels.length,
        labels: req.labels,
        topK: req.topK,
    });

    await runLocalAndroidPreflight(SMART_HARVEST_URL);

    const resizedUri = await resizeForUpload(req.imageUri);

    const form = new FormData();
    form.append('image', {
        uri: resizedUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
    } as any);
    form.append('labels', req.labels.join('|'));
    if (req.topK !== undefined) {
        form.append('top_k', String(req.topK));
    }

    try {
        const response = await fetch(`${SMART_HARVEST_URL}/classify`, {
            method: 'POST',
            body: form,
        });

        logger.info('SmartHarvest.classifyImage', 'Received response', {
            status: response.status,
            statusText: response.statusText,
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('SmartHarvest.classifyImage', 'Classification request failed', {
                status: response.status,
                errorBody: errorText,
            });
            throw new Error(`Smart Harvest classification failed (${response.status})`);
        }

        const result: ClassifyResponse = await response.json();

        logger.info('SmartHarvest.classifyImage', 'Classification successful', {
            numPredictions: result.predictions.length,
            predictions: result.predictions,
        });

        return result;
    } catch (error) {
        logger.error('SmartHarvest.classifyImage', 'Classification request error', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}

export async function identifyCrop(
    imageUri: string,
    crops: { value: string; label: string }[],
): Promise<string | null> {
    const CONFIDENCE_THRESHOLD = 0.15;
    const labels = crops.map(c => c.label);
    const { predictions } = await classifyImage({ imageUri, labels });
    if (predictions.length === 0) return null;
    const topPrediction = predictions[0];
    if (topPrediction.confidence < CONFIDENCE_THRESHOLD) return null;
    const match = crops.find(c => c.label === topPrediction.label);
    return match?.value ?? null;
}
