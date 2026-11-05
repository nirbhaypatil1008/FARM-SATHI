import json
import os
import re
from pathlib import Path
from typing import Any

import numpy as np

from .image_validator import ValidatedImage
from .model_loader import ModelRuntime


DEFAULT_KNOWLEDGE_PATH = Path(__file__).resolve().parents[1] / "knowledge_base.json"
CONFIDENCE_THRESHOLD = float(os.getenv("PREDICTION_CONFIDENCE_THRESHOLD", "0.65"))
MARGIN_THRESHOLD = float(os.getenv("PREDICTION_MARGIN_THRESHOLD", "0.12"))

if not 0 <= CONFIDENCE_THRESHOLD <= 1:
    raise ValueError("PREDICTION_CONFIDENCE_THRESHOLD must be between 0 and 1.")
if not 0 <= MARGIN_THRESHOLD <= 1:
    raise ValueError("PREDICTION_MARGIN_THRESHOLD must be between 0 and 1.")


def readable_label(class_name: str) -> tuple[str, str]:
    crop, _, disease = class_name.partition("___")
    crop = crop.replace("_", " ").replace(",", "").strip()
    disease = disease.replace("_", " ").strip()
    disease = re.sub(r"\s+", " ", disease)
    return crop, disease


def normalize_crop(crop_name: str) -> str:
    value = re.sub(r"[^a-z0-9]", "", crop_name.casefold())
    aliases = {
        "corn": "maize",
        "cornmaize": "maize",
        "bellpepper": "pepper",
        "pepperbell": "pepper",
        "sweetpepper": "pepper",
        "cherryincludingsour": "cherry",
    }
    return aliases.get(value, value)


def supported_crops(labels: list[str]) -> list[dict[str, Any]]:
    crops: dict[str, set[str]] = {}
    for label in labels:
        crop, disease = readable_label(label)
        crops.setdefault(crop, set()).add(disease)
    return [
        {"crop": crop, "diseases": sorted(diseases)}
        for crop, diseases in sorted(crops.items())
    ]


def _knowledge_entry(label: str, knowledge_path: Path) -> dict[str, Any]:
    try:
        document = json.loads(knowledge_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return _empty_knowledge()
    entry = document.get("entries", {}).get(label)
    if not isinstance(entry, dict):
        return _empty_knowledge()
    source = entry.get("source")
    verified_at = entry.get("verifiedAt")
    required = ("symptoms", "possibleCauses", "conduciveConditions", "prevention", "nextSteps")
    if not source or not verified_at or any(not isinstance(entry.get(key, []), list) for key in required):
        return _empty_knowledge()
    return {
        "available": True,
        **{key: entry.get(key, []) for key in required},
        "source": source,
        "verifiedAt": verified_at,
    }


def _empty_knowledge() -> dict[str, Any]:
    return {
        "available": False,
        "symptoms": [],
        "possibleCauses": [],
        "conduciveConditions": [],
        "prevention": [],
        "nextSteps": [],
        "source": None,
        "verifiedAt": None,
    }


def _result(
    *,
    crop: str | None,
    disease: str,
    confidence: float,
    status: str,
    top_predictions: list[dict[str, Any]],
    model_version: str,
    message: str,
    knowledge: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "success": True,
        "crop": crop,
        "predictedDisease": disease,
        "confidence": round(float(confidence), 6),
        "status": status,
        "topPredictions": top_predictions,
        "modelVersion": model_version,
        "message": message,
        "knowledge": knowledge or _empty_knowledge(),
    }


def predict(validated: ValidatedImage, crop_name: str | None, runtime: ModelRuntime, knowledge_path: Path = DEFAULT_KNOWLEDGE_PATH) -> dict[str, Any]:
    if not runtime.ready:
        raise RuntimeError(runtime.error)
    classes = supported_crops(runtime.labels)
    if crop_name:
        selected_crop = normalize_crop(crop_name)
        crop_match = next((item["crop"] for item in classes if normalize_crop(item["crop"]) == selected_crop), None)
        if crop_match is None:
            return _result(
                crop=crop_name.strip(),
                disease="Unsupported crop",
                confidence=0,
                status="unsupported_crop",
                top_predictions=[],
                model_version=runtime.metadata.get("model_version", "unknown"),
                message=f"This model does not support {crop_name.strip()}. See the supported-crops list before uploading.",
            )
    else:
        crop_match = None

    if validated.is_unclear:
        return _result(
            crop=crop_match,
            disease="Unable to assess this image",
            confidence=0,
            status="inconclusive",
            top_predictions=[],
            model_version=runtime.metadata.get("model_version", "unknown"),
            message="This photo appears too blurry or low-detail. Take a close, well-lit photo of an affected leaf and the whole plant.",
        )

    scores = np.asarray(runtime.model.predict(np.expand_dims(validated.pixels, axis=0), verbose=0))
    if scores.ndim != 2 or scores.shape[0] != 1 or scores.shape[1] != len(runtime.labels):
        raise RuntimeError("Model returned invalid prediction scores.")
    probabilities = scores[0]
    if not np.all(np.isfinite(probabilities)):
        raise RuntimeError("Model returned invalid prediction scores.")
    if np.any(probabilities < 0) or not np.isclose(float(np.sum(probabilities)), 1.0, atol=0.05):
        raise RuntimeError("Model scores are not valid softmax probabilities.")

    ranked = np.argsort(probabilities)[::-1][:3]
    top_predictions = []
    for index in ranked:
        crop, disease = readable_label(runtime.labels[int(index)])
        top_predictions.append({
            "crop": crop,
            "disease": disease,
            "confidence": round(float(probabilities[index]), 6),
        })
    top_index = int(ranked[0])
    detected_crop, detected_disease = readable_label(runtime.labels[top_index])
    confidence = float(probabilities[top_index])
    margin = confidence - float(probabilities[int(ranked[1])]) if len(ranked) > 1 else confidence
    model_version = str(runtime.metadata.get("model_version", "unknown"))

    if crop_match and normalize_crop(detected_crop) != normalize_crop(crop_match):
        return _result(
            crop=detected_crop,
            disease="Selected crop does not match the image prediction",
            confidence=confidence,
            status="crop_mismatch",
            top_predictions=top_predictions,
            model_version=model_version,
            message=f"You selected {crop_match}, but the model's highest class is {detected_crop}. Check the crop selection or upload a clearer image.",
        )
    if confidence < CONFIDENCE_THRESHOLD or margin < MARGIN_THRESHOLD:
        return _result(
            crop=detected_crop,
            disease="Unable to determine from this image",
            confidence=confidence,
            status="inconclusive",
            top_predictions=top_predictions,
            model_version=model_version,
            message="The model is not confident enough to suggest a disease. Upload a clearer close-up and a photo of the whole plant.",
        )

    is_healthy = normalize_crop(detected_disease) == "healthy"
    return _result(
        crop=detected_crop,
        disease="No disease pattern detected" if is_healthy else detected_disease,
        confidence=confidence,
        status="healthy" if is_healthy else "possible_detection",
        top_predictions=top_predictions,
        model_version=model_version,
        message=(
            "The model did not detect a PlantVillage disease pattern. This does not rule out field problems."
            if is_healthy
            else "Possible visual match from the PlantVillage-trained model; this is not a confirmed diagnosis."
        ),
        knowledge=None if is_healthy else _knowledge_entry(runtime.labels[top_index], knowledge_path),
    )
