import io
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
from PIL import Image

from app.image_validator import ValidatedImage
from app.soil_model_loader import SoilModelRuntime
from app.soil_predictor import predict_soil


class StubModel:
    input_shape = (None, 224, 224, 3)

    def __init__(self, scores):
        self.output_shape = (None, len(scores))
        self.scores = np.asarray([scores], dtype=np.float32)

    def predict(self, _pixels, verbose=0):
        return self.scores


def image_bytes(color=(120, 80, 40)):
    output = io.BytesIO()
    Image.new("RGB", (224, 224), color=color).save(output, format="PNG")
    return output.getvalue()


class SoilPredictorTests(unittest.TestCase):
    def setUp(self):
        self.runtime = SoilModelRuntime()
        self.runtime.labels = ["Type 1", "Type 2", "Type 3"]
        self.runtime.metadata = {"model_name": "MobileNetV2", "model_version": "soil-v-test"}
        self.runtime.model = StubModel([0.85, 0.1, 0.05])
        self.image = ValidatedImage(pixels=np.zeros((224, 224, 3), dtype=np.float32), is_unclear=False)

    def test_confident_prediction_contains_every_class_probability(self):
        result = predict_soil(self.image, self.runtime)
        self.assertEqual(result["status"], "possible_detection")
        self.assertEqual(result["predicted_class"], "Type 1")
        self.assertEqual(result["model_version"], "soil-v-test")
        self.assertEqual(set(result["probabilities"]), set(self.runtime.labels))
        self.assertAlmostEqual(sum(result["probabilities"].values()), 1)
        self.assertIn("cannot measure", " ".join(result["limitations"]).lower())

    def test_close_or_low_scores_are_inconclusive_without_renaming_labels(self):
        self.runtime.model = StubModel([0.51, 0.45, 0.04])
        result = predict_soil(self.image, self.runtime)
        self.assertEqual(result["status"], "inconclusive")
        self.assertIsNone(result["predicted_class"])
        self.assertEqual(set(result["probabilities"]), set(self.runtime.labels))

    def test_unclear_photo_and_invalid_model_outputs_are_handled(self):
        blurry = ValidatedImage(pixels=self.image.pixels, is_unclear=True)
        self.assertEqual(predict_soil(blurry, self.runtime)["status"], "inconclusive")

        self.runtime.model = StubModel([0.7])
        with self.assertRaisesRegex(RuntimeError, "invalid prediction scores"):
            predict_soil(self.image, self.runtime)

    def test_missing_model_never_returns_a_prediction(self):
        self.runtime.model = None
        with self.assertRaisesRegex(RuntimeError, "not been installed"):
            predict_soil(self.image, self.runtime)

    def test_external_mobilenet_preprocessing_is_applied_when_selected(self):
        class CaptureModel(StubModel):
            def predict(inner_self, pixels, verbose=0):
                inner_self.received = np.asarray(pixels)
                return inner_self.scores

        model = CaptureModel([0.85, 0.1, 0.05])
        self.runtime.model = model
        self.runtime.metadata["preprocessing"] = "mobilenet_v2"
        image = ValidatedImage(pixels=np.full((224, 224, 3), 255, dtype=np.float32), is_unclear=False)
        predict_soil(image, self.runtime)
        self.assertAlmostEqual(float(model.received.max()), 1)


class SoilModelLoadingTests(unittest.TestCase):
    def test_loads_soil_labels_and_model_from_separate_directory(self):
        labels = ["Type 1", "Type 2", "Type 3"]
        with tempfile.TemporaryDirectory() as directory:
            model_dir = Path(directory)
            (model_dir / "soil_labels.json").write_text(json.dumps(labels), encoding="utf-8")
            (model_dir / "soil_visual_model.keras").touch()
            fake_model = StubModel([0.0, 0.0, 0.0])
            tensorflow = SimpleNamespace(keras=SimpleNamespace(
                models=SimpleNamespace(load_model=lambda _path, compile=False: fake_model),
            ))
            runtime = SoilModelRuntime()
            with patch("app.soil_model_loader.SOIL_MODEL_DIR", model_dir), patch.dict("sys.modules", {"tensorflow": tensorflow}):
                runtime.load()

            self.assertTrue(runtime.ready)
            self.assertEqual(runtime.labels, labels)
            self.assertEqual(runtime.metadata, {})

    def test_reports_missing_labels_or_mismatched_model_output(self):
        with tempfile.TemporaryDirectory() as directory:
            model_dir = Path(directory)
            runtime = SoilModelRuntime()
            with patch("app.soil_model_loader.SOIL_MODEL_DIR", model_dir):
                runtime.load()
            self.assertFalse(runtime.ready)
            self.assertIn("soil_labels.json", runtime.error)

            (model_dir / "soil_labels.json").write_text(json.dumps(["Type 1", "Type 2"]), encoding="utf-8")
            (model_dir / "soil_visual_model.keras").touch()
            fake_model = StubModel([0.0])
            tensorflow = SimpleNamespace(keras=SimpleNamespace(
                models=SimpleNamespace(load_model=lambda _path, compile=False: fake_model),
            ))
            with patch("app.soil_model_loader.SOIL_MODEL_DIR", model_dir), patch.dict("sys.modules", {"tensorflow": tensorflow}):
                runtime.load()
            self.assertFalse(runtime.ready)
            self.assertIn("output count", runtime.error)


if __name__ == "__main__":
    unittest.main()
