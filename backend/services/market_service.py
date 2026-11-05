"""
Mandi Market Intelligence & Price Comparison Service.
Integrates Agmarknet / data.gov.in schema and provides inter-mandi price arbitrage analysis.
"""

from datetime import date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models.market import MarketPrice
from schemas.market import MarketCompareItem, MarketCompareResponse


class MarketService:
    def get_prices(
        self,
        db: Session,
        commodity: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None
    ) -> List[MarketPrice]:
        """Queries market price records with optional filtering."""
        query = db.query(MarketPrice)
        if commodity:
            query = query.filter(MarketPrice.commodity.ilike(f"%{commodity}%"))
        if state:
            query = query.filter(MarketPrice.state.ilike(f"%{state}%"))
        if district:
            query = query.filter(MarketPrice.district.ilike(f"%{district}%"))

        return query.order_by(MarketPrice.price_date.desc(), MarketPrice.modal_price.desc()).all()

    def compare_mandis(
        self,
        db: Session,
        commodity: str,
        state: Optional[str] = None,
        district: Optional[str] = None
    ) -> MarketCompareResponse:
        """
        Compares prices for a crop across different APMC mandis to identify
        the best market for maximum farmer realization.
        """
        prices = self.get_prices(db, commodity=commodity, state=state, district=district)

        if not prices:
            # Query without district/state filter to broaden results
            prices = self.get_prices(db, commodity=commodity)

        if not prices:
            return MarketCompareResponse(
                commodity=commodity,
                average_modal_price=0.0,
                markets=[],
                best_market=None,
                recommendation=f"No recent market transactions found for '{commodity}'. Check spelling or select another crop."
            )

        modal_prices = [p.modal_price for p in prices]
        avg_price = round(sum(modal_prices) / len(modal_prices), 2)

        items: List[MarketCompareItem] = []
        for p in prices:
            diff = round(p.modal_price - avg_price, 2)
            items.append(
                MarketCompareItem(
                    market_name=p.market_name,
                    district=p.district,
                    state=p.state,
                    modal_price=p.modal_price,
                    min_price=p.min_price,
                    max_price=p.max_price,
                    price_diff_from_average=diff
                )
            )

        # Sort by highest modal price
        items.sort(key=lambda x: x.modal_price, reverse=True)
        best = items[0]

        diff_from_lowest = round(best.modal_price - items[-1].modal_price, 2)
        recommendation = (
            f"Top price: ₹{best.modal_price:,.0f}/quintal at {best.market_name} ({best.district}), "
            f"which is ₹{diff_from_lowest:,.0f} higher than the lowest reporting mandi. "
            f"If transportation costs are under ₹{diff_from_lowest * 0.4:,.0f}/quintal, transporting to {best.market_name} is recommended."
        )

        return MarketCompareResponse(
            commodity=commodity,
            average_modal_price=avg_price,
            markets=items,
            best_market=best,
            recommendation=recommendation
        )


market_service = MarketService()
