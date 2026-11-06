# Production Deployment Guide: FARM-SATHI

This document provides the complete, production-tested architecture and deployment instructions for **FARM-SATHI** on **Vercel** paired with a dedicated Python AI Inference service.

---

## 1. Architecture Overview & Size Analysis

### The Lambda Size Exceeded Error Explained
When deploying Python serverless functions on Vercel (backed by AWS Lambda):
- **Serverless Uncompressed Limit**: 500 MB maximum function package size.
- **Initial Packaging Issue**: The local virtual environment `ai-service/.venv` (1,990 MB = 1.99 GB) and raw training image datasets `ai-service/data/soil_repo` (506 MB) were previously packaged into the deployment bundle because of missing ignore rules, producing:
  ```text
  Error: [LAMBDA_SIZE_EXCEEDED]
  Total bundle size (1998.80 MB) exceeds the maximum function size (500 MB).
  ```
- **TensorFlow Packaging Constraint**: Even when excluding `.venv` and raw datasets via `.vercelignore`, TensorFlow 2.18 (`tensorflow` or `tensorflow-cpu`), Keras, NumPy, and associated C++ runtime libraries compile to 800 MB – 1.3 GB uncompressed on Linux. Consequently, machine-learning vision workloads using full TensorFlow cannot fit into standard AWS Lambda / Vercel Serverless Functions.

### Production Solution: Decoupled AI Microservice
```
                           Incoming Web Traffic (https://your-domain.vercel.app)
                                              │
                      ┌───────────────────────┴────────────────────────┐
                      ▼                                                ▼
           Frontend Routes (/*)                                API Routes (/api/*)
                      │                                                │
       ┌──────────────────────────────┐                ┌──────────────────────────────┐
       │         Vercel: app          │                │        Vercel: server        │
       │    Framework: Vite React     │                │      Framework: Express      │
       │          Root: "."           │                │        Root: "server"        │
       └──────────────────────────────┘                └──────────────┬───────────────┘
                                                                      │
                                                Secure HTTPS / AI_SERVICE_URL
                                                                      │
                                                       ┌──────────────▼───────────────┐
                                                       │   Dedicated Python Host      │
                                                       │  (Render / Railway / Run)    │
                                                       │      Framework: FastAPI      │
                                                       │      Root: "ai-service"      │
                                                       │   Full TensorFlow 2.18 CPU   │
                                                       └──────────────────────────────┘
```

1. **Vercel (`app` & `server`)**:
   - `app` (Root `.`): Fast Vite production build (~460 kB gzipped, <800ms build time).
   - `server` (Root `server`): Express 5 API gateway handling authentication, database management (PostgreSQL with safe SQLite fallback), persistent object storage (`@vercel/blob`), Google Gemini AI chat with SSE streaming, and secure validation of crop/soil uploads.
2. **Dedicated Python AI Service (`ai-service`)**:
   - FastAPI microservice running MobileNetV2 plant leaf disease classification (`plant_disease_model.keras`, 10.2 MB) and visual soil categorization (`soil_visual_model.keras`, 9.7 MB).
   - Deployed on a container or native Python platform (e.g., Render, Railway, Google Cloud Run) where there is no 500 MB serverless ceiling.
   - Connected securely to Express via `AI_SERVICE_URL` and optional `AI_SERVICE_TOKEN`.

---

## 2. Vercel Configuration (`vercel.json`)

The root [`vercel.json`](file:///c:/Users/nirbhay%20patil/OneDrive/Desktop/FARM%20SATHI%20APP/vercel.json) configures Vite and Express for Vercel, routing `/api/*` to Express and all remaining requests to Vite:

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
      "framework": "express"
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

## 3. Deployment Exclusion Rules (`.vercelignore`)

The project contains root [`.vercelignore`](file:///c:/Users/nirbhay%20patil/OneDrive/Desktop/FARM%20SATHI%20APP/.vercelignore) and [`ai-service/.vercelignore`](file:///c:/Users/nirbhay%20patil/OneDrive/Desktop/FARM%20SATHI%20APP/ai-service/.vercelignore) files that strictly exclude:
- Local Python virtual environments (`.venv/`, `venv/`)
- Python bytecode and caches (`**/__pycache__/`, `*.pyc`)
- Raw image training datasets (`ai-service/data/`, `**/data/soil_repo/`)
- Training scripts and Colab notebooks (`ai-service/train_*.py`, `requirements-training.txt`)
- Local development SQLite database files (`*.sqlite`, `*.db`)
- Environment files (`.env`, `server/.env`, `ai-service/.env`)

These rules guarantee that the Vercel deployment bundle remains minimal, fast, and free of extraneous data.

---

## 4. Environment Variables Reference

### Vercel Project Environment Variables (Production & Preview)

| Variable Name | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | Yes | Node environment mode | `production` |
| `DATABASE_URL` | Recommended | Neon or Supabase PostgreSQL connection string | `postgres://user:pass@ep-host.region.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Yes | High-entropy secret for farmer JWT session tokens | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | No | Farmer token lifespan (default: `7d`) | `7d` |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for farming advisor | `AIzaSy...` |
| `GEMINI_MODEL` | No | Gemini model designation (default: `gemini-3.8-flash`) | `gemini-3.8-flash` |
| `BLOB_READ_WRITE_TOKEN` | Recommended | Vercel Blob token for permanent image storage | `vercel_blob_rw_...` |
| `AI_SERVICE_URL` | Yes | Public HTTPS URL of the deployed AI service | `https://farm-sathi-ai.onrender.com` |
| `AI_SERVICE_TOKEN` | Optional | Shared bearer secret for service-to-service auth | `openssl rand -hex 24` |

### Python AI Service Environment Variables (Render / Railway / Cloud Run)

| Variable Name | Required | Description | Example |
|---|---|---|---|
| `PORT` | Yes | Port to listen on (automatically set by Render/Railway) | `8000` |
| `PYTHON_VERSION` | Yes | Python runtime version | `3.11.9` |
| `TF_ENABLE_ONEDNN_OPTS` | No | Disable oneDNN optimization logs | `0` |
| `TF_CPP_MIN_LOG_LEVEL` | No | Suppress verbose TensorFlow startup logs | `2` |
| `AI_SERVICE_TOKEN` | Optional | Must match the `AI_SERVICE_TOKEN` on Vercel | `same-secret-as-on-vercel` |

---

## 5. Step-by-Step Deployment Instructions

### Step 5.1: Deploy the Python AI Service (Option A: Render)
1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Connect your repository: `https://github.com/nirbhaypatil1008/FARM-SATHI`.
3. Configure the service:
   - **Root Directory**: `ai-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**:
   - `PYTHON_VERSION`: `3.11.9`
   - `AI_SERVICE_TOKEN`: (generate a secure random string)
5. Click **Create Web Service**.
6. Note down your service URL, e.g., `https://farm-sathi-ai.onrender.com`.

*(Alternatively, use the included [`ai-service/Dockerfile`](file:///c:/Users/nirbhay%20patil/OneDrive/Desktop/FARM%20SATHI%20APP/ai-service/Dockerfile) for Railway, Fly.io, or Google Cloud Run).*

### Step 5.2: Configure Vercel Project
1. Push your updated code to GitHub:
   ```bash
   git add .
   git commit -m "feat: configure production deployment architecture and vercelignore"
   git push origin main
   ```
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and select your **FARM-SATHI** project.
3. Navigate to **Settings** -> **Environment Variables**.
4. Add the required variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: High-entropy random secret.
   - `GEMINI_API_KEY`: Your Gemini API key.
   - `BLOB_READ_WRITE_TOKEN`: Your Vercel Blob store token.
   - `AI_SERVICE_URL`: The URL from Step 5.1 (e.g., `https://farm-sathi-ai.onrender.com`).
   - `AI_SERVICE_TOKEN`: The same token configured in Step 5.1 (if enabled).
5. Trigger a deployment via git push or click **Redeploy** on the latest commit.

---

## 6. Verification and Health Testing

Once deployed, verify each component:

### 1. AI Service Health
```bash
curl -f https://<your-ai-service-url>/health
```
Expected output:
```json
{
  "status": "healthy",
  "service": "farm-saathi-ai",
  "model_ready": true,
  "modelLoaded": true,
  "models": {
    "disease": { "loaded": true, "version": "1.0.0" },
    "soil": { "loaded": true, "version": "1.0.0" }
  }
}
```

### 2. Express Backend Health via Vercel
```bash
curl -f https://<your-vercel-app>.vercel.app/api/health
```
Expected output:
```json
{
  "status": "healthy",
  "database": { "engine": "postgresql", "connected": true },
  "gemini": { "configured": true }
}
```

### 3. End-to-End Plant & Soil Analysis
Log in to the web app at `https://<your-vercel-app>.vercel.app`:
- **Crop Doctor**: Upload a leaf image (`JPG`/`PNG`/`WEBP`) -> returns real disease classification, confidence, symptoms, and actionable organic advice.
- **Soil Vision**: Upload a soil sample image -> returns real soil type probabilities, texture analysis, and crop recommendations.
- **AI Farming Assistant**: Chat with the grounded agronomy assistant with streaming responses.
