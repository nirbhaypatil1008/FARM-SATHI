"""Routes package initializer."""

from routes.auth import router as auth_router
from routes.farms import router as farms_router
from routes.ai import router as ai_router
from routes.crop import router as crop_router
from routes.weather import router as weather_router
from routes.irrigation import router as irrigation_router
from routes.market import router as market_router
from routes.schemes import router as schemes_router
from routes.tasks import router as tasks_router
from routes.calculator import router as calculator_router

__all__ = [
    "auth_router",
    "farms_router",
    "ai_router",
    "crop_router",
    "weather_router",
    "irrigation_router",
    "market_router",
    "schemes_router",
    "tasks_router",
    "calculator_router",
]
