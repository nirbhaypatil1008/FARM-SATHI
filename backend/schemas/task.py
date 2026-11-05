"""
Pydantic Schemas for Farm Tasks and Reminders.
"""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, example="Apply Neem Oil Spray on Tomato")
    description: Optional[str] = Field(None, example="Spray 5ml/L concentration during early morning to control whitefly")
    farm_id: Optional[int] = Field(None, example=1)
    category: str = Field(default="Spraying", example="Spraying")  # Sowing, Irrigation, Fertilizer, Spraying, Harvesting
    due_date: date = Field(default_factory=date.today)
    priority: str = Field(default="Medium", example="High")        # Low, Medium, High


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None  # Pending, In Progress, Completed


class TaskResponse(BaseModel):
    id: int
    farmer_id: int
    farm_id: Optional[int]
    title: str
    description: Optional[str]
    category: str
    due_date: date
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
