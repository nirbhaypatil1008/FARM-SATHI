import json
import os
from pathlib import Path
from typing import Any


DEFAULT_SOIL_MODEL_DIR = Path(__file__).resolve().parents[1] / "models" / "soil"
SOIL_MODEL_DIR = Path(os.getenv("SOIL_MODEL_DIR", str(DEFAULT_SOIL_MODEL_DIR))).resolve()
SOIL_MODEL_FILENAME = "soil_visual_model.keras"
SOIL_LABELS_FILENAME = "soil_labels.json"
SOIL_METADATA_FILENAME = "soil_model_metadata.json"
ALLOWED_PREPROCESSING = {"embedded_mobilenet_v2", "mobilenet_v2"}
SOIL_PREPROCESSING = os.getenv("SOIL_PREPROCESSING", "embedded_mobilenet_v2")

if SOIL_PREPROCESSING not in ALLOWED_PREPROCESSING:
    raise ValueError(f"SOIL_PREPROCESSING must be one of {sorted(ALLOWED_PREPROCESSING)}.")


class SoilModelRuntime:
    def __init__(self) -> None:
        self.model: Any = None
        self.labels: list[str] = []
        self.metadata: dict[str, Any] = {}
        self.error = "The trained soil model has not been installed."

    @property
    def ready(self) -> bool:
        return self.model is not None and bool(self.labels)

    def load(self) -> None:
        self.model = None
        self.labels = []
        self.metadata = {}
        self.error = "The trained soil model has not been installed."
        model_path = SOIL_MODEL_DIR / SOIL_MODEL_FILENAME
        labels_path = SOIL_MODEL_DIR / SOIL_LABELS_FILENAME
        metadata_path = SOIL_MODEL_DIR / SOIL_METADATA_FILENAME
        missing = [path.name for path in (model_path, labels_path) if not path.is_file()]
        if missing:
            self.error = f"Soil model file(s) not found: {', '.join(missing)}. Place the trained files in ai-service/models/soil/."
            return
        try:
            labels_document = json.loads(labels_path.read_text(encoding="utf-8"))
            if isinstance(labels_document, dict) and "classes" in labels_document:
                labels_document = labels_document["classes"]
            if isinstance(labels_document, list):
                labels = labels_document
            elif isinstance(labels_document, dict):
                labels = [labels_document[str(index)] for index in range(len(labels_document))]
            else:
                raise ValueError("Soil class labels must be a list or integer-keyed JSON object.")
            if len(labels) < 2 or any(not isinstance(label, str) or not label.strip() for label in labels):
                raise ValueError("Soil class labels must contain at least two non-empty labels.")
            if len(set(labels)) != len(labels):
                raise ValueError("Soil class labels must be unique.")
            metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.is_file() else {}
            if metadata.get("status") == "training_required":
                raise ValueError("Replace the training-required metadata with the export from the trained model.")
            if metadata.get("preprocessing", SOIL_PREPROCESSING) not in ALLOWED_PREPROCESSING:
                raise ValueError(f"Soil model preprocessing must be one of {sorted(ALLOWED_PREPROCESSING)}.")
            if "input_size" in metadata and metadata["input_size"] != [224, 224]:
                raise ValueError("Soil model metadata must declare a 224 x 224 input.")
            if metadata.get("class_count", len(labels)) != len(labels):
                raise ValueError("Soil model class count does not match the label file.")
            if metadata.get("classes", labels) != labels:
                raise ValueError("Soil model metadata class order does not match the label file.")
            self.labels = labels
            self.metadata = metadata
            import tensorflow as tf

            model = tf.keras.models.load_model(model_path, compile=False)
            if tuple(model.input_shape[1:]) != (224, 224, 3):
                raise ValueError("Soil model input shape must be 224 x 224 RGB.")
            if model.output_shape[-1] != len(labels):
                raise ValueError("Soil model output count does not match the class-label count.")
            self.model = model
            self.error = ""
        except Exception as error:
            self.model = None
            self.error = f"Could not load the soil TensorFlow model: {error}"


soil_runtime = SoilModelRuntime()
