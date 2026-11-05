# Local Crop Doctor and Soil Vision inference service

This FastAPI service runs separate MobileNetV2 classifiers for Crop Doctor and Soil Vision locally. It is not a public API, has no external inference key, and must remain on a trusted local/internal network. Each model reports its own readiness; missing model files never result in a fabricated prediction.

## Prerequisites

Install a Python version/platform supported by the TensorFlow release in `requirements.txt`; Python 3.14 is outside its supported range. Linux/WSL is recommended when TensorFlow wheels are unavailable for native Windows. Follow the [TensorFlow installation guide](https://www.tensorflow.org/install/pip).

For Crop Doctor, train/export using the root [Colab notebook](../MODEL_TRAINING.ipynb) and see [MODEL_TRAINING.md](../MODEL_TRAINING.md). For Soil Vision, place the separately supplied `soil_visual_model.keras` and `soil_labels.json` under `models/soil/`; see [SOIL_MODEL_SETUP.md](../SOIL_MODEL_SETUP.md). Soil model weights and labels are not included in this repository.

## Install and run

From the project root on Windows PowerShell:

```powershell
py -3.13 -m venv ai-service\.venv
ai-service\.venv\Scripts\Activate.ps1
python -m pip install -r ai-service\requirements.txt
Copy-Item ai-service\.env.example ai-service\.env
Set-Location ai-service
python run.py
```

Change the selected Python version to one supported by TensorFlow. Set `MODEL_DIR` in `.env` to the exported model directory if it is not `ai-service/models`. The `.env` file holds only local runtime settings; this service does not require API credentials.

## Endpoints

- `GET /health` — model readiness, version, supported crop count, and a useful loading error.
- `GET /api/disease/supported-crops` — available classes; remains useful before weights are installed.
- `POST /api/disease/predict` — multipart fields `file` and optional `crop_name`. This is called by the authenticated Express backend.
- `GET /api/soil/status` — soil model readiness, version, class count, and preprocessing mode.
- `POST /api/soil/predict` — multipart field `file`; returns actual per-class scores if the soil model is loaded.

Direct calls to this service are not authenticated; keep it bound to loopback or a trusted private network and do not expose it publicly. The Express API enforces user authentication, upload limits, rate limits, and private diagnosis history.

The predictor consumes RGB pixels in the range 0–255 because the exported Keras model applies MobileNetV2 preprocessing internally. It rejects invalid model output shapes/scores and uses configurable confidence and top-class margin thresholds from `.env`. These thresholds reduce unsupported guesses; they do not calibrate confidence.

Soil classification uses its own model and exact `soil_labels.json` order. Input is resized to 224 × 224 RGB. `SOIL_PREPROCESSING=embedded_mobilenet_v2` sends float RGB `[0, 255]` to a model with normalization embedded. Use `SOIL_PREPROCESSING=mobilenet_v2` only if training applied `tf.keras.applications.mobilenet_v2.preprocess_input` before calling the model. Confirm this from the actual training notebook/export; do not guess. Soil scores describe generic training classes only and cannot measure soil chemistry or determine crop suitability.

## Configuration and tests

`MAX_IMAGE_BYTES` defaults to 5 MiB. `PREDICTION_CONFIDENCE_THRESHOLD`, `PREDICTION_MARGIN_THRESHOLD`, `SOIL_CONFIDENCE_THRESHOLD`, and `SOIL_MARGIN_THRESHOLD` must each be between 0 and 1. Restart after changing settings.

Run unit tests from this directory:

```powershell
python -m unittest discover -s tests
```

Tests use stub model outputs for decision logic only; they do not test model accuracy or substitute for actual trained weights.
