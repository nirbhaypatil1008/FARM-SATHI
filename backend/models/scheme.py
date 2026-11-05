"""
Government Welfare Scheme Database Model.
Stores verified state and central agricultural schemes with eligibility criteria.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from database.base import Base


class GovernmentScheme(Base):
    __tablename__ = "government_schemes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scheme_name = Column(String(150), nullable=False, unique=True)
    category = Column(String(50), nullable=False)   # Financial, Insurance, Irrigation, Solar, Credit
    description = Column(Text, nullable=False)
    eligibility_criteria = Column(Text, nullable=False)
    benefits = Column(Text, nullable=False)
    documents_required = Column(Text, nullable=True)
    portal_url = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=True)
    last_verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
