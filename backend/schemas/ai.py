"""
Pydantic Schemas for AI Farmer Assistant.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, example="गेहूं में पीला रतुआ (Yellow Rust) के लक्षण क्या हैं और इसका जैविक उपचार क्या है?")
    language: Optional[str] = Field("hi", example="hi")
    crop_context: Optional[str] = Field(None, example="Wheat")
    farm_id: Optional[int] = Field(None, example=1)


class ChatResponse(BaseModel):
    answer: str
    language: str
    source: str = "Gemini 1.5 Pro / Flash with Agriculture Guardrails"
    suggested_actions: List[str] = []
    disclaimer: str = "Always verify chemical recommendations and dosage with your local Krishi Vigyan Kendra (KVK) or Agriculture Officer before application."
