import json
import os
from pathlib import Path
from typing import Any

os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
if os.name == "nt" and "CUDA_VISIBLE_DEVICES" not in os.environ:
    os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

SERVICE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_DIR = SERVICE_DIR / "models"

configured_dir = os.getenv("MODEL_DIR")
if configured_dir:
    candidate = Path(configured_dir)
    if candidate.is_absolute() and candidate.is_dir():
        MODEL_DIR = candidate
    elif (candidate / "plant_disease_model.keras").is_file():
        MODEL_DIR = candidate.resolve()
    elif ((SERVICE_DIR / candidate) / "plant_disease_model.keras").is_file():
        MODEL_DIR = (SERVICE_DIR / candidate).resolve()
    elif (SERVICE_DIR / candidate).is_dir():
        MODEL_DIR = (SERVICE_DIR / candidate).resolve()
    else:
        MODEL_DIR = candidate.resolve()
else:
    MODEL_DIR = DEFAULT_MODEL_DIR.resolve()

MODEL_FILENAME = "plant_disease_model.keras"
LABELS_FILENAME = "class_labels.json"
METADATA_FILENAME = "model_metadata.json"


class ModelRuntime:
    def __init__(self) -> None:
        self.model: Any = None
        self.labels: list[str] = []
        self.metadata: dict[str, Any] = {}
        self.error = "Trained model files have not been installed."

    @property
    def ready(self) -> bool:
        return self.model is not None and bool(self.labels)

    def load(self) -> None:
        self.model = None
        self.labels = []
        self.metadata = {}
        self.error = "Trained model files have not been installed."
        model_path = MODEL_DIR / MODEL_FILENAME
        labels_path = MODEL_DIR / LABELS_FILENAME
        metadata_path = MODEL_DIR / METADATA_FILENAME
        missing_metadata = [path.name for path in (labels_path, metadata_path) if not path.is_file()]
        if missing_metadata:
            self.error = f"Model metadata file(s) not found: {', '.join(missing_metadata)}."
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
                raise ValueError("Class labels must be a list or an integer-keyed JSON object.")
            if not labels or any(not isinstance(label, str) or "___" not in label for label in labels):
                raise ValueError("Class labels must contain crop___disease class names.")
            if len(set(labels)) != len(labels):
                raise ValueError("Class labels must be unique.")
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            if metadata.get("input_size") != [224, 224]:
                raise ValueError("Model metadata must declare a 224 x 224 input.")
            if metadata.get("class_count", len(labels)) != len(labels):
                raise ValueError("Model metadata class count does not match the class-label count.")
            if metadata.get("classes", labels) != labels:
                raise ValueError("Model metadata class order does not match the class-label file.")
            self.labels = labels
            self.metadata = metadata
            if not model_path.is_file():
                self.error = f"{MODEL_FILENAME} is not installed. Train in Colab and install the exported model."
                return
            if metadata.get("status") == "training_required":
                raise ValueError("Replace the training-required metadata with the metadata exported alongside the trained model.")
            import tensorflow as tf

            model = tf.keras.models.load_model(model_path, compile=False)
            if tuple(model.input_shape[1:]) != (224, 224, 3):
                raise ValueError("Model input shape must be 224 x 224 RGB.")
            if model.output_shape[-1] != len(labels):
                raise ValueError("Model output count does not match the class-label count.")
            self.model = model
            self.error = ""
        except Exception as error:
            self.model = None
            self.error = f"Could not load the TensorFlow model: {error}"


runtime = ModelRuntime()
