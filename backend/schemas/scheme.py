"""
Pydantic Schemas for Government Schemes.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SchemeResponse(BaseModel):
    id: int
    scheme_name: str
    category: str
    description: str
    eligibility_criteria: str
    benefits: str
    documents_required: Optional[str] = None
    portal_url: Optional[str] = None
    is_verified: bool
    last_verified_at: datetime

    class Config:
        from_attributes = True


class SchemeFilterQuery(BaseModel):
    category: Optional[str] = None
    search: Optional[str] = None
