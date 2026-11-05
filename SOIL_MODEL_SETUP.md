# Soil Vision model setup

Soil Vision uses its own TensorFlow/Keras model runtime and does not use or change the PlantVillage Crop Doctor model.

## Required files

Place the files supplied with the trained model here:

```text
ai-service/models/soil/soil_visual_model.keras
ai-service/models/soil/soil_labels.json
```

`soil_labels.json` must contain the class labels in the exact order used by the final Dense/softmax output, either as a JSON list or an integer-keyed JSON object. The loader checks that there are unique labels and that the model output count matches them. Optional `soil_model_metadata.json` can provide `input_size: [224, 224]`, `class_count`, `classes`, `model_name`, `model_version`, and `preprocessing`. Metadata values are checked when present. Do not copy disease-model labels or invent scientific names for generic labels.

**No soil model or soil label file is currently included in this repository.** The app therefore reports the soil model as unavailable and refuses predictions until the genuine trained files are installed. No dummy model or prediction is generated.

## Image preprocessing contract

Images are validated, EXIF-oriented, converted to RGB, resized to 224 × 224, and passed to the Keras model as `float32`.

Set `SOIL_PREPROCESSING` in `ai-service/.env` to match the saved model's actual training pipeline:

- `embedded_mobilenet_v2` (default): image pixels are passed as RGB float values in `[0, 255]`; the saved model must contain the MobileNetV2 normalization internally.
- `mobilenet_v2`: the service applies the standard MobileNetV2 `[-1, 1]` preprocessing before calling the model. Choose this only if training did not embed preprocessing inside the saved model.

Optional metadata `preprocessing` overrides the environment setting. If the training preprocessing cannot be established from the model/export, do not enable predictions until it is verified. The model's output must be a softmax probability vector whose length matches `soil_labels.json`.

## Start the services

Use Python and an operating system supported by the installed TensorFlow release. Current native Windows support for newer TensorFlow releases is limited; WSL2/Linux is recommended. From the repository root, an example WSL/Linux environment setup is:

```sh
python3 -m venv ai-service/.venv
source ai-service/.venv/bin/activate
python -m pip install -r ai-service/requirements.txt
cp ai-service/.env.example ai-service/.env
cd ai-service
python run.py
```

On Windows PowerShell, use a TensorFlow-compatible interpreter and activate its environment:

```powershell
py -3.13 -m venv ai-service\.venv
ai-service\.venv\Scripts\Activate.ps1
python -m pip install -r ai-service\requirements.txt
Copy-Item ai-service\.env.example ai-service\.env
Set-Location ai-service
python run.py
```

If TensorFlow cannot be installed in native Windows Python, use WSL2/Linux rather than mixing incompatible wheels. Then, in another terminal, start the Express API and frontend together:

```powershell
npm run dev
```

Check `http://127.0.0.1:8000/api/soil/status` for `model_loaded: true`, then open the Soil & Water page in FARM SAATHI. Express exposes authenticated endpoints:

- `POST /api/soil/analyze` — multipart `image`, optional `cropName`, optional `location`.
- `GET /api/soil/history` — the current farmer's saved results.
- `GET /api/soil/history/:id/image` — an owned image.
- `GET /api/soil/history/:id` — an owned saved result.
- `DELETE /api/soil/history/:id` — delete an owned result and image.

The Express API validates file signatures, enforces a 5 MiB limit and per-user/IP request limit, forwards only to the configured private `AI_SERVICE_URL`, and stores successful model responses plus private images in SQLite. An image category is only a visual dataset-class match. It does not measure pH, NPK, organic carbon, electrical conductivity, salinity, moisture, or establish crop suitability. Use a laboratory soil test and locally verified agricultural advice for those decisions.
