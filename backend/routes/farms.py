"""
Farm and Crop Management Routes.
Supports adding, viewing, updating farms and crops for authenticated farmers.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.session import get_db
from models.farmer import Farmer
from models.farm import Farm
from models.crop import Crop
from schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from schemas.crop import CropCreate, CropResponse
from utils.dependencies import get_current_farmer

router = APIRouter(prefix="/farms", tags=["Farms & Crops"])


@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
def create_farm(
    payload: FarmCreate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Adds a new farm plot linked to the authenticated farmer."""
    farm = Farm(
        farmer_id=current_farmer.id,
        farm_name=payload.farm_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        land_size_acres=payload.land_size_acres,
        soil_type=payload.soil_type,
        irrigation_source=payload.irrigation_source
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("", response_model=List[FarmResponse])
def list_farms(
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Lists all farm plots belonging to the authenticated farmer."""
    return db.query(Farm).filter(Farm.farmer_id == current_farmer.id).all()


@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: int,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Retrieves specific farm details with ownership check."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == current_farmer.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or unauthorized.")
    return farm


@router.put("/{farm_id}", response_model=FarmResponse)
def update_farm(
    farm_id: int,
    payload: FarmUpdate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Updates farm plot information."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == current_farmer.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or unauthorized.")

    if payload.farm_name is not None:
        farm.farm_name = payload.farm_name
    if payload.land_size_acres is not None:
        farm.land_size_acres = payload.land_size_acres
    if payload.soil_type is not None:
        farm.soil_type = payload.soil_type
    if payload.irrigation_source is not None:
        farm.irrigation_source = payload.irrigation_source

    db.commit()
    db.refresh(farm)
    return farm


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(
    farm_id: int,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Deletes a farm plot and associated crops/records."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == current_farmer.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or unauthorized.")
    db.delete(farm)
    db.commit()
    return None


# ---------------- CROP ENDPOINTS ----------------

@router.post("/{farm_id}/crops", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
def add_crop_to_farm(
    farm_id: int,
    payload: CropCreate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Registers a crop grown on a specific farm plot."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == current_farmer.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or unauthorized.")

    crop = Crop(
        farm_id=farm.id,
        crop_name=payload.crop_name,
        variety=payload.variety,
        sowing_date=payload.sowing_date,
        expected_harvest_date=payload.expected_harvest_date,
        growth_stage=payload.growth_stage,
        status="Active"
    )
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.get("/{farm_id}/crops", response_model=List[CropResponse])
def list_crops_for_farm(
    farm_id: int,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Lists all crops active or harvested for a specific farm plot."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == current_farmer.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or unauthorized.")
    return db.query(Crop).filter(Crop.farm_id == farm.id).all()
