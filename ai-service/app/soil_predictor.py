import os

import numpy as np

from .image_validator import ValidatedImage
from .soil_knowledge import get_soil_report
from .soil_model_loader import SOIL_PREPROCESSING, SoilModelRuntime

CONFIDENCE_THRESHOLD = float(os.getenv("SOIL_CONFIDENCE_THRESHOLD", "0.45"))
MARGIN_THRESHOLD = float(os.getenv("SOIL_MARGIN_THRESHOLD", "0.08"))

if not 0 <= CONFIDENCE_THRESHOLD <= 1:
    raise ValueError("SOIL_CONFIDENCE_THRESHOLD must be between 0 and 1.")
if not 0 <= MARGIN_THRESHOLD <= 1:
    raise ValueError("SOIL_MARGIN_THRESHOLD must be between 0 and 1.")

SOIL_LIMITATIONS = [
    "This model classifies visual appearance into 7 broad soil categories; it is not a laboratory taxonomy.",
    "A photograph cannot measure pH, nutrients, salinity, organic carbon, electrical conductivity, or actual soil moisture.",
    "Lighting, moisture level, shadows, and surface crop residue affect visual classification.",
    "Exact fertilizer dosage and definitive crop selection require certified soil laboratory testing or Soil Health Card data.",
]

SCIENTIFIC_TESTING_NOTE = (
    "Photograph analysis provides visual soil identification only. Exact chemical and physical soil parameters "
    "(pH, Available Nitrogen, Phosphorus, Potassium, Electrical Conductivity, Organic Carbon, and micronutrients) "
    "require laboratory testing or dedicated on-field soil sensors."
)


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
    knowledge = get_soil_report(soil_category)

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
        "visual_characteristics": visual_characteristics or [
            f"Visual texture: {knowledge['characteristics']['texture']}",
            f"Observed color pattern: {knowledge['characteristics']['color']}",
            f"Visible surface indicators: {knowledge['characteristics']['visible_indicators']}",
            f"Drainage behavior: {knowledge['characteristics']['drainage']}",
        ],
        "soil_characteristics": knowledge["characteristics"],
        "soil_health": knowledge["health_assessment"],
        "recommendations": knowledge["recommendations"],
        "crop_suitability": knowledge["crop_suitability"],
        "fertilizer_guidance": knowledge["fertilizer_principles"],
        "scientific_testing_note": SCIENTIFIC_TESTING_NOTE,
    }


def predict_soil(image: ValidatedImage, runtime: SoilModelRuntime) -> dict:
    if not runtime.ready:
        raise RuntimeError(runtime.error)
    if image.is_unclear:
        return _result(
            soil_category=None,
            confidence=0.0,
            status="inconclusive",
            top_predictions=[],
            model_name=str(runtime.metadata.get("model_name", "MobileNetV2")),
            model_version=str(runtime.metadata.get("model_version", "unknown")),
            message="We could not confidently inspect this photograph. Take a close, well-lit picture of bare soil without plants, hands, or containers.",
            visual_characteristics=["Image quality or clarity is insufficient for reliable visual classification."],
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

    ranked = np.argsort(probabilities)[::-1]
    top_predictions = [
        {
            "soilCategory": runtime.labels[int(index)],
            "confidence": round(float(probabilities[index]), 6),
        }
        for index in ranked
    ]
    top_index = int(ranked[0])
    confidence = float(probabilities[top_index])
    second_confidence = float(probabilities[int(ranked[1])]) if len(ranked) > 1 else 0.0
    margin = confidence - second_confidence
    version = str(runtime.metadata.get("model_version", "unknown"))

    if confidence < CONFIDENCE_THRESHOLD or margin < MARGIN_THRESHOLD:
        return _result(
            soil_category=None,
            confidence=confidence,
            status="inconclusive",
            top_predictions=top_predictions,
            model_name=str(runtime.metadata.get("model_name", "MobileNetV2")),
            model_version=version,
            message="The model could not distinguish one specific soil class with sufficient confidence. Provide a clearer, closer photograph in even daylight.",
            visual_characteristics=["Ambiguous visual characteristics between top classes; laboratory testing recommended."],
        )

    top_class = runtime.labels[top_index]
    knowledge = get_soil_report(top_class)

    return _result(
        soil_category=top_class,
        confidence=confidence,
        status="possible_detection",
        top_predictions=top_predictions,
        model_name=str(runtime.metadata.get("model_name", "MobileNetV2")),
        model_version=version,
        message=f"Visual pattern matches {top_class} with {(confidence * 100):.1f}% model confidence. Note: a photo indicates visual characteristics only, not lab fertility.",
        visual_characteristics=[
            f"Texture: {knowledge['characteristics']['texture']}",
            f"Color tone: {knowledge['characteristics']['color']}",
            f"Surface features: {knowledge['characteristics']['visible_indicators']}",
            f"Drainage: {knowledge['characteristics']['drainage']}",
        ],
    )
