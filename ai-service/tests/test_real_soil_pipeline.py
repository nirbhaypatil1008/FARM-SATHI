import os
import unittest
from pathlib import Path
from PIL import Image
import numpy as np

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

from app.image_validator import validate_and_preprocess_image, ImageValidationError
from app.soil_model_loader import soil_runtime, SOIL_MODEL_DIR
from app.soil_predictor import predict_soil
from app.soil_knowledge import get_soil_report, SOIL_KNOWLEDGE_BASE


class RealSoilPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        soil_runtime.load()

    def test_model_loaded_successfully(self):
        self.assertTrue(soil_runtime.ready, f"Soil model failed to load: {soil_runtime.error}")
        self.assertEqual(len(soil_runtime.labels), 7)
        expected_classes = [
            "Alluvial Soil", "Arid Soil", "Black Soil", "Laterite Soil",
            "Mountain Soil", "Red Soil", "Yellow Soil"
        ]
        self.assertEqual(sorted(soil_runtime.labels), sorted(expected_classes))
        self.assertEqual(soil_runtime.model.input_shape[1:], (224, 224, 3))
        self.assertEqual(soil_runtime.model.output_shape[-1], 7)

    def test_soil_knowledge_base_covers_all_classes(self):
        for label in soil_runtime.labels:
            self.assertIn(label, SOIL_KNOWLEDGE_BASE)
            report = get_soil_report(label)
            self.assertIn("texture", report["characteristics"])
            self.assertIn("color", report["characteristics"])
            self.assertIn("drainage", report["characteristics"])
            self.assertTrue(len(report["health_assessment"]["strengths"]) > 0)
            self.assertTrue(len(report["health_assessment"]["recommended_tests"]) > 0)
            self.assertTrue(len(report["recommendations"]) > 0)
            self.assertTrue(len(report["crop_suitability"]["primary_crops"]) > 0)

    def test_prediction_on_genuine_soil_image(self):
        dataset_dir = Path("ai-service/data/soil_repo/Orignal-Dataset")
        black_soil_sample = next((dataset_dir / "Black_Soil").glob("*.*"))
        with open(black_soil_sample, "rb") as f:
            raw_bytes = f.read()

        validated = validate_and_preprocess_image(raw_bytes)
        result = predict_soil(validated, soil_runtime)

        self.assertTrue(result["success"])
        self.assertTrue(result["model_ready"])
        self.assertIn(result["status"], ["possible_detection", "inconclusive"])
        self.assertEqual(len(result["probabilities"]), 7)
        self.assertAlmostEqual(sum(result["probabilities"].values()), 1.0, places=2)
        self.assertIn("Black Soil", result["probabilities"])
        self.assertIn("soil_characteristics", result)
        self.assertIn("soil_health", result)
        self.assertIn("recommendations", result)
        self.assertIn("crop_suitability", result)

    def test_corrupted_image_rejected_by_validator(self):
        corrupt_bytes = b"not a valid jpeg or png file header"
        with self.assertRaises(ImageValidationError):
            validate_and_preprocess_image(corrupt_bytes)


if __name__ == "__main__":
    unittest.main()

