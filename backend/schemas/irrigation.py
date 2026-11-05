"""
Pydantic Schemas for Smart Irrigation Recommendation.
"""

from typing import Optional
from pydantic import BaseModel, Field


class IrrigationRequest(BaseModel):
    farm_id: Optional[int] = Field(None, example=1)
    crop_name: str = Field(default="Wheat", example="Wheat")
    growth_stage: str = Field(default="Vegetative", example="Vegetative")  # Seedling, Vegetative, Flowering, Maturity
    soil_type: str = Field(default="Alluvial", example="Black")          # Alluvial, Black, Red, Clay, Sandy, Loamy
    land_size_acres: float = Field(default=2.0, gt=0.0, example=2.0)
    pump_hp: float = Field(default=5.0, gt=0.0, description="Pump Horsepower (HP)", example=5.0)
    pump_capacity_hp: Optional[float] = Field(None, description="Alias for pump_hp")
    recent_rain_mm: Optional[float] = Field(0.0, ge=0.0, description="Rainfall in last 24h", example=0.0)

    def model_post_init(self, __context):
        if self.pump_capacity_hp and self.pump_capacity_hp > 0:
            self.pump_hp = self.pump_capacity_hp


class IrrigationResponse(BaseModel):
    crop_name: str
    growth_stage: str
    water_needed_mm: float
    water_needed_liters: float
    recommended_duration_minutes: int
    soil_moisture_status: str
    rain_forecast_24h_mm: float
    can_skip_irrigation: bool
    advice: str
    calculation_basis: str
