"""Pydantic schemas package initializer."""

from schemas.farmer import FarmerRegister, FarmerLogin, FarmerResponse, FarmerUpdate, Token
from schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from schemas.crop import CropCreate, CropUpdate, CropResponse
from schemas.ai import ChatRequest, ChatResponse
from schemas.disease import DiseaseDetectionResponse
from schemas.irrigation import IrrigationRequest, IrrigationResponse
from schemas.market import MarketPriceResponse, MarketCompareRequest, MarketCompareResponse, MarketCompareItem
from schemas.scheme import SchemeResponse, SchemeFilterQuery
from schemas.task import TaskCreate, TaskUpdate, TaskResponse
from schemas.calculator import ProfitCalculationRequest, ProfitCalculationResponse

__all__ = [
    "FarmerRegister", "FarmerLogin", "FarmerResponse", "FarmerUpdate", "Token",
    "FarmCreate", "FarmUpdate", "FarmResponse",
    "CropCreate", "CropUpdate", "CropResponse",
    "ChatRequest", "ChatResponse",
    "DiseaseDetectionResponse",
    "IrrigationRequest", "IrrigationResponse",
    "MarketPriceResponse", "MarketCompareRequest", "MarketCompareResponse", "MarketCompareItem",
    "SchemeResponse", "SchemeFilterQuery",
    "TaskCreate", "TaskUpdate", "TaskResponse",
    "ProfitCalculationRequest", "ProfitCalculationResponse"
]
