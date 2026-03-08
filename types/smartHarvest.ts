export interface Prediction {
    label: string;
    confidence: number;
}

export interface ClassifyResponse {
    predictions: Prediction[];
}

export interface ClassifyRequest {
    imageUri: string;
    labels: string[];
    topK?: number;
}
