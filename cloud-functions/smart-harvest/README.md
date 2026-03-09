# Smart Harvest — CLIP-Based Crop Classifier (Cloud Run)

A FastAPI service that classifies crop images using OpenAI's CLIP vision-language model. Deployed on Google Cloud Run with min-instances=0 (free tier friendly).

## Overview

**Smart Harvest** processes images uploaded from the Gardner Harvesting mobile app to automatically identify crops. When a user takes a photo of a harvest and taps "Identify Crop", the app sends the image to this service, which returns ranked crop predictions with confidence scores.

### Key Features

- **Fast inference**: CLIP model cached after first load (subsequent requests are ~1-2s).
- **Prompt ensembling**: Queries multiple text templates per crop label to reduce false positives (e.g., "a photo of tomato", "a close-up photo of tomato on a table").
- **Confidence-based filtering**: Returns only predictions above a confidence threshold (0.15 by default in the app).
- **Cold-start friendly**: Scales to zero instances when idle (no requests) — billed only when processing requests.
- **Fully tested**: Unit tests mock CLIP to validate prediction ranking, confidence validation, and error handling without downloading model weights during test runs.

## Architecture

### Diagram

```
Gardner Harvesting Mobile App
          ↓ (POST /classify)
     [Image + Labels]
          ↓
     Smart Harvest API
   (Cloud Run Service)
          ↓
   CLIP Model Inference
          ↓
   [Ranked Predictions]
          ↓
    Mobile App
  (Shows top prediction)
```

### Tech Stack

| Component | Technology | Version |
|---|---|---|
| Framework | FastAPI | 0.115.0 |
| WSGI Server | Uvicorn | 0.30.6 |
| ML Model | Transformers (HuggingFace) | 4.44.2 |
| Deep Learning | PyTorch | 2.4.1 |
| Image Processing | Pillow | 10.4.0 |
| Testing | pytest + httpx | 8.3.3 + 0.27.2 |
| Container | Docker | (standard) |
| Hosting | Google Cloud Run | (managed) |

## API Specification

### GET `/health`

Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

---

### POST `/classify`

Classifies a crop image.

**Request:**
- `Content-Type: multipart/form-data`
- **Form fields:**
  - `image` (file, required): JPEG or PNG image file.
  - `labels` (string, required): Comma-separated crop labels (e.g., `"tomato,pepper,basil"`).
  - `top_k` (int, optional): Return only top-k predictions. Defaults to all predictions ranked.

**Example cURL:**
```bash
curl -X POST https://smart-harvest-XXX.run.app/classify \
  -F "image=@photo.jpg" \
  -F "labels=tomato,pepper,lettuce,basil"
```

**Response (200 OK):**
```json
{
  "predictions": [
    { "label": "tomato", "confidence": 0.82 },
    { "label": "pepper", "confidence": 0.12 },
    { "label": "lettuce", "confidence": 0.04 },
    { "label": "basil", "confidence": 0.02 }
  ]
}
```

Predictions are **always sorted by confidence (highest first)**.

**Error Responses:**
- `400`: Invalid image file.
- `422`: Missing/invalid fields (fewer than 2 labels, missing image).

---

## Deployment

### Prerequisites

- `gcloud` CLI ([install](https://cloud.google.com/sdk/docs/install))
- Docker Desktop
- Authenticated with Google Cloud (`gcloud auth login`)

### Deploy from Source

The service builds and deploys directly from this folder's `Dockerfile`:

```bash
cd cloud-functions/smart-harvest

# Set target project and region
export PROJECT_ID=cheer-app-prototype
export REGION=us-central1
export SERVICE_NAME=smart-harvest

# Deploy (builds Docker image, pushes to Artifact Registry, deploys to Cloud Run)
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --min-instances 0 \
  --project "$PROJECT_ID"
```

**What happens:**
1. Artifact Registry repository (`cloud-run-source-deploy`) is created (first time only).
2. Docker image is built from the `Dockerfile`.
3. Image is pushed to `us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/...`.
4. Cloud Run service is created/updated with the image.
5. Service URL is printed at the end.

**Output example:**
```
Service URL: https://smart-harvest-XXX.us-central1.run.app
```

### Environment Variables (Mobile App)

Store the service URL in your local environment:

**`.env`** (local dev):
```env
EXPO_PUBLIC_SMART_HARVEST_URL=https://smart-harvest-XXX.us-central1.run.app
```

**EAS environments** (cloud builds):
```bash
npx eas env:create --environment production \
  --name EXPO_PUBLIC_SMART_HARVEST_URL \
  --value https://smart-harvest-XXX.us-central1.run.app \
  --type string
```

### Costs

- **Compute**: ~$0.00002 per request (compute time under free tier most months).
- **Memory**: 512 MB (default, suitable for CLIP model).
- **Free tier limit**: ~2M requests/month or ~500K vCPU-seconds/month.
- **Min-instances=0**: Scales to zero when idle — billed only when handling requests.

> **Note:** First request takes ~30-40s (model download + inference). Subsequent requests ~1-2s.

---

## Local Development

### Build Docker image locally

```bash
cd cloud-functions/smart-harvest

docker build -t smart-harvest .
```

### Run container

```bash
docker run -p 8080:8080 smart-harvest
```

Service listens at `http://localhost:8080`.

### Test endpoint

```bash
# Health check
curl http://localhost:8080/health

# Classify (with a sample image)
curl -X POST http://localhost:8080/classify \
  -F "image=@path/to/photo.jpg" \
  -F "labels=tomato,pepper,basil"
```

### Run Tests Locally

Install dev dependencies:

```bash
cd cloud-functions/smart-harvest

pip install -r requirements.txt
pytest -v test_main.py
```

Tests mock the CLIP model so the heavy weights aren't downloaded. Run time: ~2-5 seconds.

---

## Logging & Debugging

### Production Logs

Logs from Cloud Run requests appear in Google Cloud Console:

```bash
gcloud logging read "resource.type='cloud_run_revision' AND resource.labels.service_name='smart-harvest'" \
  --limit 50 --format json | jq .
```

Or view in the [Cloud Console](https://console.cloud.google.com/run) → **smart-harvest** → **Logs**.

### App-Side Logging

The Gardner Harvesting mobile app logs all classification requests using a production-safe logger in [`utility/logger.ts`](../../utility/logger.ts):

- **Request logs**: Endpoint URL, number of labels, top_k param.
- **Response logs**: HTTP status, predictions, confidence scores per label.
- **Error logs**: HTTP status, error response body, exception details.
- **Threshold logs**: Confidence gap vs. threshold (why a prediction was rejected).

Example production log output:
```
[2026-03-08T12:34:56.789Z] [INFO] [SmartHarvest.classifyImage] Starting image classification | {"url":"https://smart-harvest-XXX.run.app/classify","numLabels":5,"labels":["tomato","pepper","lettuce","basil","carrot"],"topK":undefined}
[2026-03-08T12:34:57.123Z] [INFO] [SmartHarvest.classifyImage] Received response | {"status":200,"statusText":""}
[2026-03-08T12:34:57.234Z] [INFO] [SmartHarvest.classifyImage] Classification successful | {"numPredictions":5,"predictions":[{"label":"tomato","confidence":0.82},{"label":"pepper","confidence":0.12},{"label":"lettuce","confidence":0.04},{"label":"basil","confidence":0.01},{"label":"carrot","confidence":0.01}]}
[2026-03-08T12:34:57.234Z] [INFO] [SmartHarvest.identifyCrop] Top prediction | {"label":"tomato","confidence":0.82,"thresholdMet":true}
[2026-03-08T12:34:57.235Z] [INFO] [SmartHarvest.identifyCrop] Crop identified successfully | {"cropValue":"tomato-001","cropLabel":"tomato","confidence":0.82}
```

Check these logs to diagnose issues like:
- **API fails to respond**: Check HTTP status (e.g., 500, 502).
- **"Unable to identify crop" despite clear photo**: Check if confidence is below the threshold (0.15).
- **Wrong crop identified**: Check which label CLIP predicted highest.

### Debugging a Classification Failure

If the app shows "unable to identify crop" for a valid photo:

1. **Check service health:**
   ```bash
   curl https://smart-harvest-XXX.run.app/health
   ```
   Should return `{"status":"ok"}` with HTTP 200.

2. **Check app logs** (in mobile app debug output or Expo console):
   - Does the API respond at all?
   - What HTTP status code?
   - What predictions were returned?
   - What was the top prediction's confidence?

3. **Check Cloud Run logs:**
   ```bash
   gcloud logging read "resource.type='cloud_run_revision' AND resource.labels.service_name='smart-harvest'" \
     --limit 20 --format json | jq '.[] | {timestamp: .timestamp, textPayload: .textPayload}' -r
   ```

4. **Check label matching:**
   - Ensure the label in the Firestore `crops` collection matches exactly (case-sensitive).
   - Example: If Firebase has `"Tomato"` but app is classifying against `"tomato"`, CLIP will never match.

### Model Performance Notes

CLIP performs well on:
- ✅ Common vegetables (tomato, pepper, cucumber, lettuce, bean, etc.)
- ✅ Diverse angles and lighting

CLIP struggles with:
- ❌ Very small, blurry, or dark images
- ❌ Non-English crop names (use English labels)
- ❌ Labels that have no visual representation (e.g., "seed" vs. the full plant)

If classification is consistently failing for a specific crop, consider:
- Asking users to photograph the mature plant/harvest (not leaves alone).
- Testing with well-lit, straight-on shots.
- Using more descriptive labels (e.g., "red tomato" instead of "tomato").

---

## File Structure

```
cloud-functions/smart-harvest/
├── main.py              # FastAPI service + CLIP inference
├── requirements.txt     # Python dependencies
├── Dockerfile           # Container image definition
├── test_main.py         # Unit tests (mocked CLIP model)
└── README.md            # This file
```

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAI CLIP Model](https://github.com/openai/CLIP)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [HuggingFace Transformers Library](https://huggingface.co/docs/transformers/)

