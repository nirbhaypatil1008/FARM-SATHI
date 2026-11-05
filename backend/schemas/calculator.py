"""
Pydantic Schemas for Profit and Crop Comparison Calculator.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ProfitCalculationRequest(BaseModel):
    crop_name: str = Field(..., example="Wheat")
    land_size_acres: float = Field(..., gt=0.0, example=2.0)
    expected_yield_quintals_per_acre: float = Field(..., gt=0.0, example=20.0)
    expected_market_price_per_quintal: float = Field(..., gt=0.0, example=2350.0)
    seed_cost: float = Field(default=3000.0, ge=0.0)
    fertilizer_cost: float = Field(default=5000.0, ge=0.0)
    irrigation_electricity_cost: float = Field(default=2500.0, ge=0.0)
    labor_machinery_cost: float = Field(default=8000.0, ge=0.0)
    other_expenses: float = Field(default=1500.0, ge=0.0)


class ProfitCalculationResponse(BaseModel):
    crop_name: str
    land_size_acres: float
    total_yield_quintals: float
    gross_revenue: float
    total_expenses: float
    net_profit: float
    profit_per_acre: float
    return_on_investment_percentage: float
    is_profitable: bool
    estimate_disclaimer: str = "This is a projected financial estimate based on provided user parameters and market benchmarks. Actual yields and prices may vary due to climatic and market fluctuations."
