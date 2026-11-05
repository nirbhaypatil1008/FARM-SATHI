"""
Mandi Market Prices and Comparison Routes.
Provides price discovery and inter-mandi arbitrage analysis.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.session import get_db
from schemas.market import MarketPriceResponse, MarketCompareRequest, MarketCompareResponse
from services.market_service import market_service

router = APIRouter(prefix="/market", tags=["Market & Mandi Prices"])


@router.get("/prices", response_model=List[MarketPriceResponse])
@router.get("/market-prices", response_model=List[MarketPriceResponse])
def get_market_prices(
    commodity: Optional[str] = Query(None, example="Wheat"),
    state: Optional[str] = Query(None, example="Punjab"),
    district: Optional[str] = Query(None, example="Ludhiana"),
    db: Session = Depends(get_db)
):
    """
    Retrieves current commodity prices across Indian APMC mandis.
    Displays min, max, and modal prices (₹/Quintal) and data source date.
    """
    return market_service.get_prices(db, commodity=commodity, state=state, district=district)


@router.post("/compare", response_model=MarketCompareResponse)
def compare_market_prices(
    payload: MarketCompareRequest,
    db: Session = Depends(get_db)
):
    """
    Compares prices for a crop across different mandis.
    Identifies the highest-paying market and provides a transportation cost recommendation.
    """
    return market_service.compare_mandis(
        db,
        commodity=payload.commodity,
        state=payload.state,
        district=payload.district
    )
