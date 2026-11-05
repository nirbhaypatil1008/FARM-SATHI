"""
================================================================================
KRISHI SAATHI AI - DIGITAL ASSISTANT FOR FARMERS
Main Backend Application Entry Point (FastAPI + Uvicorn)
================================================================================
National-Level Hackathon Edition
Clean Architecture | Vernacular Support | Agronomic AI Guardrails
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from utils.config import settings
from utils.exceptions import (
    KrishiSaathiException,
    krishi_exception_handler,
    validation_exception_handler,
    general_http_exception_handler
)
from database.session import init_db

# Import all API Routers
from routes import (
    auth_router,
    farms_router,
    ai_router,
    crop_router,
    weather_router,
    irrigation_router,
    market_router,
    schemes_router,
    tasks_router,
    calculator_router
)

# Configure structured logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("krishi_saathi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events: Runs automatic database migration and seed data
    injection upon application startup.
    """
    logger.info("Initializing Krishi Saathi AI database tables and verified seed knowledge...")
    try:
        init_db()
        logger.info("Database initialization completed successfully.")
    except Exception as e:
        logger.critical(f"Database initialization failed: {e}")
    yield
    logger.info("Shutting down Krishi Saathi AI Backend.")


# Initialize FastAPI Application
app = FastAPI(
    title="Krishi Saathi AI – Backend API",
    description=(
        "Production-grade backend for **Krishi Saathi AI (Digital Assistant for Farmers)**.\n\n"
        "### Key Capabilities:\n"
        "- **Farmer Authentication & Farm Management** (JWT, acreage, soil types)\n"
        "- **AI Farmer Assistant** (Gemini 1.5 with Indian language support & agricultural guardrails)\n"
        "- **Hyperlocal Agro-Weather** (Open-Meteo real-time spray/harvest advisories)\n"
        "- **Crop Disease Diagnosis** (Leaf vision pathology & expert triage)\n"
        "- **Smart Irrigation Calculator** (FAO-56 Penman-Monteith water requirement engine)\n"
        "- **Mandi Market Prices & Inter-Mandi Arbitrage** (Agmarknet / data.gov.in)\n"
        "- **Verified Government Welfare Schemes** (PM-KISAN, PMFBY, KCC, PMKSY)\n"
        "- **Farm Task Management & Crop Economics Planner**"
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# ----------------- CORS CONFIGURATION -----------------
# Enables seamless cross-origin requests from the React/Vite frontend and Dev Tunnels
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- EXCEPTION HANDLERS -----------------
app.add_exception_handler(KrishiSaathiException, krishi_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, general_http_exception_handler)

# ----------------- ROUTE MOUNTING -----------------
API_V1_PREFIX = "/api/v1"
API_PREFIX = "/api"
ALL_ROUTERS = [
    auth_router,
    farms_router,
    ai_router,
    crop_router,
    weather_router,
    irrigation_router,
    market_router,
    schemes_router,
    tasks_router,
    calculator_router
]

for r in ALL_ROUTERS:
    app.include_router(r, prefix=API_V1_PREFIX)
    app.include_router(r, prefix=API_PREFIX)
    app.include_router(r)


# ----------------- ROOT & HEALTH CHECK -----------------
@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root visitors directly to the interactive Swagger documentation."""
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["Health & Status"])
@app.get("/api/health", tags=["Health & Status"])
@app.get("/api/v1/health", tags=["Health & Status"])
def health_check():
    """Returns application health, version, and active environment status."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "PostgreSQL" if "postgres" in settings.DATABASE_URL else "SQLite (Local/Demo)",
        "gemini_ai_configured": bool(settings.GEMINI_API_KEY)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
