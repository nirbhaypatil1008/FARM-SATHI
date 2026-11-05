# FARM-SATHI Soil Analyzer Setup & Installation Guide

This guide covers setup, configuration, model installation, service startup, and troubleshooting for the **AI Soil Analyzer** in FARM-SATHI.

---

## 1. System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux (WSL2 supported)
- **Node.js**: Version 18.x, 20.x, or newer
- **Python**: Version 3.10 to 3.13 (recommended: Python 3.13 with 64-bit architecture)
- **Memory**: Minimum 4 GB RAM (8 GB recommended)
- **Storage**: ~500 MB free space for models and dependencies

---

## 2. Directory Structure

The Soil Analyzer integrates directly into the existing FARM-SATHI project:

```text
FARM SATHI APP/
├── ai-service/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── soil_model_loader.py     # Safe TensorFlow model loader
│   │   ├── soil_predictor.py        # Soil classification and scoring
│   │   ├── soil_schemas.py          # Pydantic request/response schemas
│   │   ├── soil_knowledge.py        # Agronomic characteristics and recommendations
│   │   └── image_validator.py       # Image validation & EXIF normalization
│   ├── models/
│   │   └── soil/
│   │       ├── soil_visual_model.keras  # Trained MobileNetV2 model
│   │       ├── soil_labels.json         # 7 soil category labels
│   │       ├── model_metadata.json      # Metadata & evaluated metrics
│   │       └── soil_model_metadata.json # Compatibility alias
│   ├── run.py                       # AI service runner
│   └── requirements.txt             # Dependencies
├── server/
│   ├── src/
│   │   ├── app.js                   # Express route registrations
│   │   ├── soilAnalysis.js          # Soil controller, Multer & DB persistence
│   │   └── db.js                    # SQLite database schema
│   └── test/
│       └── api.test.js              # Server unit and integration tests
├── src/
│   ├── AppMvp.jsx                   # React frontend with Soil Analyzer UI
│   └── AppMvp.css                   # Responsive styles and print stylesheet
├── soil_model_training.ipynb        # Colab training notebook
└── SOIL_MODEL_TRAINING.md           # Model training documentation
```

---

## 3. Step-by-Step Installation

### Step A: Python AI Service Setup

```powershell
# 1. Create and activate a Python virtual environment
py -3.13 -m venv ai-service\.venv
ai-service\.venv\Scripts\Activate.ps1

# 2. Install dependencies
python -m pip install -r ai-service\requirements.txt

# 3. Create or configure .env
Copy-Item ai-service\.env.example ai-service\.env
```

Ensure `ai-service/.env` contains:
```env
MODEL_DIR=./models
SOIL_MODEL_DIR=./models/soil
SOIL_PREPROCESSING=embedded_mobilenet_v2
HOST=127.0.0.1
PORT=8000
MAX_IMAGE_BYTES=5242880
SOIL_CONFIDENCE_THRESHOLD=0.45
SOIL_MARGIN_THRESHOLD=0.08
```

### Step B: Verify Soil Model Files

Check that the trained model files are installed:
```powershell
Get-ChildItem -Path "ai-service\models\soil"
```
You should see:
- `soil_visual_model.keras`
- `soil_labels.json`
- `model_metadata.json`

If files are missing, run:
```powershell
$env:PYTHONPATH="ai-service"
& "ai-service\.venv\Scripts\python.exe" "ai-service\train_soil_model.py" --epochs 6
```
or train via `soil_model_training.ipynb` in Google Colab and place the exported files in `ai-service/models/soil/`.

### Step C: Start the Python AI Service

```powershell
# From the repository root:
& "ai-service\.venv\Scripts\python.exe" ai-service\run.py
```
Check health:
```powershell
curl.exe http://127.0.0.1:8000/api/soil/status
```
Expected output:
```json
{
  "model_loaded": true,
  "model_name": "MobileNetV2 Soil Classifier",
  "model_version": "1.0.0",
  "class_count": 7,
  "preprocessing": "embedded_mobilenet_v2",
  "message": ""
}
```

### Step D: Start the Express Server and Frontend

In a separate terminal:
```powershell
# Install frontend and server dependencies if not already done:
npm install
npm --prefix server install

# Start both frontend and backend concurrently:
npm run dev
```

The Express API starts on `http://localhost:5000` and Vite starts on `http://localhost:5173`.

---

## 4. Testing the Soil Analyzer

1. Open your browser to `http://localhost:5173`.
2. Navigate to **Water & soil** from the top navigation bar.
3. Observe the readiness badge: **Ready · MobileNetV2 Soil Classifier (7 Classes)**.
4. Select or capture a soil photograph.
5. (Optional) Expand **Scientific Soil Test & Sensor Measurements** to record lab values (pH, N, P, K, etc.).
6. Click **Analyze Soil Sample**.
7. Review the complete report:
   - Soil Identification & confidence
   - Visual characteristics (texture, color, drainage)
   - Soil Health Assessment (strengths, limitations, concerns)
   - Improvement recommendations (compost, mulching, erosion control)
   - Crop suitability
   - Fertilizer principles
   - Print or save as PDF via the **Print / Save PDF** button.
8. If logged in, observe the entry saved under **Soil Analysis History**.

---

## 5. Troubleshooting Common Issues

### Issue: "Soil model file(s) not found: soil_visual_model.keras, soil_labels.json"
- **Cause**: Model files are not placed in `ai-service/models/soil/` or `SOIL_MODEL_DIR` points to an incorrect path.
- **Fix**: Run `python ai-service/train_soil_model.py` or download from Colab and place in `ai-service/models/soil/`.

### Issue: "Choose a JPG, PNG, or WEBP soil image"
- **Cause**: An unsupported file type was selected.
- **Fix**: Use genuine JPEG, PNG, or WEBP images. The backend validates magic byte signatures to prevent spoofing.

### Issue: "Choose an image smaller than 5 MB"
- **Cause**: Image exceeds the 5 MB upload limit.
- **Fix**: Compress the image or capture directly using the mobile camera input.

