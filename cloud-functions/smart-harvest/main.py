"""Smart Harvest – CLIP-based crop image classifier (Cloud Run)."""

from __future__ import annotations

import io
import logging
from functools import lru_cache

import torch
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel
from transformers import CLIPModel, CLIPProcessor

# Configure logging (Cloud Run captures stdout/stderr)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_NAME = "openai/clip-vit-large-patch14"

app = FastAPI(title="Smart Harvest Classifier")


# ---------------------------------------------------------------------------
# Model loading (cached singleton)
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def get_model() -> tuple[CLIPModel, CLIPProcessor]:
    logger.info("Loading CLIP model: %s", MODEL_NAME)
    model = CLIPModel.from_pretrained(MODEL_NAME)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()
    logger.info("CLIP model loaded successfully")
    return model, processor


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------


class Prediction(BaseModel):
    label: str
    confidence: float


class ClassifyResponse(BaseModel):
    predictions: list[Prediction]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/classify", response_model=ClassifyResponse)
async def classify(
    image: UploadFile = File(...),
    labels: str = Form(...),
    top_k: int = Form(None),
    model_pair: tuple = Depends(get_model),
):
    # Validate labels
    label_list = [l.strip() for l in labels.split(",") if l.strip()]
    if len(label_list) < 2:
        logger.warning(
            "Classification request rejected: fewer than 2 labels (count=%d)",
            len(label_list),
        )
        raise HTTPException(status_code=422, detail="At least 2 labels required")

    logger.info(
        "Classification request received: labels_count=%d, labels=%s, top_k=%s, filename=%s",
        len(label_list),
        label_list,
        top_k,
        image.filename,
    )

    model, processor = model_pair

    # Read and open image
    raw = await image.read()
    logger.info("Image read: %d bytes", len(raw))

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        logger.info("Image opened successfully: size=%s", img.size)
    except Exception as e:
        logger.error("Failed to open image: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid image")

    # Run CLIP inference
    # Prompt ensembling — average scores across templates per label
    templates = [
        "a photo of {}",
        "a photo of freshly harvested {}",
        "a close-up photo of {} on a table",
        "{}, a type of vegetable or herb",
    ]
    text_prompts = [t.format(l) for l in label_list for t in templates]
    logger.info(
        "Generated text prompts: num_prompts=%d, num_labels=%d, num_templates=%d",
        len(text_prompts),
        len(label_list),
        len(templates),
    )

    inputs = processor(text=text_prompts, images=img, return_tensors="pt", padding=True)

    logger.info("Running CLIP inference...")
    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits_per_image[0]
    # Reshape to (num_labels, num_templates) and average across templates
    logits = logits.view(len(label_list), len(templates)).mean(dim=1)
    probs = torch.softmax(logits, dim=0).tolist()

    logger.info("CLIP inference complete")

    # Build ranked predictions
    ranked = sorted(zip(label_list, probs), key=lambda x: x[1], reverse=True)

    if top_k is not None:
        ranked = ranked[:top_k]

    predictions = [Prediction(label=l, confidence=c) for l, c in ranked]

    top_pred = predictions[0] if predictions else None
    logger.info(
        "Classification successful: num_predictions=%d, top_label=%s, top_confidence=%.4f",
        len(predictions),
        top_pred.label if top_pred else "N/A",
        top_pred.confidence if top_pred else 0.0,
    )

    return ClassifyResponse(predictions=predictions)
