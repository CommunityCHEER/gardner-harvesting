"""Smart Harvest – CLIP-based crop image classifier (Cloud Run)."""

from __future__ import annotations

import io
from functools import lru_cache

import torch
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "openai/clip-vit-base-patch32"

app = FastAPI(title="Smart Harvest Classifier")


# ---------------------------------------------------------------------------
# Model loading (cached singleton)
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def get_model() -> tuple[CLIPModel, CLIPProcessor]:
    model = CLIPModel.from_pretrained(MODEL_NAME)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()
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
        raise HTTPException(status_code=422, detail="At least 2 labels required")

    model, processor = model_pair

    # Read and open image
    raw = await image.read()
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image")

    # Run CLIP inference
    text_prompts = [f"a photo of {l}" for l in label_list]
    inputs = processor(text=text_prompts, images=img, return_tensors="pt", padding=True)

    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits_per_image[0]
    probs = torch.softmax(logits, dim=0).tolist()

    # Build ranked predictions
    ranked = sorted(zip(label_list, probs), key=lambda x: x[1], reverse=True)

    if top_k is not None:
        ranked = ranked[:top_k]

    return ClassifyResponse(
        predictions=[Prediction(label=l, confidence=c) for l, c in ranked]
    )
