"""
Pydantic Schemas for Crop Disease Detection.
"""

from typing import List, Optional
from pydantic import BaseModel


class DiseaseDetectionResponse(BaseModel):
    crop_name: str
    detected_disease: str
    confidence_score: float
    symptoms: List[str]
    organic_remedy: str
    chemical_remedy: str
    expert_verification_needed: bool
    safety_advisory: str
    image_url: Optional[str] = None
