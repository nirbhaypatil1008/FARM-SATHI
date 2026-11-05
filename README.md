# FARM SAATHI

A mobile-friendly farming companion MVP built with React, Vite, React Router, and an Express API.

## Run locally

Use Node.js 20.19+ or 22.12+ and npm. From the project root:

```sh
npm install
npm install --prefix server
npm run dev:all
```

The web app is at `http://localhost:5173`; the API is at `http://localhost:5000`. Copy settings from `server/.env.example` into the ignored `server/.env`, add your Gemini API key, then restart the backend to enable real AI replies. Without a key, chat displays the backend setup error and does not provide fake answers.

## Features

- Editable sample farmer dashboard, local profile, crops/stages/observations, crop planning, calendar, expenses and budget.
- Live seven-day weather from Open-Meteo (internet required, no key needed).
- Express API with SQLite accounts and conversation history, scrypt password hashes, JWT auth, request validation, rate limiting, and protected history.
- Gemini context-aware chat with server-sent event streaming, saved conversations, new/delete, retry, and copy controls.
- Authenticated Crop Doctor with Gemini multimodal visual screening, private SQLite diagnosis history, validated image uploads, and ownership-checked image access. Results are provisional visual guidance, not confirmed diagnoses.
- Browser-native speech recognition and speech output with language selector, microphone permission/error messaging, pause/resume and stop. Actual language availability depends on the browser and installed voices.
- Official external portal links for schemes, crop insurance and mandi data; these features are not represented as connected feeds.

Farm profile and crop records stay in this browser. Chat and Crop Doctor account data/history are stored in the local backend SQLite file; crop images are saved under the ignored `server/data/` directory. Crop images are sent to Google Gemini for visual assessment. Reports are not agronomist-confirmed and confidence is not calibrated. Do not store sensitive identity or financial-account details. This is a local development MVP, not a production deployment.

## Configuration, external APIs, and testing

See [API_SETUP.md](./API_SETUP.md) for official API links, key setup, endpoints, limitations, and deployment cautions.

```sh
npm run build
npm run lint
npm --prefix server test
```

Never put private keys in browser code or `VITE_*` variables. Gemini secrets are read only by the backend from `server/.env`.
