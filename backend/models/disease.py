"""
Crop Disease Report Database Model.
Stores diagnostic scans, confidence scores, remedies, and triage flags.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database.base import Base


class CropDiseaseReport(Base):
    __tablename__ = "crop_disease_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False)
    image_path = Column(String(255), nullable=True)
    detected_disease = Column(String(150), nullable=False)
    confidence_score = Column(Float, nullable=False)
    symptoms = Column(Text, nullable=True)
    recommended_actions = Column(Text, nullable=True)
    expert_verification_needed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    farmer = relationship("Farmer", back_populates="disease_reports")
