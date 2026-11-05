# API and model setup

## What is integrated

| Integration | Use | Credential and configuration |
|---|---|---|
| Google Gemini Developer API | Farming chat and streamed replies only | `GEMINI_API_KEY` in `server/.env` |
| TensorFlow/Keras MobileNetV2 | PlantVillage crop/disease image classification through the local FastAPI service | No API key; trained model files in `ai-service/models/` |
| Open-Meteo Geocoding and Forecast APIs | Location search and current/seven-day weather | No key configured; browser requests |
| Browser Web Speech APIs | Voice input and spoken chat replies where supported | No app key; browser/device permission and installed voices |
| SQLite | Local account, chat, and private diagnosis history | `DATABASE_PATH` in `server/.env` |

Maps, Agmarknet prices, OpenWeather, cloud speech transcription, MySQL, and a hosted AI inference API are not integrated. Gemini is not used to classify Crop Doctor images. No prediction is fabricated when the trained model or service is unavailable.

## Requirements and local setup

Use Node.js 20.19+ or 22.12+ and npm. The Python AI service requires a Python version and operating system supported by the selected TensorFlow release; see [TensorFlow's install guide](https://www.tensorflow.org/install/pip). Python 3.14 is not supported by the current TensorFlow dependency range. Linux/WSL is recommended if native Windows TensorFlow wheels are unavailable.

From the project root, install the web and API dependencies:

```powershell
npm install
npm install --prefix server
Copy-Item server\.env.example server\.env
```

Edit `server/.env`; set a random `JWT_SECRET` of at least 32 characters and, if you want chat, your own `GEMINI_API_KEY`. The local `.env` is ignored by Git. Never put secrets in React code or `VITE_*` variables.

Train and install the image classifier as described in [MODEL_TRAINING.md](./MODEL_TRAINING.md). Then in a separate terminal, from the project root:

```powershell
py -3.13 -m venv ai-service\.venv
ai-service\.venv\Scripts\Activate.ps1
python -m pip install -r ai-service\requirements.txt
Copy-Item ai-service\.env.example ai-service\.env
Set-Location ai-service
python run.py
```

Use a TensorFlow-compatible Python version in place of `-3.13` if necessary. Keep `MODEL_DIR` relative to the AI service's working directory, or set it to the model export directory. In another terminal, run:

```powershell
npm run dev:all
```

The web app is at `http://localhost:5173`, the Express API at `http://localhost:5000`, and the AI service at `http://127.0.0.1:8000`. Vite proxies `/api` requests to Express. The backend defaults `AI_SERVICE_URL` to `http://127.0.0.1:8000`; change it in `server/.env` only when the AI service is at another trusted internal address. Do not expose the model service directly to the public internet.

Without model weights, Crop Doctor stays disabled and explains that the model must be trained/installed. Without a Gemini key, authentication, local history, and Crop Doctor still work; chat reports a useful missing-key error. The Node backend refuses a missing or placeholder JWT secret in production.

## Gemini API — farming chat only

1. Read the official [Gemini API documentation](https://ai.google.dev/gemini-api/docs).
2. Obtain/manage a key at [Google AI Studio](https://aistudio.google.com/apikey).
3. Configure `GEMINI_API_KEY` in `server/.env`. Configure `GEMINI_MODEL` to a model available to your account.
4. Restart the backend. `GET http://localhost:5000/api/health` reports whether Gemini is configured without returning the key.
5. Sign in, open the Assistant, and submit a farming question. A real model response requires an available model, a valid key, internet access, and available quota.

Pricing, quotas, model availability, and data handling vary by account, region, model, and current Google terms. Check the official [pricing](https://ai.google.dev/gemini-api/docs/pricing), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), and [terms](https://ai.google.dev/gemini-api/terms) before deployment. Chat sends bounded user-provided farm context to Google and stores conversations locally.

## Crop Doctor — PlantVillage MobileNetV2

The frontend uploads images to authenticated Express routes. Express validates the file, applies a six-analysis-per-minute rate limit, and forwards it to the private FastAPI service. FastAPI validates and preprocesses JPG/JPEG, PNG, or WEBP images (5 MB maximum), then runs the exported MobileNetV2 classifier. Diagnoses and generated image filenames are stored in the existing SQLite `crop_diagnoses` table; files are stored outside the public web root in `server/data/crop-diagnoses/`. History, image access, and deletion are scoped to the signed-in farmer.

The model recognizes the 38 classes for 14 crops in the PlantVillage color dataset. An optional crop selection is checked against the prediction; a mismatch is marked inconclusive rather than accepted. Low-confidence, close-ranked, unsupported, or blurry images are reported as inconclusive. The model's score is not calibrated field accuracy. No disease-specific treatment guidance is displayed unless a future knowledge-base entry has a source and verification date; no pesticide dosage is generated. Private farmer notes are saved with the report but are not sent to or used by the classifier.

The training data is the [Hugging Face PlantVillage dataset](https://huggingface.co/datasets/mohanty/PlantVillage), which declares **CC-BY-SA-3.0**. Review attribution/share-alike requirements and obtain any rights needed for redistribution or commercial use. Dataset images were mostly collected under controlled conditions; held-out dataset metrics must not be presented as field performance. The training script uses ImageNet-pretrained MobileNetV2 weights from Keras; review the associated model and dataset terms before redistribution. See [MODEL_TRAINING.md](./MODEL_TRAINING.md) and the [Colab notebook](./MODEL_TRAINING.ipynb).

Check readiness:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/api/disease/supported-crops
```

`modelLoaded` must be `true` before predictions can run. Authenticated application routes:

- `GET /api/crop-doctor/supported-crops` — model status and available crop classes.
- `POST /api/crop-doctor/diagnose` — multipart `image`, optional `cropName`, and optional private `observations`.
- `GET /api/crop-doctor/history` — the farmer's latest 100 diagnoses.
- `GET /api/crop-doctor/history/:id/image` — an owned image.
- `DELETE /api/crop-doctor/history/:id` — delete an owned diagnosis and its image.

These are internal application routes, not external provider APIs. No model-serving API key is required. The model runs locally; image bytes are not sent to Gemini or a third-party inference API.

## Weather

Weather and geocoding use [Open-Meteo's public APIs](https://open-meteo.com/en/docs) directly from the browser and need internet access, not an OpenWeather key:

- Geocoding: <https://geocoding-api.open-meteo.com/v1/search>
- Forecast: <https://api.open-meteo.com/v1/forecast>
- Current pricing and terms: <https://open-meteo.com/en/pricing>

Check current attribution, usage, and pricing terms for your deployment. Forecasts are not official emergency warnings.

## Authentication, chat, and voice

The Express API validates requests, rate-limits auth/chat routes, hashes passwords with Node's scrypt, signs JWTs, and scopes conversation/diagnosis queries to the authenticated user.

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/chat`, `POST /api/chat/stream`
- `GET /api/chat/history`, `POST /api/chat/new`, `DELETE /api/chat/history/:id`
- `GET /api/health`

Voice input and output use browser `SpeechRecognition`/`webkitSpeechRecognition` and `SpeechSynthesis`. No audio is sent to this app's backend, so a separate transcription API key and `/api/voice/transcribe` endpoint are not needed. Microphone permission and a secure context (HTTPS or localhost) are required; Kannada, other Indian languages, and pause/resume behavior depend on browser/device support and installed voices. If recognition is unavailable or permission is denied, text chat remains available.

SQLite is local development persistence, not a production multi-instance database. Use TLS and a managed database for production.

## Tests

From the project root:

```powershell
npm run build
npm run lint
npm --prefix server test
Set-Location ai-service
python -m unittest discover -s tests
```

The backend tests use a stubbed model-service HTTP response for API contract/persistence checks; they do not represent a trained model prediction. Python tests use stub predictions for classifier decision logic. A live inference requires installing model weights produced by Colab. Check [MODEL_TRAINING.md](./MODEL_TRAINING.md) before claiming model metrics or a working diagnosis demonstration.
