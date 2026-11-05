"""
Crop and Growth Stage Database Model.
Tracks active and harvested crops tied to a specific farm.
"""

from datetime import date
from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database.base import Base


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False)   # e.g., Wheat, Rice, Cotton, Tomato
    variety = Column(String(100), nullable=True)     # e.g., Sharbati, Basmati, Bt Cotton
    sowing_date = Column(Date, nullable=False, default=date.today)
    expected_harvest_date = Column(Date, nullable=True)
    growth_stage = Column(String(50), default="Vegetative")  # Seedling, Vegetative, Flowering, Maturity, Harvested
    status = Column(String(20), default="Active")            # Active, Harvested, Failed

    # Relationships
    farm = relationship("Farm", back_populates="crops")
