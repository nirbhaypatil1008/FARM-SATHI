"""
Market and Mandi Prices Database Model.
Stores commodity price data from Agmarknet / data.gov.in.
"""

from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean
from database.base import Base


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    state = Column(String(50), nullable=False, index=True)
    district = Column(String(50), nullable=False, index=True)
    market_name = Column(String(100), nullable=False, index=True)
    commodity = Column(String(100), nullable=False, index=True)
    variety = Column(String(100), default="Standard")
    min_price = Column(Float, nullable=False)   # INR per Quintal
    max_price = Column(Float, nullable=False)   # INR per Quintal
    modal_price = Column(Float, nullable=False) # INR per Quintal
    price_date = Column(Date, nullable=False, default=date.today)
    data_source = Column(String(100), default="Agmarknet")
    is_outdated = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
