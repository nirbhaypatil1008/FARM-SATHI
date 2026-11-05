import os

import numpy as np

from .image_validator import ValidatedImage
from .soil_model_loader import SOIL_PREPROCESSING, SoilModelRuntime


CONFIDENCE_THRESHOLD = float(os.getenv("SOIL_CONFIDENCE_THRESHOLD", "0.65"))
MARGIN_THRESHOLD = float(os.getenv("SOIL_MARGIN_THRESHOLD", "0.12"))

if not 0 <= CONFIDENCE_THRESHOLD <= 1:
    raise ValueError("SOIL_CONFIDENCE_THRESHOLD must be between 0 and 1.")
if not 0 <= MARGIN_THRESHOLD <= 1:
    raise ValueError("SOIL_MARGIN_THRESHOLD must be between 0 and 1.")

SOIL_LIMITATIONS = [
    "This model only distinguishes the generic classes represented in its training dataset; class names are not verified soil taxonomy.",
    "A photograph cannot measure pH, nutrients, salinity, organic carbon, electrical conductivity, or actual soil moisture.",
    "Image lighting, camera, location, and field conditions may differ from the small training dataset. Model scores are not calibrated field accuracy.",
]


def _result(
    *,
    soil_category: str | None,
    confidence: float,
    status: str,
    top_predictions: list[dict],
    model_name: str,
    model_version: str | None,
    message: str,
    visual_characteristics: list[str] | None = None,
) -> dict:
    probabilities = {
        str(item["soilCategory"]): float(item["confidence"])
        for item in top_predictions
    }
    return {
        "success": True,
        "predicted_class": soil_category,
        "confidence": round(float(confidence), 6),
        "status": status,
        "probabilities": probabilities,
        "model_ready": True,
        "analysis_type": "visual_soil_classification",
        "model_name": model_name,
        "model_version": model_version,
        "message": message,
        "limitations": SOIL_LIMITATIONS,
        "top_predictions": top_predictions,
        "visual_characteristics": visual_characteristics or [],
    }


def predict_soil(image: ValidatedImage, runtime: SoilModelRuntime) -> dict:
    if not runtime.ready:
        raise RuntimeError(runtime.error)
    if image.is_unclear:
        return _result(
            soil_category=None,
            confidence=0,
            status="inconclusive",
            top_predictions=[],
            model_name=str(runtime.metadata.get("model_name", "MobileNetV2")),
            model_version=str(runtime.metadata.get("model_version", "unknown")),
            message="We could not confidently inspect this photograph. Take a close, well-lit picture of bare soil without plants or containers.",
        )

    model_pixels = image.pixels
    preprocessing = runtime.metadata.get("preprocessing", SOIL_PREPROCESSING)
    if preprocessing == "mobilenet_v2":
        model_pixels = (model_pixels / 127.5) - 1.0
    scores = np.asarray(runtime.model.predict(np.expand_dims(model_pixels, axis=0), verbose=0))
    if scores.ndim != 2 or scores.shape[0] != 1 or scores.shape[1] != len(runtime.labels):
        raise RuntimeError("Soil model returned invalid prediction scores.")
    probabilities = scores[0]
    if not np.all(np.isfinite(probabilities)):
        raise RuntimeError("Soil model returned invalid prediction scores.")
    if np.any(probabilities < 0) or not np.isclose(float(np.sum(probabilities)), 1.0, atol=0.05):
        raise RuntimeError("Soil model scores are not valid softmax probabilities.")

    ranked = np.argsort(probabilities)[::-1][:3]
    top_predictions = [
        {
            "soilCategory": runtime.labels[int(index)],
            "confidence": round(float(probabilities[index]), 6),
        }
        for index in ranked
    ]
    top_index = int(ranked[0])
    confidence = float(probabilities[top_index])
    margin = confidence - float(probabilities[int(ranked[1])])
    version = str(runtime.metadata.get("model_version", "unknown"))
    if confidence < CONFIDENCE_THRESHOLD or margin < MARGIN_THRESHOLD:
        return _result(
            soil_category=None,
            confidence=confidence,
            status="inconclusive",
            top_predictions=[
                {"soilCategory": runtime.labels[int(index)], "confidence": float(probabilities[index])}
                for index in range(len(runtime.labels))
            ],
            model_name=str(runtime.metadata.get("model_name", "MobileNetV2")),
            model_version=version,
            message="The model could not confidently distinguish one of its generic training classes. This result is not a soil-type or fertility measurement.",
        )

    return _result(
        soil_category=runtime.labels[top_index],
        confidence=confidence,
        status="possible_detection",
        top_predictions=[
            {"soilCategory": runtime.labels[int(index)], "confidence": float(probabilities[index])}
            for index in range(len(runtime.labels))
        ],
        model_name=str(runtime.metadata.get("model_name", "MobileNetV2")),
        model_version=version,
        message="Possible visual match to a generic SoilClass dataset label. This label does not identify a scientific soil category or predict crop suitability.",
        visual_characteristics=["Only a visual dataset-class match is available; no measured soil properties are inferred."],
    )
