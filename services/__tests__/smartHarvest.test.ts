import { classifyImage, identifyCrop, resizeForUpload, SMART_HARVEST_URL } from '@/services/smartHarvest';
import { ClassifyResponse } from '@/types/smartHarvest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockManipulateAsync = jest.fn();
jest.mock('expo-image-manipulator', () => ({
    manipulateAsync: (...args: unknown[]) => mockManipulateAsync(...args),
    SaveFormat: { JPEG: 'jpeg' },
}));

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// ---------------------------------------------------------------------------
// resizeForUpload
// ---------------------------------------------------------------------------

describe('resizeForUpload', () => {
    beforeEach(() => jest.clearAllMocks());

    it('resizes image to max 1024px wide and returns JPEG uri', async () => {
        mockManipulateAsync.mockResolvedValue({ uri: 'file:///resized.jpg' });

        const uri = await resizeForUpload('file:///original.jpg');

        expect(uri).toBe('file:///resized.jpg');
        expect(mockManipulateAsync).toHaveBeenCalledWith(
            'file:///original.jpg',
            [{ resize: { width: 1024 } }],
            { compress: 0.8, format: 'jpeg' },
        );
    });

    it('passes through manipulateAsync errors', async () => {
        mockManipulateAsync.mockRejectedValue(new Error('disk full'));

        await expect(resizeForUpload('file:///bad.jpg')).rejects.toThrow('disk full');
    });
});

// ---------------------------------------------------------------------------
// classifyImage
// ---------------------------------------------------------------------------

describe('classifyImage', () => {
    beforeEach(() => jest.clearAllMocks());

    const fakeResizedUri = 'file:///resized.jpg';

    // Arrange helper – mock resize + successful fetch
    function arrangeSuccess(body: ClassifyResponse) {
        mockManipulateAsync.mockResolvedValue({ uri: fakeResizedUri });
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => body,
        });
    }

    it('resizes the image before sending', async () => {
        arrangeSuccess({ predictions: [{ label: 'tomato', confidence: 0.9 }] });

        await classifyImage({
            imageUri: 'file:///photo.jpg',
            labels: ['tomato', 'pepper'],
        });

        expect(mockManipulateAsync).toHaveBeenCalledWith(
            'file:///photo.jpg',
            [{ resize: { width: 1024 } }],
            { compress: 0.8, format: 'jpeg' },
        );
    });

    it('sends multipart form with image, labels, and optional top_k', async () => {
        arrangeSuccess({ predictions: [] });

        await classifyImage({
            imageUri: 'file:///photo.jpg',
            labels: ['tomato', 'pepper', 'basil'],
            topK: 2,
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, opts] = mockFetch.mock.calls[0];
        expect(url).toBe(`${SMART_HARVEST_URL}/classify`);
        expect(opts.method).toBe('POST');

        const body: FormData = opts.body;
        expect(body).toBeInstanceOf(FormData);
    });

    it('returns parsed ClassifyResponse on success', async () => {
        const expected: ClassifyResponse = {
            predictions: [
                { label: 'tomato', confidence: 0.7 },
                { label: 'pepper', confidence: 0.3 },
            ],
        };
        arrangeSuccess(expected);

        const result = await classifyImage({
            imageUri: 'file:///photo.jpg',
            labels: ['tomato', 'pepper'],
        });

        expect(result).toEqual(expected);
    });

    it('throws on non-ok response', async () => {
        mockManipulateAsync.mockResolvedValue({ uri: fakeResizedUri });
        mockFetch.mockResolvedValue({
            ok: false,
            status: 422,
            text: async () => 'At least 2 labels required',
        });

        await expect(
            classifyImage({ imageUri: 'file:///photo.jpg', labels: ['tomato', 'pepper'] }),
        ).rejects.toThrow('Smart Harvest classification failed (422)');
    });

    it('requires at least 2 labels', async () => {
        await expect(
            classifyImage({ imageUri: 'file:///photo.jpg', labels: ['tomato'] }),
        ).rejects.toThrow('At least 2 labels required');

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('builds FormData with correct fields', async () => {
        const appendSpy = jest.spyOn(FormData.prototype, 'append');
        arrangeSuccess({ predictions: [] });

        await classifyImage({
            imageUri: 'file:///photo.jpg',
            labels: ['tomato', 'pepper'],
            topK: 3,
        });

        expect(appendSpy).toHaveBeenCalledWith('labels', 'tomato,pepper');
        expect(appendSpy).toHaveBeenCalledWith('top_k', '3');
        // image part: { uri, name, type }
        const imageCall = appendSpy.mock.calls.find((c) => c[0] === 'image');
        expect(imageCall).toBeTruthy();
        expect(imageCall![1]).toMatchObject({
            uri: fakeResizedUri,
            type: 'image/jpeg',
        });
        appendSpy.mockRestore();
    });

    it('omits top_k from FormData when not provided', async () => {
        const appendSpy = jest.spyOn(FormData.prototype, 'append');
        arrangeSuccess({ predictions: [] });

        await classifyImage({
            imageUri: 'file:///photo.jpg',
            labels: ['tomato', 'pepper'],
        });

        const topKCall = appendSpy.mock.calls.find((c) => c[0] === 'top_k');
        expect(topKCall).toBeUndefined();
        appendSpy.mockRestore();
    });
});

// ---------------------------------------------------------------------------
// identifyCrop
// ---------------------------------------------------------------------------

describe('identifyCrop', () => {
    beforeEach(() => jest.clearAllMocks());

    const crops = [
        { value: 'crop-tomato', label: 'Tomato' },
        { value: 'crop-pepper', label: 'Pepper' },
        { value: 'crop-basil', label: 'Basil' },
    ];

    function arrangeClassify(predictions: ClassifyResponse['predictions']) {
        mockManipulateAsync.mockResolvedValue({ uri: 'file:///resized.jpg' });
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ predictions }),
        });
    }

    it('returns the crop value matching the top prediction label', async () => {
        arrangeClassify([
            { label: 'Tomato', confidence: 0.8 },
            { label: 'Pepper', confidence: 0.2 },
        ]);

        const result = await identifyCrop('file:///photo.jpg', crops);
        expect(result).toBe('crop-tomato');
    });

    it('passes crop labels to classifyImage', async () => {
        arrangeClassify([{ label: 'Basil', confidence: 0.9 }]);

        await identifyCrop('file:///photo.jpg', crops);

        const appendSpy = mockFetch.mock.calls[0][1].body as FormData;
        expect(appendSpy).toBeInstanceOf(FormData);
    });

    it('returns null when predictions are empty', async () => {
        arrangeClassify([]);

        const result = await identifyCrop('file:///photo.jpg', crops);
        expect(result).toBeNull();
    });

    it('returns null when top prediction label does not match any crop', async () => {
        arrangeClassify([{ label: 'Unknown Veggie', confidence: 0.9 }]);

        const result = await identifyCrop('file:///photo.jpg', crops);
        expect(result).toBeNull();
    });

    it('requires at least 2 crops', async () => {
        await expect(
            identifyCrop('file:///photo.jpg', [{ value: 'crop-1', label: 'One' }]),
        ).rejects.toThrow('At least 2 labels required');
    });

    it('propagates classifyImage errors', async () => {
        mockManipulateAsync.mockResolvedValue({ uri: 'file:///resized.jpg' });
        mockFetch.mockResolvedValue({ ok: false, status: 500 });

        await expect(
            identifyCrop('file:///photo.jpg', crops),
        ).rejects.toThrow('Smart Harvest classification failed (500)');
    });
});
