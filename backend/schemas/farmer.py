"""
Pydantic Schemas for Farmer Authentication and Profiles.
Includes strict validation for Indian 10-digit mobile numbers.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re


class FarmerRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Farmer's full name", example="Ramesh Kumar")
    phone_number: str = Field(..., description="10-digit Indian mobile number", example="9876543210")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)", example="Kisan@123")
    preferred_language: str = Field(default="hi", description="Preferred language code: hi, en, te, ta, mr, pa, bn", example="hi")
    state: Optional[str] = Field(None, example="Maharashtra")
    district: Optional[str] = Field(None, example="Nashik")
    pincode: Optional[str] = Field(None, example="422001")

    @field_validator("phone_number")
    @classmethod
    def validate_indian_mobile(cls, v: str) -> str:
        clean_num = re.sub(r"[\s\-\+\(\)]", "", v)
        if clean_num.startswith("91") and len(clean_num) == 12:
            clean_num = clean_num[2:]
        if not re.match(r"^[6-9]\d{9}$", clean_num):
            raise ValueError("Invalid phone number. Must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.")
        return clean_num


class FarmerLogin(BaseModel):
    phone_number: str = Field(..., example="9876543210")
    password: str = Field(..., example="Kisan@123")

    @field_validator("phone_number")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        clean_num = re.sub(r"[\s\-\+\(\)]", "", v)
        if clean_num.startswith("91") and len(clean_num) == 12:
            clean_num = clean_num[2:]
        return clean_num


class FarmerResponse(BaseModel):
    id: int
    name: str
    phone_number: str
    preferred_language: str
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FarmerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    preferred_language: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer: FarmerResponse
