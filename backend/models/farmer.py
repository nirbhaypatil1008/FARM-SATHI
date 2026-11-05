"""
Farmer (User) Database Model.
Stores core profile, credentials, and regional preferences.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from database.base import Base


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    phone_number = Column(String(15), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    preferred_language = Column(String(10), default="hi")  # hi, en, te, ta, mr, pa, bn
    state = Column(String(50), nullable=True)
    district = Column(String(50), nullable=True)
    pincode = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    farms = relationship("Farm", back_populates="farmer", cascade="all, delete-orphan")
    tasks = relationship("FarmTask", back_populates="farmer", cascade="all, delete-orphan")
    disease_reports = relationship("CropDiseaseReport", back_populates="farmer", cascade="all, delete-orphan")
