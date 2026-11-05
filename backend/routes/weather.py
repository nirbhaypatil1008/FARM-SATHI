"""
Weather and Agro-Advisory Routes.
Fetches hyperlocal meteorological forecasts from Open-Meteo for farms or coordinates.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database.session import get_db
from models.farm import Farm
from models.farmer import Farmer
from services.weather_service import weather_service
from utils.dependencies import get_current_farmer, get_optional_farmer

router = APIRouter(prefix="/weather", tags=["Weather & Agro-Advisories"])


@router.get("/{farm_id}", response_model=Dict[str, Any])
async def get_weather_for_farm(
    farm_id: int,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """
    Fetches real-time weather and 7-day agricultural forecasts for a registered farm.
    Includes customized spray, harvest, and temperature alerts.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == current_farmer.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm plot not found or unauthorized access."
        )

    weather_data = await weather_service.get_farm_weather(
        latitude=farm.latitude,
        longitude=farm.longitude
    )
    weather_data["farm_name"] = farm.farm_name
    return weather_data


@router.get("", response_model=Dict[str, Any])
async def get_weather_by_coordinates(
    latitude: float = Query(28.6139, ge=-90.0, le=90.0, description="Latitude", example=19.9975),
    longitude: float = Query(77.2090, ge=-180.0, le=180.0, description="Longitude", example=73.7898)
):
    """
    Directly fetches live weather and agro-advisories for any geographic coordinates.
    """
    return await weather_service.get_farm_weather(latitude=latitude, longitude=longitude)
