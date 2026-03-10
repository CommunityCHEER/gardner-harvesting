"""Tests for smart-harvest Cloud Run service (CLIP-based crop classifier)."""

import io
import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app, get_model


MODEL_NAME = "openai/clip-vit-large-patch14"
NUM_PROMPT_TEMPLATES = 2


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def client():
    """FastAPI test client with model dependency overridden."""
    # Override model dependency so tests don't download CLIP weights
    mock_model = MagicMock()
    mock_processor = MagicMock()
    app.dependency_overrides[get_model] = lambda: (mock_model, mock_processor)
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def sample_image_bytes() -> bytes:
    """Generate a minimal valid JPEG image."""
    img = Image.new("RGB", (64, 64), color=(0, 128, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def crop_labels() -> list[str]:
    return ["tomato", "pepper", "lettuce", "carrot", "basil"]


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


class TestHealthCheck:
    def test_health_returns_ok(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# POST /classify – input validation
# ---------------------------------------------------------------------------


class TestClassifyValidation:
    def test_missing_image_returns_422(self, client, crop_labels):
        resp = client.post("/classify", data={"labels": ",".join(crop_labels)})
        assert resp.status_code == 422

    def test_missing_labels_returns_422(self, client, sample_image_bytes):
        resp = client.post(
            "/classify",
            files={"image": ("crop.jpg", sample_image_bytes, "image/jpeg")},
        )
        assert resp.status_code == 422

    def test_empty_labels_returns_422(self, client, sample_image_bytes):
        resp = client.post(
            "/classify",
            files={"image": ("crop.jpg", sample_image_bytes, "image/jpeg")},
            data={"labels": ""},
        )
        assert resp.status_code == 422

    def test_single_label_returns_422(self, client, sample_image_bytes):
        resp = client.post(
            "/classify",
            files={"image": ("crop.jpg", sample_image_bytes, "image/jpeg")},
            data={"labels": "tomato"},
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# POST /classify – successful classification
# ---------------------------------------------------------------------------


class TestClassifySuccess:
    def _mock_clip(self, client, logits: list[float]):
        """Configure mocked CLIP for batched inference (separate image/text encoding)."""
        mock_model = MagicMock()
        mock_processor = MagicMock()

        import torch

        embed_dim = 4
        num_templates = NUM_PROMPT_TEMPLATES

        # Image features: unit vector along dim 0
        image_features = torch.zeros(1, embed_dim)
        image_features[0, 0] = 1.0
        mock_model.get_image_features.return_value = image_features

        # logit_scale: exp(0) = 1.0 (no scaling)
        mock_model.logit_scale = torch.nn.Parameter(torch.tensor(0.0))

        # Expand logits per template (same logit for each template of a label)
        expanded = []
        for label_logit in logits:
            expanded.extend([label_logit] * num_templates)

        # Track which prompts have been consumed across batched calls
        prompt_idx = [0]

        def make_text_features(**kwargs):
            input_ids = kwargs["input_ids"]
            batch_size = input_ids.shape[0]
            features = torch.zeros(batch_size, embed_dim)
            for i in range(batch_size):
                features[i, 0] = expanded[prompt_idx[0] + i]
                features[i, 1] = 1.0  # non-zero norm for normalization
            prompt_idx[0] += batch_size
            return features

        mock_model.get_text_features.side_effect = make_text_features

        # Processor returns different structures for image vs text calls
        def make_processor_output(*args, **kwargs):
            if "images" in kwargs:
                return {"pixel_values": torch.randn(1, 3, 224, 224)}
            elif "text" in kwargs:
                n = len(kwargs["text"])
                return {
                    "input_ids": torch.randint(0, 1000, (n, 10)),
                    "attention_mask": torch.ones(n, 10),
                }

        mock_processor.side_effect = make_processor_output

        app.dependency_overrides[get_model] = lambda: (mock_model, mock_processor)
        return mock_model, mock_processor

    def test_returns_ranked_predictions(self, client, sample_image_bytes, crop_labels):
        logits = [3.0, 1.0, 2.0, 0.5, 4.0]  # basil highest
        self._mock_clip(client, logits)

        resp = client.post(
            "/classify",
            files={"image": ("crop.jpg", sample_image_bytes, "image/jpeg")},
            data={"labels": ",".join(crop_labels)},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert "predictions" in body
        preds = body["predictions"]

        # Should be sorted descending by confidence
        assert len(preds) == len(crop_labels)
        assert preds[0]["label"] == "basil"
        confidences = [p["confidence"] for p in preds]
        assert confidences == sorted(confidences, reverse=True)

    def test_confidences_sum_to_one(self, client, sample_image_bytes, crop_labels):
        logits = [2.0, 1.5, 3.0, 0.1, 1.0]
        self._mock_clip(client, logits)

        resp = client.post(
            "/classify",
            files={"image": ("crop.jpg", sample_image_bytes, "image/jpeg")},
            data={"labels": ",".join(crop_labels)},
        )

        body = resp.json()
        total = sum(p["confidence"] for p in body["predictions"])
        assert abs(total - 1.0) < 1e-5

    def test_each_prediction_has_label_and_confidence(
        self, client, sample_image_bytes, crop_labels
    ):
        logits = [1.0, 2.0, 3.0, 4.0, 5.0]
        self._mock_clip(client, logits)

        resp = client.post(
            "/classify",
            files={"image": ("crop.jpg", sample_image_bytes, "image/jpeg")},
            data={"labels": ",".join(crop_labels)},
        )

        for pred in resp.json()["predictions"]:
            assert "label" in pred
            assert "confidence" in pred
            assert isinstance(pred["label"], str)
            assert isinstance(pred["confidence"], float)

    def test_top_k_limits_results(self, client, sample_image_bytes, crop_labels):
        logits = [1.0, 2.0, 3.0, 4.0, 5.0]
        self._mock_clip(client, logits)

        resp = client.post(
            "/classify",
            files={"image": ("crop.jpg", sample_image_bytes, "image/jpeg")},
            data={"labels": ",".join(crop_labels), "top_k": "3"},
        )

        assert resp.status_code == 200
        assert len(resp.json()["predictions"]) == 3


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------


class TestModelLoading:
    def test_get_model_uses_large_clip_checkpoint(self):
        get_model.cache_clear()

        with patch("main.CLIPModel.from_pretrained") as model_loader, patch(
            "main.CLIPProcessor.from_pretrained"
        ) as processor_loader, patch.dict("os.environ", {}, clear=False):
            model = MagicMock()
            processor = MagicMock()
            model_loader.return_value = model
            processor_loader.return_value = processor

            loaded_model, loaded_processor = get_model()

            assert loaded_model is model
            assert loaded_processor is processor
            model_loader.assert_called_once_with(MODEL_NAME, token=None)
            processor_loader.assert_called_once_with(MODEL_NAME, token=None)
            model.eval.assert_called_once_with()

        get_model.cache_clear()


class TestBatchedInference:
    """Verify that inference uses separate image/text encoding for memory efficiency."""

    def _mock_clip_for_batch_test(self, client, num_labels):
        """Set up mocks that track get_image_features and get_text_features calls."""
        mock_model = MagicMock()
        mock_processor = MagicMock()

        import torch

        embed_dim = 4

        image_features = torch.zeros(1, embed_dim)
        image_features[0, 0] = 1.0
        mock_model.get_image_features.return_value = image_features
        mock_model.logit_scale = torch.nn.Parameter(torch.tensor(0.0))

        def make_text_features(**kwargs):
            batch_size = kwargs["input_ids"].shape[0]
            features = torch.randn(batch_size, embed_dim)
            return features

        mock_model.get_text_features.side_effect = make_text_features

        def make_processor_output(*args, **kwargs):
            if "images" in kwargs:
                return {"pixel_values": torch.randn(1, 3, 224, 224)}
            elif "text" in kwargs:
                n = len(kwargs["text"])
                return {
                    "input_ids": torch.randint(0, 1000, (n, 10)),
                    "attention_mask": torch.ones(n, 10),
                }

        mock_processor.side_effect = make_processor_output

        app.dependency_overrides[get_model] = lambda: (mock_model, mock_processor)
        return mock_model, mock_processor

    def test_image_encoded_once(self, client, sample_image_bytes, crop_labels):
        mock_model, _ = self._mock_clip_for_batch_test(client, len(crop_labels))

        client.post(
            "/classify",
            files={"image": ("crop.jpg", sample_image_bytes, "image/jpeg")},
            data={"labels": ",".join(crop_labels)},
        )

        mock_model.get_image_features.assert_called_once()

    def test_text_encoded_in_batches(self, client, sample_image_bytes):
        """With many labels, text features are computed in multiple batches."""
        many_labels = [f"crop_{i}" for i in range(60)]
        mock_model, _ = self._mock_clip_for_batch_test(client, len(many_labels))

        client.post(
            "/classify",
            files={"image": ("crop.jpg", sample_image_bytes, "image/jpeg")},
            data={"labels": ",".join(many_labels)},
        )

        # 60 labels × 4 templates = 240 prompts, should need multiple batches
        assert mock_model.get_text_features.call_count > 1
