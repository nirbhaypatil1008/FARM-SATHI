# 🌾 Krishi Saathi AI – Backend API (FastAPI)
**Digital Assistant for Farmers | National-Level Hackathon Project**

Welcome to the backend of **Krishi Saathi AI**! This is a production-quality, clean-architecture backend built using **Python, FastAPI, and SQLAlchemy**. It powers hyperlocal AI assistance, real-time weather analytics, leaf disease triage, smart irrigation calculations, and market price discovery for Indian farmers.

---

## 📋 Table of Contents
1. [Key Features](#-key-features)
2. [Project Structure & Beginner File Guide](#-project-structure--beginner-file-guide)
3. [Quick Start (Local Development)](#-quick-start-local-development)
4. [Environment Variables Setup](#-environment-variables-setup)
5. [Interactive API Documentation (Swagger UI)](#-interactive-api-documentation-swagger-ui)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Database Architecture & Supabase Setup](#-database-architecture--supabase-setup)
8. [Connecting Frontend (React + Vite) to Backend](#-connecting-frontend-react--vite-to-backend)
9. [Running Automated Tests](#-running-automated-tests)
10. [Deploying to Render (Free Cloud PaaS)](#-deploying-to-render-free-cloud-paas)

---

## ✨ Key Features
- **Farmer Authentication & Security**: Phone number registration, bcrypt password hashing, and JWT Bearer token authentication.
- **Multilingual AI Farmer Assistant**: Integrated with Google Gemini 1.5 Flash with strict agricultural safety guardrails preventing chemical dosage hallucination.
- **Hyperlocal Agro-Weather & Advisories**: Real-time hourly and 7-day weather from Open-Meteo with spray suitability indicators, harvesting windows, and frost/heat alerts.
- **Crop Disease Detection & Triage**: Leaf photo diagnostics with automatic safety flag (`expert_verification_needed: true`) whenever confidence is under 75%.
- **Smart Irrigation Engine**: Deterministic, rule-based FAO-56 Penman-Monteith water requirement calculations with automatic rain pauses.
- **Mandi Price Discovery & Inter-Mandi Arbitrage**: Commodity rates across APMCs with best-market profit recommendations.
- **Verified Government Schemes**: Verified repository (PM-KISAN, PMFBY, KCC, PMKSY, Soil Health Card) with eligibility criteria.
- **Farm Task Management & Crop Economics**: To-do tracking and crop cost-benefit profit projections.

---

## 🗂️ Project Structure & Beginner File Guide

Here is how the project files are organized and what each file does:

```text
backend/
│
├── main.py                     # Entry point. Sets up FastAPI app, CORS, middleware, and mounts routers.
├── requirements.txt            # List of required Python packages and libraries.
├── .env.example                # Template showing all required environment variables with dummy values.
├── .env                        # Local configuration file (contains active settings and secrets).
├── .gitignore                  # Prevents accidental commits of sensitive files (.env, *.db, uploads/).
├── Procfile                    # Tells cloud providers (like Render) how to launch the web server.
├── render.yaml                 # Infrastructure-as-code file for 1-click Render deployment.
├── README.md                   # Complete documentation and setup manual (this file).
│
├── database/                   # Database layer
│   ├── base.py                 # SQLAlchemy DeclarativeBase where all database models inherit.
│   ├── session.py              # Engine setup, sessionmaker, and dual DB support (Postgres / SQLite).
│   └── seed_data.py            # Automatically populates verified schemes and sample mandi prices on startup.
│
├── models/                     # SQLAlchemy ORM models (Database Tables)
│   ├── farmer.py               # 'farmers' table (name, phone, password hash, language, location).
│   ├── farm.py                 # 'farms' table (land size, coordinates, soil type, irrigation source).
│   ├── crop.py                 # 'crops' table (crop name, variety, sowing date, growth stage).
│   ├── disease.py              # 'crop_disease_reports' table (scan history, disease, confidence, remedy).
│   ├── irrigation.py           # 'irrigation_records' table (water requirement logs in liters).
│   ├── market.py               # 'market_prices' table (commodity, mandi name, min/max/modal prices).
│   ├── scheme.py               # 'government_schemes' table (PM-KISAN, PMFBY, eligibility, benefits).
│   ├── task.py                 # 'farm_tasks' table (sowing, spraying, irrigation to-do reminders).
│   └── weather.py              # 'weather_history' table (cached weather snapshots for farms).
│
├── schemas/                    # Pydantic schemas (Request and Response data validation)
│   ├── farmer.py               # Validation for registration, login, profile updates, and JWT tokens.
│   ├── farm.py                 # Validation for farm creation and coordinates.
│   ├── crop.py                 # Validation for crop registration.
│   ├── ai.py                   # Chat request and structured advisory response.
│   ├── disease.py              # Leaf diagnosis response schema.
│   ├── irrigation.py           # Irrigation request and calculated pump duration schema.
│   ├── market.py               # Mandi price listing and comparison schemas.
│   ├── scheme.py               # Scheme details and search query schema.
│   ├── task.py                 # Task creation and update schema.
│   └── calculator.py           # Profit estimation input and breakdown schema.
│
├── routes/                     # API Routers (Handles HTTP requests and URLs)
│   ├── auth.py                 # /api/v1/auth/register, /auth/login, /auth/me
│   ├── farms.py                # /api/v1/farms (CRUD for farms and crops)
│   ├── ai.py                   # /api/v1/ai/ask (Gemini assistant)
│   ├── crop.py                 # /api/v1/crop/detect (Leaf image upload)
│   ├── weather.py              # /api/v1/weather (Hyperlocal forecast & advisories)
│   ├── irrigation.py           # /api/v1/irrigation/recommend (Water requirement calculation)
│   ├── market.py               # /api/v1/market/prices, /market/compare
│   ├── schemes.py              # /api/v1/schemes (Government welfare search)
│   ├── tasks.py                # /api/v1/tasks (CRUD for farm activities)
│   └── calculator.py           # /api/v1/calculator/profit (Cost-benefit analysis)
│
├── services/                   # Business Logic & External API Clients
│   ├── gemini_service.py       # Google Gemini 1.5 Flash client with safe agricultural prompt guardrails.
│   ├── weather_service.py      # Open-Meteo REST client with agro-meteorological advisory rules.
│   ├── disease_service.py      # Vision pathology diagnostic service with safety triage.
│   ├── irrigation_service.py   # FAO-56 Penman-Monteith crop water calculation algorithms.
│   ├── market_service.py       # Mandi price fetcher and price difference analyzer.
│   ├── scheme_service.py       # Government scheme query and eligibility matcher.
│   └── bhashini_service.py     # Indian language translation adapter.
│
├── utils/                      # Utilities & Cross-Cutting Concerns
│   ├── config.py               # Loads settings from .env with type validation.
│   ├── security.py             # Bcrypt password hashing and JWT token generator.
│   ├── dependencies.py         # Injects database sessions and validates authenticated farmer tokens.
│   └── exceptions.py           # Standardizes JSON error messages across all endpoints.
│
└── tests/                      # Automated Test Suite
    ├── conftest.py             # Pytest setup and isolated test database fixture.
    └── test_api.py             # Unit and integration tests for every major feature.
```

---

## 🚀 Quick Start (Local Development)

### Step 1: Open Terminal in the `backend` Directory
```bash
cd backend
```

### Step 2: Create a Virtual Environment
A virtual environment isolates your Python packages so they don't interfere with other projects on your computer.

- **On Windows (PowerShell or CMD)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```
- **On macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

*(You will see `(venv)` appear at the beginning of your command prompt, indicating the virtual environment is active!)*

### Step 3: Install Required Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Verify Environment Configuration
A `.env` file is already included with safe default local settings.
It uses an automatic local SQLite database (`krishi_saathi.db`), meaning **you do not need any database or API credentials to start exploring right away!**

### Step 5: Start the Backend Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- `--reload`: Automatically restarts the server whenever you save changes to code files.
- You should see:
  ```text
  INFO:     Database tables verified and created successfully.
  INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
  ```

---

## ⚙️ Environment Variables Setup

Open the `.env` file in a text editor to customize:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Database Connection String | `sqlite:///./krishi_saathi.db` (or Supabase Postgres URL) |
| `SECRET_KEY` | Secret key for signing JWT tokens | 32+ character random string |
| `GEMINI_API_KEY` | Google Gemini API Key | Get free key from [Google AI Studio](https://aistudio.google.com/) |
| `DATA_GOV_IN_API_KEY`| API Key for data.gov.in / Agmarknet | Optional (curated benchmarks included) |
| `CORS_ORIGINS` | Allowed frontend domains | `http://localhost:5173,http://localhost:3000` |

> 💡 **Graceful Fallbacks**: If `GEMINI_API_KEY` is not provided, the server automatically activates the **Safe Rule-Based Offline Advisory Engine**.

---

## 📖 Interactive API Documentation (Swagger UI)

FastAPI automatically generates interactive visual documentation for all endpoints:

1. Open your web browser and navigate to:
   👉 **`http://localhost:8000/docs`**
2. You can click on any endpoint, press **"Try it out"**, fill in sample parameters, and click **"Execute"** to see live JSON responses!
3. Alternative documentation is available at:
   👉 **`http://localhost:8000/redoc`**

---

## 🔌 API Endpoints Reference

All API routes are prefixed with `/api/v1`.

### 1. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Register new farmer (name, 10-digit Indian mobile number, password, language, state, district).
- `POST /api/v1/auth/login`: Authenticate phone and password; returns JWT `access_token`.
- `GET /api/v1/auth/me`: Get profile of the currently logged-in farmer (`Authorization: Bearer <token>`).

### 2. Farms & Crops (`/api/v1/farms`)
- `POST /api/v1/farms`: Create a farm plot (acreage, coordinates, soil type, irrigation source).
- `GET /api/v1/farms`: List all farm plots belonging to the authenticated farmer.
- `GET /api/v1/farms/{farm_id}`: Retrieve farm plot details.
- `PUT /api/v1/farms/{farm_id}`: Update farm plot details.
- `DELETE /api/v1/farms/{farm_id}`: Delete farm plot and associated crops.
- `POST /api/v1/farms/{farm_id}/crops`: Add a crop (Wheat, Rice, Cotton, Tomato) with growth stage.
- `GET /api/v1/farms/{farm_id}/crops`: List crops grown on this farm.

### 3. AI Farmer Assistant (`/api/v1/ai`)
- `POST /api/v1/ai/ask`: Submit farming questions in Hindi, English, Punjabi, etc.
  ```json
  {
    "question": "गेहूं में पीला रतुआ (Yellow Rust) के लक्षण क्या हैं और जैविक उपाय क्या है?",
    "language": "hi",
    "crop_context": "Wheat"
  }
  ```

### 4. Crop Disease Detection (`/api/v1/crop`)
- `POST /api/v1/crop/detect`: Upload leaf photo (`multipart/form-data`). Returns disease name, confidence score, symptoms, organic/chemical remedy, and `expert_verification_needed` flag.
- `GET /api/v1/crop/history`: View past disease scan history for current farmer.

### 5. Weather & Agro-Advisories (`/api/v1/weather`)
- `GET /api/v1/weather/{farm_id}`: Hyperlocal current conditions and 7-day forecast for a specific farm.
- `GET /api/v1/weather?latitude=19.9975&longitude=73.7898`: Query weather for any coordinates directly.

### 6. Smart Irrigation (`/api/v1/irrigation`)
- `POST /api/v1/irrigation/recommend`: Calculates water requirement ($ET_c$) and pump runtime:
  ```json
  {
    "crop_name": "Wheat",
    "growth_stage": "Flowering",
    "soil_type": "Alluvial",
    "land_size_acres": 2.5,
    "pump_hp": 5.0,
    "recent_rain_mm": 0.0
  }
  ```

### 7. Mandi & Market Prices (`/api/v1/market`)
- `GET /api/v1/market/prices?commodity=Onion`: View current prices in APMCs.
- `POST /api/v1/market/compare`: Compare mandi prices across districts to identify highest net realization:
  ```json
  {
    "commodity": "Onion",
    "state": "Maharashtra"
  }
  ```

### 8. Government Welfare Schemes (`/api/v1/schemes`)
- `GET /api/v1/schemes`: List verified welfare programs (PM-KISAN, PMFBY, KCC, PMKSY).
- `GET /api/v1/schemes?category=Financial`: Filter schemes by category.
- `GET /api/v1/schemes/{scheme_id}`: Full scheme details, eligibility criteria, and portal links.

### 9. Farm Tasks & Reminders (`/api/v1/tasks`)
- `GET /api/v1/tasks`: List farmer's pending or completed tasks.
- `POST /api/v1/tasks`: Add new farming reminder (e.g. "Spray Neem oil on Tomato").
- `PUT /api/v1/tasks/{task_id}`: Update task status (`Completed`, `In Progress`).
- `DELETE /api/v1/tasks/{task_id}`: Remove task.

### 10. Profit & Crop Calculator (`/api/v1/calculator`)
- `POST /api/v1/calculator/profit`: Calculate projected yield, gross revenue, cultivation costs, net profit, and ROI percentage per acre.

---

## 🗄️ Database Architecture & Supabase Setup

The backend utilizes **SQLAlchemy 2.0 ORM** with multi-dialect support:

### Local Zero-Setup Mode (Default)
In `.env`:
```ini
DATABASE_URL=sqlite:///./krishi_saathi.db
```
The database file `krishi_saathi.db` is automatically created on server startup with all tables and seed data.

### Supabase / PostgreSQL Production Mode
1. Create a free PostgreSQL project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** -> **Database** -> **Connection string** (URI).
3. Copy the URI and update `.env`:
   ```ini
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
4. Restart the backend: `init_db()` automatically migrates and verifies all tables!

---

## 🌐 Connecting Frontend (React + Vite) to Backend

In your frontend project (`my-hackathon`):

1. Create or edit `.env` in `my-hackathon/`:
   ```ini
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```
2. When calling endpoints from React:
   ```javascript
   // Example Axios request to ask AI assistant
   const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/ai/ask`, {
     question: "गेहूं की पहली सिंचाई कब करनी चाहिए?",
     language: "hi"
   });
   console.log(response.data.answer);
   ```
3. To attach authentication token for protected routes:
   ```javascript
   const token = localStorage.getItem("farmer_token");
   const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/farms`, {
     headers: { Authorization: `Bearer ${token}` }
   });
   ```

---

## 🧪 Running Automated Tests

Run the test suite using `pytest`:
```bash
pytest -v
```
All tests run against an isolated test database (`test_krishi.db`) and automatically verify:
- Authentication & JWT issuance
- Duplicate mobile validation
- Weather and agro-advisories
- Smart irrigation calculation & rain pause
- Mandi price comparison
- Verified government schemes
- Crop disease image upload
- Profit & ROI calculation

---

## ☁️ Deploying to Render (Free Cloud PaaS)

1. Push your repository to **GitHub**.
2. Log in to [render.com](https://render.com) and click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. In **Environment Variables**, add:
   - `ENVIRONMENT`: `production`
   - `SECRET_KEY`: `(click 'Generate' on Render)`
   - `DATABASE_URL`: `(Your Supabase connection string)`
   - `GEMINI_API_KEY`: `(Your Google Gemini API key)`
6. Click **Deploy Web Service**! Your API will be live at `https://krishi-saathi-backend.onrender.com`.

---

## 👨‍🌾 Designed for Impact
Built for Indian agriculture, empowering smallholder and marginal farmers with data-driven precision farming.
