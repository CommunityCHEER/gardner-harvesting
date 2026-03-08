"""Tests for smart-harvest Cloud Run service (CLIP-based crop classifier)."""

import io
from unittest.mock import patch, MagicMock

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app, get_model


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
        """Configure mocked CLIP to return specific logits."""
        mock_model = MagicMock()
        mock_processor = MagicMock()

        # Processor returns dict-like object with pixel_values and input_ids
        mock_inputs = {
            "pixel_values": MagicMock(),
            "input_ids": MagicMock(),
            "attention_mask": MagicMock(),
        }
        mock_processor.return_value = mock_inputs

        # Model returns object with logits_per_image
        import torch

        mock_output = MagicMock()
        mock_output.logits_per_image = torch.tensor([logits])
        mock_model.return_value = mock_output

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
