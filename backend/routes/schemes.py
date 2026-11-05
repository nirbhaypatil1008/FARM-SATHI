"""
Government Welfare Schemes Routes.
Exposes verified central and state welfare initiatives.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database.session import get_db
from schemas.scheme import SchemeResponse
from services.scheme_service import scheme_service

router = APIRouter(prefix="/schemes", tags=["Government Schemes"])


@router.get("", response_model=List[SchemeResponse])
def list_government_schemes(
    category: Optional[str] = Query(None, description="Financial, Insurance, Credit, Irrigation, Soil", example="Financial"),
    search: Optional[str] = Query(None, description="Search keyword", example="Kisan"),
    db: Session = Depends(get_db)
):
    """
    Lists verified central and state government agricultural schemes.
    Includes eligibility rules, subsidy amounts, and official application links.
    """
    return scheme_service.get_schemes(db, category=category, search=search)


@router.get("/{scheme_id}", response_model=SchemeResponse)
def get_scheme_details(scheme_id: int, db: Session = Depends(get_db)):
    """Retrieves full details for a specific welfare scheme."""
    scheme = scheme_service.get_scheme_by_id(db, scheme_id=scheme_id)
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Government scheme not found."
        )
    return scheme
