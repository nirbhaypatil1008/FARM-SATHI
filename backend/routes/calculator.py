"""
Profit and Crop Comparison Calculator Routes.
Calculates projected revenues, expenses, and net profit margins per acre.
"""

from fastapi import APIRouter
from schemas.calculator import ProfitCalculationRequest, ProfitCalculationResponse

router = APIRouter(prefix="/calculator", tags=["Profit & Crop Calculator"])


@router.post("/profit", response_model=ProfitCalculationResponse)
def calculate_crop_profit(payload: ProfitCalculationRequest):
    """
    Calculates estimated gross revenue, total cultivation expenses, and net profit.
    Calculates Return on Investment (ROI) and per-acre economics.
    """
    total_yield = payload.land_size_acres * payload.expected_yield_quintals_per_acre
    gross_revenue = total_yield * payload.expected_market_price_per_quintal

    total_expenses = (
        payload.seed_cost +
        payload.fertilizer_cost +
        payload.irrigation_electricity_cost +
        payload.labor_machinery_cost +
        payload.other_expenses
    )

    net_profit = gross_revenue - total_expenses
    profit_per_acre = round(net_profit / payload.land_size_acres, 2)
    roi = round((net_profit / total_expenses * 100), 2) if total_expenses > 0 else 0.0

    return ProfitCalculationResponse(
        crop_name=payload.crop_name,
        land_size_acres=payload.land_size_acres,
        total_yield_quintals=round(total_yield, 2),
        gross_revenue=round(gross_revenue, 2),
        total_expenses=round(total_expenses, 2),
        net_profit=round(net_profit, 2),
        profit_per_acre=profit_per_acre,
        return_on_investment_percentage=roi,
        is_profitable=(net_profit > 0)
    )
