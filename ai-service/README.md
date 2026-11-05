# Local Crop Doctor inference service

This FastAPI service runs the exported MobileNetV2 classifier locally. It is not a public API, has no external inference key, and must remain on a trusted local/internal network. It does not fabricate a prediction when model files are missing.

## Prerequisites

Install a Python version/platform supported by the TensorFlow release in `requirements.txt`; Python 3.14 is outside its supported range. Linux/WSL is recommended when TensorFlow wheels are unavailable for native Windows. Follow the [TensorFlow installation guide](https://www.tensorflow.org/install/pip).

Train/export the model with the root [Colab notebook](../MODEL_TRAINING.ipynb), then extract the model, class labels, and metadata into this service's `models/` folder. See [MODEL_TRAINING.md](../MODEL_TRAINING.md). The checked-in metadata is only a placeholder; no trained weights or real evaluation metrics are included.

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

Direct calls to this service are not authenticated; keep it bound to loopback or a trusted private network and do not expose it publicly. The Express API enforces user authentication, upload limits, rate limits, and private diagnosis history.

The predictor consumes RGB pixels in the range 0–255 because the exported Keras model applies MobileNetV2 preprocessing internally. It rejects invalid model output shapes/scores and uses configurable confidence and top-class margin thresholds from `.env`. These thresholds reduce unsupported guesses; they do not calibrate confidence.

## Configuration and tests

`MAX_IMAGE_BYTES` defaults to 5 MiB. `PREDICTION_CONFIDENCE_THRESHOLD` and `PREDICTION_MARGIN_THRESHOLD` must each be between 0 and 1. Restart after changing settings.

Run unit tests from this directory:

```powershell
python -m unittest discover -s tests
```

Tests use stub model outputs for decision logic only; they do not test model accuracy or substitute for actual trained weights.
