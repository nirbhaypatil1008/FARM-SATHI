"""
Smart Irrigation Recommendation Routes.
Executes FAO-56 Penman-Monteith water requirement calculations.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.session import get_db
from models.farm import Farm
from models.irrigation import IrrigationRecord
from schemas.irrigation import IrrigationRequest, IrrigationResponse
from services.irrigation_service import irrigation_service
from services.weather_service import weather_service
from utils.dependencies import get_optional_farmer
from models.farmer import Farmer

router = APIRouter(prefix="/irrigation", tags=["Smart Irrigation"])


@router.post("/recommend", response_model=IrrigationResponse)
async def get_irrigation_recommendation(
    payload: IrrigationRequest,
    current_farmer: Farmer = Depends(get_optional_farmer),
    db: Session = Depends(get_db)
):
    """
    Computes precise crop water requirements and pump runtime (minutes).
    Incorporates:
    - Crop Stage Coefficient (Kc)
    - Soil Available Water Holding Capacity
    - Recent rainfall and 24h meteorological forecast
    - Automatic rain pause protection
    """
    forecast_rain = 0.0
    et0 = 4.5
    soil_type = payload.soil_type
    land_acres = payload.land_size_acres

    # If farm_id is provided, pull real coordinates and weather
    if payload.farm_id:
        farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
        if farm:
            soil_type = farm.soil_type
            land_acres = farm.land_size_acres
            try:
                weather_info = await weather_service.get_farm_weather(farm.latitude, farm.longitude)
                current_w = weather_info.get("current", {})
                forecast_rain = current_w.get("expected_rainfall_24h_mm", 0.0)
                et0 = current_w.get("evapotranspiration_et0_mm", 4.5)
            except Exception:
                pass

    result = irrigation_service.calculate_recommendation(
        crop_name=payload.crop_name,
        growth_stage=payload.growth_stage,
        soil_type=soil_type,
        land_size_acres=land_acres,
        pump_hp=payload.pump_hp,
        recent_rain_mm=payload.recent_rain_mm or 0.0,
        forecast_rain_mm=forecast_rain,
        et0_reference_mm=et0
    )

    # Persist log if farm_id is linked
    if payload.farm_id:
        record = IrrigationRecord(
            farm_id=payload.farm_id,
            water_requirement_mm=result["water_needed_mm"],
            water_required_liters=result["water_needed_liters"],
            recommended_duration_minutes=result["recommended_duration_minutes"],
            soil_moisture_level=result["soil_moisture_status"],
            weather_context=f"Rain forecast: {forecast_rain}mm | ET0: {et0}mm",
            status="Recommended"
        )
        db.add(record)
        db.commit()

    return IrrigationResponse(**result)
