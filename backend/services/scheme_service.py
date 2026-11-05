"""
Government Schemes Discovery & Eligibility Verification Service.
Enables farmers to discover certified agricultural welfare programs.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from models.scheme import GovernmentScheme


class SchemeService:
    def get_schemes(
        self,
        db: Session,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[GovernmentScheme]:
        """Queries verified government welfare schemes."""
        query = db.query(GovernmentScheme).filter(GovernmentScheme.is_verified == True)
        if category:
            query = query.filter(GovernmentScheme.category.ilike(f"%{category}%"))
        if search:
            query = query.filter(
                (GovernmentScheme.scheme_name.ilike(f"%{search}%")) |
                (GovernmentScheme.description.ilike(f"%{search}%")) |
                (GovernmentScheme.benefits.ilike(f"%{search}%"))
            )
        return query.all()

    def get_scheme_by_id(self, db: Session, scheme_id: int) -> Optional[GovernmentScheme]:
        """Retrieves single scheme details."""
        return db.query(GovernmentScheme).filter(GovernmentScheme.id == scheme_id).first()


scheme_service = SchemeService()
