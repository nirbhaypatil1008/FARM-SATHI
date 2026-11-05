"""
Farm and Land Management Database Model.
Stores geospatial coordinates, soil properties, and acreage.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database.base import Base


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    farm_name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    land_size_acres = Column(Float, nullable=False)
    soil_type = Column(String(50), nullable=False, default="Alluvial")  # Alluvial, Black, Red, Clay, Sandy, Loamy
    irrigation_source = Column(String(50), default="Borewell")          # Drip, Canal, Borewell, Rainfed, Sprinkler
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    farmer = relationship("Farmer", back_populates="farms")
    crops = relationship("Crop", back_populates="farm", cascade="all, delete-orphan")
    irrigation_records = relationship("IrrigationRecord", back_populates="farm", cascade="all, delete-orphan")
    weather_history = relationship("WeatherHistory", back_populates="farm", cascade="all, delete-orphan")
