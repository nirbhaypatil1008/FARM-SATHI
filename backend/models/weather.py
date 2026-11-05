"""
Weather Cache & History Database Model.
Stores meteorological snapshots fetched from Open-Meteo for farms.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.base import Base


class WeatherHistory(Base):
    __tablename__ = "weather_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    temperature = Column(Float, nullable=False)           # Celsius
    humidity = Column(Float, nullable=False)              # Percentage
    rainfall_probability = Column(Float, nullable=False)  # Percentage
    wind_speed = Column(Float, nullable=False)            # km/h
    forecast_summary = Column(String(255), nullable=True) # e.g. "Clear skies, suitable for pesticide spraying"
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    farm = relationship("Farm", back_populates="weather_history")
