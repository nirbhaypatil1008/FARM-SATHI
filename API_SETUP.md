# API and voice assistant setup

## What is integrated

| Integration | Purpose | Credential | Where configured |
|---|---|---|---|
| Google Gemini Developer API (`@google/genai`) | Authenticated, context-aware text chat; server-streamed replies | `GEMINI_API_KEY` from Google AI Studio | `server/.env` only |
| Open-Meteo Geocoding + Forecast APIs | Location lookup and current/seven-day weather | No API key for the current public endpoint | Browser requests via the app's Weather page and dashboard |
| Browser Web Speech API | Speech recognition where available | No app API key; browser permission/provider support required | Browser/device |
| Browser SpeechSynthesis API | Spoken AI replies with pause/resume/stop | No app API key; installed system voices required | Browser/device |
| SQLite (`better-sqlite3`) | Local accounts, conversation history and messages | No separate database credentials | `server/.env` `DATABASE_PATH` |

Maps, Agmarknet prices, OpenWeather, Gemini image diagnosis, cloud speech transcription, MySQL and a separate Python AI service are **not integrated**. No keys or configuration are needed for those unimplemented integrations. The app links to official mandi/scheme portals rather than claiming to show connected live data.

## Requirements and installation

Use Node.js 20.19+ or 22.12+ (required by the current Vite version) and npm. From the project root:

```sh
npm install
npm install --prefix server
```

`server/.env.example` documents backend settings. A local `server/.env` is included with an empty Gemini key and a placeholder JWT secret; it is ignored by Git. Replace the JWT secret with a random value of at least 32 characters and put your own Gemini key in this file. Never put private credentials in React/Vite `VITE_*` variables.

Example:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=<random-secret-at-least-32-characters>
JWT_EXPIRES_IN=7d
DATABASE_PATH=./data/farm-saathi.sqlite
GEMINI_API_KEY=<your-key>
GEMINI_MODEL=gemini-2.5-flash
```

Generate a JWT secret with PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Start the backend and web app together:

```sh
npm run dev:all
```

The web app is at `http://localhost:5173`; the API is at `http://localhost:5000`. Vite proxies `/api` requests to the backend. Alternatively, use two terminals with `npm run server:dev` and `npm run dev`. The backend creates its SQLite database at `server/data/farm-saathi.sqlite`.

The API starts without a Gemini key so health, registration, login and local history remain usable. `GET /api/health` reports whether Gemini is configured; chat returns HTTP 503 with instructions if it is not. In production, set a strong `JWT_SECRET`; the server refuses to start with a placeholder or missing secret.

## Gemini API

1. Read Google's current Gemini API documentation: <https://ai.google.dev/gemini-api/docs>.
2. Obtain/manage an API key in Google AI Studio: <https://aistudio.google.com/apikey>.
3. Configure `GEMINI_API_KEY` in `server/.env`, not in the web app.
4. Configure `GEMINI_MODEL` to a model available to your account. The default is `gemini-2.5-flash`.
5. Restart the backend. Check `GET http://localhost:5000/api/health`; `gemini.configured` should be `true`.
6. Create an account on the Assistant page, then ask a question.

Google model availability, pricing, quota and data handling depend on account, region, model and current Google terms. Review Google's official pricing and rate-limit pages before use:

- <https://ai.google.dev/gemini-api/docs/pricing>
- <https://ai.google.dev/gemini-api/docs/rate-limits>
- <https://ai.google.dev/gemini-api/terms>

The backend sends a bounded context assembled from the logged-in farmer's browser records (profile, crops/stages, observations, tasks and expense categories). Context is user-provided and may be incomplete. Conversations are stored in the local SQLite database. Do not enter sensitive personal, financial-account or identity-document data.

## Weather API

The app calls Open-Meteo's public geocoding and forecast endpoints directly from the browser; it does not use or require an OpenWeather key.

- Geocoding: <https://geocoding-api.open-meteo.com/v1/search>
- Forecast: <https://api.open-meteo.com/v1/forecast>
- Documentation: <https://open-meteo.com/en/docs>
- Pricing / terms: <https://open-meteo.com/en/pricing>

The app needs internet access and displays a visible error if the request fails. Confirm the current service terms, attribution and usage limits before production or commercial use. Forecasts are not official emergency warnings.

## Authentication and chat API

The Express API validates input, rate-limits auth/chat routes, hashes account passwords with Node's scrypt, signs JWTs, and scopes conversation queries/deletions to the authenticated user.

- `POST /api/auth/register` — `{ "name", "email", "password" }`; password minimum 10 characters.
- `POST /api/auth/login` — `{ "email", "password" }`.
- `GET /api/auth/me` — current account (Bearer token).
- `POST /api/chat` — non-streaming Gemini reply (Bearer token).
- `POST /api/chat/stream` — server-sent event Gemini reply (Bearer token).
- `GET /api/chat/history` — conversations and their messages (Bearer token).
- `POST /api/chat/new` — create an empty conversation (Bearer token).
- `DELETE /api/chat/history/:id` — delete an owned conversation and messages (Bearer token).
- `GET /api/health` — service status and Gemini configuration (no secret is returned).

SQLite is used because this project did not include a database or server. It is local development persistence, not a production multi-instance database. Back up `server/data/farm-saathi.sqlite`; use a managed database and TLS for production.

## Voice

Voice is implemented using native browser speech APIs: `SpeechRecognition` / `webkitSpeechRecognition` for input and `SpeechSynthesis` for output. No audio is sent to this app's backend and no `/api/voice/transcribe` endpoint is needed. Browser/device vendors may provide speech services under their own privacy, availability and quota terms; support, Kannada/Indian language recognition, and voices vary by browser, operating system and region. Microphone permission and a secure context (HTTPS, or localhost) are required. If recognition is unavailable or permission is denied, the app provides a text entry fallback and explains the issue.

AI replies include Listen, Pause/Resume and Stop controls. Speech uses the selected language if an installed voice supports it; text remains available regardless.

## Tests and checks

From the project root:

```sh
npm run build
npm run lint
npm --prefix server test
```

The backend tests cover health/config reporting, account registration and login, authorization, SQLite history, conversation ownership, missing-key errors, and stream error handling. A real Gemini generation requires a valid key and available model; the test suite never fabricates a successful Gemini reply.

## Features without credentials

Profile/farm records, crop plans, crop stages/observations, expenses, calendar tasks, EMI calculation, local auth/chat history, official portal links, and browser speech (where supported) work without provider keys. Live weather works without a key but requires internet. Real Gemini answers require a valid server-side Gemini key. Maps, live mandi values, vision diagnosis and push notifications remain unavailable until their integrations are separately implemented.
