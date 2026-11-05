"""
Pydantic Schemas for Mandi & Market Prices.
"""

from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


class MarketPriceResponse(BaseModel):
    id: int
    state: str
    district: str
    market_name: str
    commodity: str
    variety: str
    min_price: float
    max_price: float
    modal_price: float
    price_date: date
    data_source: str
    is_outdated: bool

    class Config:
        from_attributes = True


class MarketCompareRequest(BaseModel):
    commodity: str = Field(..., example="Onion")
    state: Optional[str] = Field(None, example="Maharashtra")
    district: Optional[str] = Field(None, example="Nashik")


class MarketCompareItem(BaseModel):
    market_name: str
    district: str
    state: str
    modal_price: float
    min_price: float
    max_price: float
    price_diff_from_average: float


class MarketCompareResponse(BaseModel):
    commodity: str
    average_modal_price: float
    markets: List[MarketCompareItem]
    best_market: Optional[MarketCompareItem] = None
    recommendation: str
