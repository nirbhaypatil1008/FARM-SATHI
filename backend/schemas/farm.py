"""
Pydantic Schemas for Farm Management.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class FarmCreate(BaseModel):
    farm_name: str = Field(..., min_length=2, max_length=100, example="Shivaji Farm")
    latitude: float = Field(..., ge=-90.0, le=90.0, example=19.9975)
    longitude: float = Field(..., ge=-180.0, le=180.0, example=73.7898)
    land_size_acres: float = Field(..., gt=0.0, example=3.5)
    soil_type: str = Field(default="Alluvial", example="Black")
    irrigation_source: str = Field(default="Borewell", example="Drip")


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = None
    land_size_acres: Optional[float] = Field(None, gt=0.0)
    soil_type: Optional[str] = None
    irrigation_source: Optional[str] = None


class FarmResponse(BaseModel):
    id: int
    farmer_id: int
    farm_name: str
    latitude: float
    longitude: float
    land_size_acres: float
    soil_type: str
    irrigation_source: str
    created_at: datetime

    class Config:
        from_attributes = True
