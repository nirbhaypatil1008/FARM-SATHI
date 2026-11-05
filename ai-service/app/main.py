from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

SERVICE_DIRECTORY = Path(__file__).resolve().parents[1]
load_dotenv(SERVICE_DIRECTORY / ".env")

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from .image_validator import ImageValidationError, MAX_IMAGE_BYTES, validate_and_preprocess_image
from .model_loader import LABELS_FILENAME, METADATA_FILENAME, MODEL_DIR, MODEL_FILENAME, runtime
from .predictor import predict, supported_crops
from .schemas import PredictionResponse
from .soil_model_loader import (
    SOIL_LABELS_FILENAME,
    SOIL_MODEL_DIR,
    SOIL_MODEL_FILENAME,
    SOIL_PREPROCESSING,
    soil_runtime,
)
from .soil_predictor import predict_soil
from .soil_schemas import SoilPredictionResponse


def _tensorflow_status() -> dict[str, str | bool | None]:
    try:
        import tensorflow as tf
    except Exception as error:
        return {
            "available": False,
            "version": None,
            "error": f"{type(error).__name__}: {error}",
        }
    return {"available": True, "version": tf.__version__, "error": None}


def _missing_model_files(directory: Path, filenames: tuple[str, ...]) -> list[str]:
    missing = []
    for filename in filenames:
        path = directory / filename
        if path.is_file():
            continue
        try:
            missing.append(path.resolve().relative_to(SERVICE_DIRECTORY.parent).as_posix())
        except ValueError:
            missing.append(f"configured model directory/{filename}")
    return missing


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.tensorflow = _tensorflow_status()
    runtime.load()
    soil_runtime.load()
    yield


app = FastAPI(
    title="Farm Saathi local AI service",
    version="1.0.0",
    description="Separate local MobileNetV2 services for plant-disease and generic soil-image classification.",
    lifespan=lifespan,
)


@app.get("/health")
def health(request: Request):
    tensorflow = getattr(request.app.state, "tensorflow", {
        "available": False,
        "version": None,
        "error": "TensorFlow availability has not been checked yet.",
    })
    disease_ready = runtime.ready
    soil_ready = soil_runtime.ready
    missing_disease_files = _missing_model_files(
        MODEL_DIR,
        (MODEL_FILENAME, LABELS_FILENAME, METADATA_FILENAME),
    )
    missing_soil_files = _missing_model_files(
        SOIL_MODEL_DIR,
        (SOIL_MODEL_FILENAME, SOIL_LABELS_FILENAME),
    )
    models_ready = disease_ready and soil_ready
    return {
        "status": "healthy" if tensorflow["available"] and models_ready else "degraded",
        "service": "farm-saathi-ai",
        "service_status": "running",
        "tensorflow": tensorflow,
        "model_ready": models_ready,
        "modelLoaded": disease_ready,
        "modelVersion": runtime.metadata.get("model_version") if runtime.ready else None,
        "supportedCropCount": len(supported_crops(runtime.labels)),
        "message": "" if runtime.ready else runtime.error,
        "models": {
            "disease": {
                "loaded": disease_ready,
                "version": runtime.metadata.get("model_version") if disease_ready else None,
                "message": "" if disease_ready else runtime.error,
                "missing_files": missing_disease_files,
            },
            "soil": {
                "loaded": soil_ready,
                "version": soil_runtime.metadata.get("model_version") if soil_ready else None,
                "supportedClassCount": len(soil_runtime.labels),
                "message": "" if soil_ready else soil_runtime.error,
                "missing_files": missing_soil_files,
            },
        },
    }


@app.get("/api/disease/supported-crops")
def get_supported_crops():
    if not runtime.labels:
        return JSONResponse(
            status_code=503,
            content={"error": runtime.error, "crops": []},
        )
    return {
        "modelLoaded": runtime.ready,
        "message": "" if runtime.ready else runtime.error,
        "crops": supported_crops(runtime.labels),
    }


@app.get("/api/soil/status")
def get_soil_status():
    return {
        "model_loaded": soil_runtime.ready,
        "model_name": str(soil_runtime.metadata.get("model_name", "MobileNetV2")),
        "model_version": soil_runtime.metadata.get("model_version") if soil_runtime.ready else None,
        "class_count": len(soil_runtime.labels),
        "preprocessing": soil_runtime.metadata.get("preprocessing", SOIL_PREPROCESSING),
        "message": "" if soil_runtime.ready else soil_runtime.error,
    }


@app.post("/api/disease/predict", response_model=PredictionResponse)
async def predict_disease(
    file: UploadFile = File(...),
    crop_name: str | None = Form(default=None, max_length=80),
):
    if not runtime.ready:
        raise HTTPException(
            status_code=503,
            detail=f"{runtime.error} Set MODEL_DIR to the exported model files and restart the AI service.",
        )
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Choose a JPG, PNG, or WEBP image.")
    raw_image = await file.read(MAX_IMAGE_BYTES + 1)
    if len(raw_image) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Choose an image smaller than 5 MB.")
    try:
        validated = validate_and_preprocess_image(raw_image)
    except ImageValidationError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    try:
        return predict(validated, crop_name, runtime)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/api/soil/predict", response_model=SoilPredictionResponse)
async def predict_soil_image(
    file: UploadFile = File(...),
):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Choose a JPG, PNG, or WEBP soil image.")
    raw_image = await file.read(MAX_IMAGE_BYTES + 1)
    if len(raw_image) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Choose an image smaller than 5 MB.")
    try:
        validated = validate_and_preprocess_image(raw_image)
    except ImageValidationError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    if not soil_runtime.ready:
        raise HTTPException(
            status_code=503,
            detail=f"{soil_runtime.error} Train and install the separate Soil Vision model.",
        )
    try:
        return predict_soil(validated, soil_runtime)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/api/soil/report/extract")
async def extract_soil_report(file: UploadFile = File(...)):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Choose a JPG, PNG, or WEBP soil-report image.")
    raw_image = await file.read(MAX_IMAGE_BYTES + 1)
    if len(raw_image) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Choose an image smaller than 5 MB.")
    try:
        validate_and_preprocess_image(raw_image)
    except ImageValidationError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    try:
        from .soil_report_ocr import extract_measurements
    except ModuleNotFoundError as error:
        if error.name != f"{__package__}.soil_report_ocr":
            raise
        raise HTTPException(
            status_code=503,
            detail="Soil laboratory report extraction is not configured in this AI service.",
        ) from error
    try:
        return extract_measurements(raw_image)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
