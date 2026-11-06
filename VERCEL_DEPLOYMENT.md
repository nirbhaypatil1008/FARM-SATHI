# Vercel Multi-Service Deployment Guide: FARM-SATHI

This document provides the complete, production-tested guide for deploying **FARM-SATHI** as a **Vercel Multi-Service** application.

---

## 1. Architecture Overview

FARM-SATHI is structured into three services configured in `vercel.json`:

```
                           Incoming Web Traffic (https://your-domain.vercel.app)
                                              │
                      ┌───────────────────────┴────────────────────────┐
                      ▼                                                ▼
           Frontend Routes (/*)                                API Routes (/api/*)
                      │                                                │
       ┌──────────────────────────────┐                ┌──────────────────────────────┐
       │         Service: app         │                │        Service: server       │
       │     Framework: Vite React    │                │      Framework: Express      │
       │          Root: "."           │                │        Root: "server"        │
       └──────────────────────────────┘                └──────────────┬───────────────┘
                                                                      │
                                                Private Service Binding (AI_SERVICE_URL)
                                                                      │
                                                       ┌──────────────▼───────────────┐
                                                       │     Service: ai-service      │
                                                       │      Framework: FastAPI      │
                                                       │      Root: "ai-service"      │
                                                       │     (Private / Internal)     │
                                                       └──────────────────────────────┘
```

1. **`app`** (`root: "."`, `framework: "vite"`):
   - Single-page React application built with Vite.
   - All browser API requests target relative `/api/*` endpoints.
2. **`server`** (`root: "server"`, `framework: "express"`):
   - Express 5 REST API gateway handling user authentication, farmer grounding context, farm calendar lifecycle, Gemini chat with SSE streaming, and image upload validation.
   - Entry point: `server/index.js` (exports the Express `app` instance).
3. **`ai-service`** (`root: "ai-service"`, `framework: "fastapi"`):
   - Private FastAPI microservice hosting MobileNetV2 vision models for plant leaf disease classification and soil categorization.
   - Entry points: `ai-service/app/main.py:app` and `ai-service/main.py:app`.
   - Hidden from the public internet; accessible only from `server` via the internal Vercel Service Binding `AI_SERVICE_URL`.

---

## 2. Root `vercel.json` Configuration

The root `vercel.json` configures all three services, service bindings, and public rewrites:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "app": {
      "root": ".",
      "framework": "vite"
    },
    "server": {
      "root": "server",
      "framework": "express",
      "bindings": [
        {
          "type": "service",
          "service": "ai-service",
          "format": "url",
          "env": "AI_SERVICE_URL"
        }
      ]
    },
    "ai-service": {
      "root": "ai-service",
      "framework": "fastapi"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": {
        "service": "server"
      }
    },
    {
      "source": "/api",
      "destination": {
        "service": "server"
      }
    },
    {
      "source": "/(.*)",
      "destination": {
        "service": "app"
      }
    }
  ]
}
```

---

## 3. Environment Variables Reference

Configure these environment variables in your Vercel Project Settings (**Settings > Environment Variables**):

### Server Service (`server/`)

| Variable | Required? | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `POSTGRES_URL` or `DATABASE_URL` | **Yes (in prod)** | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` | Persistent PostgreSQL database connection string (Neon, Supabase, or Vercel Postgres). |
| `JWT_SECRET` | **Yes (in prod)** | Min. 32-character random string | Session signing key for JWT tokens. (Server terminates on start if < 32 characters in production). |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token lifetime (e.g. `24h`, `7d`). |
| `CLIENT_URL` | Optional | `http://localhost:5173` | Allowed CORS origins (comma-separated for multiple domains or custom domains). |
| `GEMINI_API_KEY` | **Recommended** | `AIzaSy...` | Google Gemini API key for farmer assistant chat and agronomic grounding. |
| `GEMINI_MODEL` | Optional | `gemini-3.8-flash` | Gemini model identifier. |
| `BLOB_READ_WRITE_TOKEN` | **Recommended** | `vercel_blob_rw_...` | Vercel Blob store token for persistent crop and soil image storage. Auto-configured if attached via Vercel Dashboard. |
| `AI_SERVICE_URL` | Handled by Vercel | Injected automatically | Private internal URL pointing to the `ai-service`. |
| `NODE_ENV` | Optional | `production` | Node execution mode. |

### AI Service (`ai-service/`)

| Variable | Required? | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `MODEL_DIR` | Optional | `models` | Directory holding `plant_disease_model.keras`, `class_labels.json`, and `model_metadata.json`. |
| `SOIL_MODEL_DIR` | Optional | `models/soil` | Directory holding `soil_visual_model.keras`, `soil_labels.json`, and `soil_model_metadata.json`. |
| `PREDICTION_CONFIDENCE_THRESHOLD` | Optional | `0.65` | Minimum softmax confidence required for plant disease classification. |
| `PREDICTION_MARGIN_THRESHOLD` | Optional | `0.12` | Margin required between top-1 and top-2 plant disease scores to prevent ambiguities. |
| `SOIL_CONFIDENCE_THRESHOLD` | Optional | `0.45` | Minimum softmax confidence required for visual soil identification. |
| `SOIL_MARGIN_THRESHOLD` | Optional | `0.08` | Margin required between top-1 and top-2 soil categories. |

---

## 4. Database Persistence & Safe Migration

### Why SQLite Cannot Persist on Vercel
On serverless runtimes like Vercel Functions:
1. The filesystem is read-only except `/tmp`.
2. `/tmp` storage is ephemeral, wiped across cold starts, and isolated per container instance.
3. Multiple concurrent serverless invocations cannot share a local SQLite file, leading to immediate data loss and lock corruption.
4. Native C++ bindings (`better-sqlite3`) can encounter compilation and ABI mismatches in serverless environments.

### The Solution: Dual-Engine Architecture
`server/src/db.js` dynamically selects the storage engine:
- **Local Development & Tests**: If `POSTGRES_URL` / `DATABASE_URL` is omitted, it seamlessly runs SQLite (`server/data/farm-sathi.db`). All unit tests run offline with zero configuration.
- **Production Deployment**: If `POSTGRES_URL` or `DATABASE_URL` is provided, it automatically connects to PostgreSQL with connection pooling (`pg.Pool`), initializes the schema, and executes standard queries.

### Safe SQLite to PostgreSQL Migration
To migrate your existing SQLite database records into PostgreSQL:

1. Provision a PostgreSQL instance (e.g., [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or Vercel Postgres).
2. From the `server` directory, run:

```bash
# In PowerShell:
$env:POSTGRES_URL = "postgresql://user:password@host.pooler.neon.tech/neondb?sslmode=require"
npm run migrate:postgres

# In Bash / macOS / Linux:
POSTGRES_URL="postgresql://user:password@host.pooler.neon.tech/neondb?sslmode=require" npm run migrate:postgres
```

The script `server/scripts/migrate-to-postgres.js`:
- Connects in **read-only mode** to your SQLite file (`server/data/farm-sathi.db`).
- Initializes all tables, foreign keys, and indexes in PostgreSQL.
- Idempotently copies all rows (`users`, `conversations`, `messages`, `crop_diagnoses`, `soil_analyses`, `crop_cycles`, `calendar_tasks`, `task_history`, `weather_alerts`, `farm_expenses`, `crop_observations`) using `ON CONFLICT DO NOTHING`.
- **Preserves your SQLite database intact** — nothing is deleted or modified locally.

---

## 5. Persistent Object Storage (Vercel Blob)

### Why Local Storage Fails on Vercel
Local storage in `server/data/crop-diagnoses/` or `server/data/soil-analyses/` is destroyed when serverless instances spin down.

### The Solution: `server/src/storage.js`
- **When `BLOB_READ_WRITE_TOKEN` is present**:
  - Uploads images directly to **Vercel Blob** persistent object storage via `@vercel/blob`.
  - Stores the public CDN URL in the database.
  - Serves images with an HTTP `307 Temporary Redirect` straight to Vercel's global CDN, offloading image bandwidth from compute functions.
  - Securely deletes blobs from object storage on record deletion.
- **When `BLOB_READ_WRITE_TOKEN` is omitted (Local Dev / Tests)**:
  - Transparently falls back to local disk storage (`server/data/`), allowing all unit tests to pass offline.

### Setting up Vercel Blob:
1. In your Vercel Dashboard, go to **Storage > Create Database > Blob**.
2. Name the store (e.g. `farm-sathi-images`) and click **Create**.
3. Select your project and click **Connect**.
4. Vercel automatically injects `BLOB_READ_WRITE_TOKEN` into your project environment.

---

## 6. TensorFlow Compatibility & Model Deployment Limits

### Model Specifications
- `plant_disease_model.keras`: **~10.2 MB**
- `soil_visual_model.keras`: **~9.7 MB**
- Metadata and label JSONs: **< 100 KB total**

### Serverless Function Limits vs TensorFlow
> [!IMPORTANT]
> **Vercel Serverless Function Size Limitation:**
> Standard Vercel Python Serverless Functions enforce a **250 MB uncompressed limit**.
> Installing full `tensorflow` via `pip` exceeds **500 MB** of shared C++ and oneDNN libraries, which will trigger a build error on standard serverless tiers:
> `Error: The Serverless Function size is larger than the maximum allowed size of 250 MB.`

### Recommended AI Service Deployment Options
1. **Option 1 (External Container Microservice - Recommended for Production)**:
   - Deploy `ai-service` as a Docker container on [Google Cloud Run](https://cloud.google.com/run), [Railway](https://railway.app), or [Render](https://render.com).
   - In your Vercel Express settings, override `AI_SERVICE_URL` with the external container URL (e.g., `https://farm-sathi-ai.up.railway.app`).
   - The Express service proxies all frontend requests (`/api/crop-doctor/*` and `/api/soil/*`) transparently.
2. **Option 2 (Vercel MicroVM / Container Services)**:
   - If using Vercel's Container / MicroVM service tier, configure function memory to at least **1024 MB - 2048 MB** to allow TensorFlow to load the models.
3. **Option 3 (TFLite / ONNX Conversion)**:
   - Convert `.keras` models to TensorFlow Lite format (`tflite-runtime` is only ~5 MB), which easily fits inside standard Vercel serverless functions.

### Honest Statuses for Missing Model Files
Under no circumstances does FARM-SATHI return fake or random predictions:
- If `plant_disease_model.keras` is missing:
  - AI Service reports `status: degraded`, `model_ready: False`, and lists missing files.
  - `/api/disease/predict` returns `HTTP 503 Service Unavailable` with message:
    `"plant_disease_model.keras is not installed. Train in Colab and install the exported model."`
  - Express `/api/crop-doctor/diagnose` relays the 503 error directly to the frontend.
  - The UI displays an honest error banner and prevents false diagnosis reports.
- If `soil_visual_model.keras` is missing:
  - AI Service `/api/soil/status` returns `model_loaded: false`.
  - `/api/soil/predict` returns `HTTP 503 Service Unavailable`.
  - The UI disables the "Analyze Soil" submit button and notifies the user.

---

## 7. Step-by-Step Vercel Deployment

### Step 1: Deploy with Vercel CLI or Dashboard
```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Step 2: Configure Environment Variables
In the Vercel Dashboard, navigate to **Settings > Environment Variables** and add:
- `POSTGRES_URL` (from Neon / Supabase / Vercel Postgres)
- `JWT_SECRET` (generate with `openssl rand -hex 32`)
- `GEMINI_API_KEY` (from Google AI Studio)
- `CLIENT_URL` (your production URL, e.g., `https://farm-sathi.vercel.app`)

### Step 3: Run Database Migration
Once `POSTGRES_URL` is set:
```bash
cd server
npm run migrate:postgres
```

---

## 8. Verification & Smoke Testing Checklist

After deployment, test each core subsystem against your live Vercel URL (`https://your-domain.vercel.app`):

| Test | Endpoint / Action | Expected Result |
| :--- | :--- | :--- |
| **Health Check** | `GET /api/health` | Returns `200 OK` with `{ status: "ok", database: "postgresql", gemini: { configured: true } }`. |
| **Registration** | `POST /api/auth/register` | Returns `201 Created` with JWT token and user profile object. |
| **Login** | `POST /api/auth/login` | Returns `200 OK` with valid JWT token. |
| **AI Assistant Chat** | `POST /api/chat` | Returns `200 OK` with structured agronomic response and suggestions. |
| **SSE Streaming** | `POST /api/chat/stream` | Streams Server-Sent Events (`event: delta`) with low latency. |
| **Crop Doctor Readiness** | `GET /api/crop-doctor/supported-crops` | Returns `200 OK` with supported crops list and model readiness. |
| **Plant Diagnosis** | `POST /api/crop-doctor/preview` | Upload a leaf photo; returns `200 OK` with disease analysis, severity, and verified recommendations. |
| **Soil Vision Status** | `GET /api/soil/status` | Returns `200 OK` with model readiness and supported soil categories. |
| **Soil Analysis** | `POST /api/soil/preview` | Upload a soil photo; returns `200 OK` with visual classification and soil health guidelines. |
| **Farm Calendar Lifecycle** | `POST /api/farm-calendar/crop-cycles` | Generates 120-day crop lifecycle with automated irrigation and fertilizer schedule tasks. |
| **Today's Briefing** | `GET /api/farm-calendar/today` | Returns `200 OK` with pending activities and weather risk alerts. |

---

## 9. Current Blockers & Resolution Summary

1. **TensorFlow Bundle Size (250 MB limit on Vercel Serverless)**:
   - *Status*: Identified & Documented.
   - *Resolution*: Deploy `ai-service` on a container runtime (Google Cloud Run / Railway / Render) and connect via `AI_SERVICE_URL`, or use Vercel MicroVM Containers with >= 1024 MB RAM.
2. **PostgreSQL Persistence**:
   - *Status*: Resolved. `server/src/db.js` seamlessly supports PostgreSQL via `POSTGRES_URL` / `DATABASE_URL` with connection pooling, while maintaining SQLite for local development. `server/scripts/migrate-to-postgres.js` safely migrates data without altering SQLite.
3. **Image Storage Persistence**:
   - *Status*: Resolved. `server/src/storage.js` uses `@vercel/blob` for persistent storage and 307 CDN redirects in production, with fallback to local disk storage for local testing.
4. **Honest Model Unavailable Behavior**:
   - *Status*: Verified. Missing model files return HTTP 503 with specific diagnostics, completely preventing fake predictions.

