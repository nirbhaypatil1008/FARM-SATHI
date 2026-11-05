from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

SERVICE_DIRECTORY = Path(__file__).resolve().parents[1]
load_dotenv(SERVICE_DIRECTORY / ".env")

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from .image_validator import ImageValidationError, MAX_IMAGE_BYTES, validate_and_preprocess_image
from .model_loader import runtime
from .predictor import predict, supported_crops
from .schemas import PredictionResponse


@asynccontextmanager
async def lifespan(_app: FastAPI):
    runtime.load()
    yield


app = FastAPI(
    title="Farm Saathi Plant Disease Model",
    version="1.0.0",
    description="Local MobileNetV2 PlantVillage inference service. Not a confirmed diagnosis.",
    lifespan=lifespan,
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "modelLoaded": runtime.ready,
        "modelVersion": runtime.metadata.get("model_version") if runtime.ready else None,
        "supportedCropCount": len(supported_crops(runtime.labels)),
        "message": "" if runtime.ready else runtime.error,
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
