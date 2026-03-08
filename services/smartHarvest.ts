import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ClassifyRequest, ClassifyResponse } from '@/types/smartHarvest';

export const SMART_HARVEST_URL =
    process.env.EXPO_PUBLIC_SMART_HARVEST_URL ?? 'https://smart-harvest.run.app';

const MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.8;

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

    if (__DEV__) {
        console.info(`[SmartHarvest] classify -> ${SMART_HARVEST_URL}/classify`);
    }

    const resizedUri = await resizeForUpload(req.imageUri);

    const form = new FormData();
    form.append('image', {
        uri: resizedUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
    } as any);
    form.append('labels', req.labels.join(','));
    if (req.topK !== undefined) {
        form.append('top_k', String(req.topK));
    }

    const response = await fetch(`${SMART_HARVEST_URL}/classify`, {
        method: 'POST',
        body: form,
    });

    if (!response.ok) {
        throw new Error(`Smart Harvest classification failed (${response.status})`);
    }

    return response.json();
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
