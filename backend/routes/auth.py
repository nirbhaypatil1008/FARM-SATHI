"""
Authentication Routes.
Handles Farmer registration, login (JWT generation), and profile retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.session import get_db
from models.farmer import Farmer
from schemas.farmer import FarmerRegister, FarmerLogin, FarmerResponse, FarmerUpdate, Token
from utils.security import hash_password, verify_password, create_access_token
from utils.dependencies import get_current_farmer

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_farmer(payload: FarmerRegister, db: Session = Depends(get_db)):
    """
    Registers a new farmer profile.
    Rejects duplicate mobile numbers and returns an authenticated JWT token.
    """
    # Check if phone number already registered
    existing_farmer = db.query(Farmer).filter(Farmer.phone_number == payload.phone_number).first()
    if existing_farmer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A farmer with this phone number is already registered. Please log in."
        )

    # Hash the password securely
    hashed_pwd = hash_password(payload.password)

    new_farmer = Farmer(
        name=payload.name,
        phone_number=payload.phone_number,
        hashed_password=hashed_pwd,
        preferred_language=payload.preferred_language,
        state=payload.state,
        district=payload.district,
        pincode=payload.pincode
    )
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)

    # Generate access token
    access_token = create_access_token(data={"sub": str(new_farmer.id), "phone": new_farmer.phone_number})

    return Token(
        access_token=access_token,
        token_type="bearer",
        farmer=FarmerResponse.model_validate(new_farmer)
    )


@router.post("/login", response_model=Token)
def login_farmer(payload: FarmerLogin, db: Session = Depends(get_db)):
    """
    Authenticates farmer credentials and issues a JWT Bearer token.
    """
    farmer = db.query(Farmer).filter(Farmer.phone_number == payload.phone_number).first()
    if not farmer or not verify_password(payload.password, farmer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password. Please try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(farmer.id), "phone": farmer.phone_number})

    return Token(
        access_token=access_token,
        token_type="bearer",
        farmer=FarmerResponse.model_validate(farmer)
    )


@router.get("/me", response_model=FarmerResponse)
def get_farmer_profile(current_farmer: Farmer = Depends(get_current_farmer)):
    """
    Returns the authenticated farmer's personal profile and preferences.
    """
    return current_farmer


@router.put("/me", response_model=FarmerResponse)
def update_farmer_profile(
    payload: FarmerUpdate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """
    Updates the authenticated farmer's profile information.
    """
    if payload.name:
        current_farmer.name = payload.name
    if payload.preferred_language:
        current_farmer.preferred_language = payload.preferred_language
    if payload.state:
        current_farmer.state = payload.state
    if payload.district:
        current_farmer.district = payload.district
    if payload.pincode:
        current_farmer.pincode = payload.pincode

    db.commit()
    db.refresh(current_farmer)
    return current_farmer
