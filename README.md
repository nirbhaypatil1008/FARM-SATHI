# FARM SAATHI

A mobile-friendly farming companion MVP built with React, Vite, React Router, and an Express API.

## Run locally

Use Node.js 20.19+ or 22.12+ and npm. From the project root:

```sh
npm install
npm install --prefix server
npm run dev
```

`npm run dev` starts both the Express API and web app so account registration, sign-in, chat, and private Crop Doctor history can connect. Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Copy `server/.env.example` to the ignored `server/.env`; add a secure `JWT_SECRET` and a Gemini key if you want farming chat. Accounts work without a Gemini key. Crop Doctor image analysis requires a separately trained PlantVillage model and the local FastAPI service; see [MODEL_TRAINING.md](./MODEL_TRAINING.md).

## Features

- Editable sample farmer dashboard, local profile, crops/stages/observations, crop planning, calendar, expenses and budget.
- Live seven-day weather from Open-Meteo (internet required, no key needed).
- Express API with SQLite accounts and conversation history, scrypt password hashes, JWT auth, request validation, rate limiting, and protected history.
- Gemini context-aware chat with guest access, server-sent event streaming, and in-page conversation state; signed-in users can save conversations.
- Crop Doctor with guest image previews and optional authenticated, private SQLite diagnosis history using the MobileNetV2 PlantVillage classifier through the local FastAPI service. Guest reports are not saved. The model weights must be trained in Colab and installed; no fake or Gemini-fallback predictions are returned.
- Soil Vision with guest image previews, an independent MobileNetV2 model contract, optional authenticated private analysis history, class-score visualization, and clear lab-test limitations. Guest reports are not saved. Install the supplied trained model in `ai-service/models/`; predictions stay disabled until it is present.
- Browser-native speech recognition and speech output with language selector, microphone permission/error messaging, pause/resume and stop. Actual language availability depends on the browser and installed voices.
- Official external portal links for schemes, crop insurance and mandi data; these features are not represented as connected feeds.

Farm profile and crop records stay in this browser. Chat, Crop Doctor, and Soil Vision account data/history are stored in the local backend SQLite file; private analysis images are saved under the ignored `server/data/` directory. Crop and soil images are forwarded to the local AI service, not to Gemini or another hosted inference provider. PlantVillage images are predominantly controlled-condition photos; soil image model scores are not calibrated field accuracy and the soil weights are not included. Do not store sensitive identity or financial-account details. This is a local development MVP, not a production deployment.

## Configuration, external APIs, and testing

See [API_SETUP.md](./API_SETUP.md) for API links, setup, endpoints, limitations, and deployment cautions. [MODEL_TRAINING.md](./MODEL_TRAINING.md) explains Crop Doctor setup; [SOIL_MODEL_SETUP.md](./SOIL_MODEL_SETUP.md) explains how to install the separate supplied soil model.

```sh
npm run build
npm run lint
npm --prefix server test
```

Never put private keys in browser code or `VITE_*` variables. Gemini secrets are read only by the backend from `server/.env`.
