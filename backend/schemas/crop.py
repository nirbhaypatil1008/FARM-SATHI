"""
Pydantic Schemas for Crop Management.
"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class CropCreate(BaseModel):
    farm_id: int = Field(..., example=1)
    crop_name: str = Field(..., min_length=2, max_length=100, example="Wheat")
    variety: Optional[str] = Field(None, example="Sharbati")
    sowing_date: date = Field(default_factory=date.today)
    expected_harvest_date: Optional[date] = None
    growth_stage: str = Field(default="Vegetative", example="Vegetative")


class CropUpdate(BaseModel):
    variety: Optional[str] = None
    growth_stage: Optional[str] = None
    expected_harvest_date: Optional[date] = None
    status: Optional[str] = None


class CropResponse(BaseModel):
    id: int
    farm_id: int
    crop_name: str
    variety: Optional[str] = None
    sowing_date: date
    expected_harvest_date: Optional[date] = None
    growth_stage: str
    status: str

    class Config:
        from_attributes = True
