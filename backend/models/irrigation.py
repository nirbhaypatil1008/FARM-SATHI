"""
Smart Irrigation Record Database Model.
Stores water requirement calculations and pump advisories for farms.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database.base import Base


class IrrigationRecord(Base):
    __tablename__ = "irrigation_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    water_requirement_mm = Column(Float, nullable=False)
    water_required_liters = Column(Float, nullable=False)
    recommended_duration_minutes = Column(Integer, nullable=False)
    soil_moisture_level = Column(String(50), nullable=True)  # Low, Optimal, Saturated
    weather_context = Column(Text, nullable=True)            # e.g., "0mm rain expected, 34°C"
    status = Column(String(20), default="Recommended")       # Recommended, Completed, Skipped
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    farm = relationship("Farm", back_populates="irrigation_records")
