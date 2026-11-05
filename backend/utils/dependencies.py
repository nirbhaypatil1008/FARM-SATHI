"""
FastAPI Dependencies for Database Sessions and JWT Authentication.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database.session import get_db
from models.farmer import Farmer
from utils.security import decode_access_token

# OAuth2 password bearer scheme pointing to the login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_farmer(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Farmer:
    """
    Validates JWT token and retrieves the authenticated Farmer entity.
    Raises 401 Unauthorized if missing, expired, or invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    farmer_id: Optional[int] = payload.get("sub")
    if farmer_id is None:
        raise credentials_exception

    farmer = db.query(Farmer).filter(Farmer.id == int(farmer_id)).first()
    if farmer is None:
        raise credentials_exception

    return farmer


def get_optional_farmer(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[Farmer]:
    """
    Retrieves the Farmer entity if a valid token is provided; returns None otherwise.
    Useful for open endpoints that can offer personalized context.
    """
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    farmer_id = payload.get("sub")
    if not farmer_id:
        return None
    return db.query(Farmer).filter(Farmer.id == int(farmer_id)).first()
