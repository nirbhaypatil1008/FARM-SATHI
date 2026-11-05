import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from PIL import Image

from app.image_validator import ImageValidationError, validate_and_preprocess_image
from app.model_loader import ModelRuntime
from app.predictor import predict, supported_crops


LABELS = [
    "Tomato___Early_blight",
    "Tomato___healthy",
    "Potato___Late_blight",
]


def image_bytes(image_format="PNG", size=(224, 224)):
    checkerboard = (np.indices(size).sum(axis=0) // 8) % 2 * 255
    image = Image.fromarray(checkerboard.astype(np.uint8)).convert("RGB")
    output = io.BytesIO()
    image.save(output, format=image_format)
    return output.getvalue()


class StubModel:
    def __init__(self, probabilities):
        self.probabilities = np.asarray([probabilities], dtype=np.float32)

    def predict(self, _pixels, verbose=0):
        return self.probabilities


class ImageValidationTests(unittest.TestCase):
    def test_jpeg_png_and_webp_are_preprocessed(self):
        for image_format in ("JPEG", "PNG", "WEBP"):
            with self.subTest(image_format=image_format):
                result = validate_and_preprocess_image(image_bytes(image_format))
                self.assertEqual(result.pixels.shape, (224, 224, 3))
                self.assertEqual(result.pixels.dtype, np.float32)
                self.assertFalse(result.is_unclear)

    def test_rejects_invalid_tiny_and_oversized_images(self):
        with self.assertRaisesRegex(ImageValidationError, "not a readable image"):
            validate_and_preprocess_image(b"not an image")

        with self.assertRaisesRegex(ImageValidationError, "too small"):
            validate_and_preprocess_image(image_bytes(size=(64, 64)))

        with patch("app.image_validator.MAX_IMAGE_BYTES", 100):
            with self.assertRaisesRegex(ImageValidationError, "smaller than 5 MB"):
                validate_and_preprocess_image(image_bytes())

    def test_low_detail_image_is_marked_unclear(self):
        image = Image.new("RGB", (224, 224), color="green")
        output = io.BytesIO()
        image.save(output, format="PNG")
        result = validate_and_preprocess_image(output.getvalue())
        self.assertTrue(result.is_unclear)


class PredictionTests(unittest.TestCase):
    def setUp(self):
        self.runtime = ModelRuntime()
        self.runtime.labels = LABELS
        self.runtime.metadata = {"model_version": "test-version"}
        self.runtime.model = StubModel([0.8, 0.1, 0.1])
        self.image = validate_and_preprocess_image(image_bytes())

    def test_supported_crops_are_derived_from_model_labels(self):
        self.assertEqual(
            supported_crops(LABELS),
            [
                {"crop": "Potato", "diseases": ["Late blight"]},
                {"crop": "Tomato", "diseases": ["Early blight", "healthy"]},
            ],
        )

    def test_confident_prediction_has_no_unsourced_treatment_claims(self):
        result = predict(self.image, "Tomato", self.runtime)
        self.assertEqual(result["status"], "possible_detection")
        self.assertEqual(result["predictedDisease"], "Early blight")
        self.assertEqual(result["modelVersion"], "test-version")
        self.assertFalse(result["knowledge"]["available"])
        self.assertEqual(result["knowledge"]["nextSteps"], [])

    def test_healthy_prediction_is_distinguished(self):
        self.runtime.model = StubModel([0.1, 0.8, 0.1])
        result = predict(self.image, "Tomato", self.runtime)
        self.assertEqual(result["status"], "healthy")
        self.assertEqual(result["predictedDisease"], "No disease pattern detected")

    def test_low_confidence_is_inconclusive_and_keeps_ranked_classes(self):
        self.runtime.model = StubModel([0.5, 0.4, 0.1])
        result = predict(self.image, "Tomato", self.runtime)
        self.assertEqual(result["status"], "inconclusive")
        self.assertEqual(len(result["topPredictions"]), 3)

    def test_unsupported_and_mismatched_crops_are_not_diagnosed(self):
        unsupported = predict(self.image, "Rice", self.runtime)
        self.assertEqual(unsupported["status"], "unsupported_crop")

        mismatch = predict(self.image, "Potato", self.runtime)
        self.assertEqual(mismatch["status"], "crop_mismatch")
        self.assertEqual(mismatch["predictedDisease"], "Selected crop does not match the image prediction")

    def test_unclear_image_and_unavailable_model_are_handled(self):
        unclear = self.image.__class__(pixels=self.image.pixels, is_unclear=True)
        self.assertEqual(predict(unclear, None, self.runtime)["status"], "inconclusive")

        self.runtime.model = None
        with self.assertRaisesRegex(RuntimeError, "not been installed"):
            predict(self.image, None, self.runtime)

    def test_invalid_model_output_is_an_explicit_failure(self):
        self.runtime.model = StubModel([0.8])
        with self.assertRaisesRegex(RuntimeError, "invalid prediction scores"):
            predict(self.image, None, self.runtime)


class ModelLoadingTests(unittest.TestCase):
    def test_missing_weights_keep_class_list_but_never_mark_model_ready(self):
        with tempfile.TemporaryDirectory() as directory:
            model_dir = Path(directory)
            (model_dir / "class_labels.json").write_text(json.dumps(LABELS), encoding="utf-8")
            (model_dir / "model_metadata.json").write_text(
                json.dumps({"input_size": [224, 224], "class_count": len(LABELS), "classes": LABELS}),
                encoding="utf-8",
            )
            runtime = ModelRuntime()
            with patch("app.model_loader.MODEL_DIR", model_dir):
                runtime.load()

            self.assertFalse(runtime.ready)
            self.assertEqual(runtime.labels, LABELS)
            self.assertIn("is not installed", runtime.error)

    def test_training_placeholder_metadata_cannot_activate_a_model(self):
        with tempfile.TemporaryDirectory() as directory:
            model_dir = Path(directory)
            (model_dir / "class_labels.json").write_text(json.dumps(LABELS), encoding="utf-8")
            (model_dir / "model_metadata.json").write_text(
                json.dumps({"status": "training_required", "input_size": [224, 224]}),
                encoding="utf-8",
            )
            (model_dir / "plant_disease_model.keras").touch()
            runtime = ModelRuntime()
            with patch("app.model_loader.MODEL_DIR", model_dir):
                runtime.load()

            self.assertFalse(runtime.ready)
            self.assertIn("training-required metadata", runtime.error)


if __name__ == "__main__":
    unittest.main()
