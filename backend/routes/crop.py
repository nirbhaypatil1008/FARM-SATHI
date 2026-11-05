"""
Crop Disease Detection Routes.
Handles leaf image uploads, invokes vision pathology diagnostics,
and persists historical reports for authenticated farmers.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from database.session import get_db
from models.farmer import Farmer
from models.disease import CropDiseaseReport
from schemas.disease import DiseaseDetectionResponse
from services.disease_service import disease_service
from utils.dependencies import get_optional_farmer, get_current_farmer

router = APIRouter(prefix="/crop", tags=["Crop Disease Detection"])

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/detect", response_model=DiseaseDetectionResponse)
async def detect_crop_disease(
    file: UploadFile = File(..., description="Crop leaf photograph (JPEG/PNG, max 5MB)"),
    crop_name: Optional[str] = Form(None, description="Optional crop hint"),
    current_farmer: Optional[Farmer] = Depends(get_optional_farmer),
    db: Session = Depends(get_db)
):
    """
    Analyzes an uploaded leaf image for plant pathology.
    Returns:
    - Disease identification
    - Confidence score (0.0 to 1.0)
    - Visual symptoms
    - Organic and chemical recommendations
    - Safety advisory & expert verification flag (triggers if confidence < 75%)
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Please upload a valid image (JPEG, PNG, WEBP)."
        )

    # Read image contents safely
    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit. Please upload a smaller image."
        )

    # Run disease diagnosis service
    diagnosis = await disease_service.detect_disease(
        image_bytes=image_bytes,
        filename=file.filename or "leaf.jpg"
    )

    if crop_name and crop_name.strip():
        diagnosis["crop_name"] = crop_name.strip()

    # Save to history if farmer is logged in
    if current_farmer:
        report = CropDiseaseReport(
            farmer_id=current_farmer.id,
            crop_name=diagnosis["crop_name"],
            image_path=file.filename,
            detected_disease=diagnosis["detected_disease"],
            confidence_score=diagnosis["confidence_score"],
            symptoms=", ".join(diagnosis.get("symptoms", [])),
            recommended_actions=f"Organic: {diagnosis.get('organic_remedy')}\nChemical: {diagnosis.get('chemical_remedy')}",
            expert_verification_needed=diagnosis["expert_verification_needed"]
        )
        db.add(report)
        db.commit()

    return DiseaseDetectionResponse(**diagnosis)


@router.get("/history", response_model=List[DiseaseDetectionResponse])
def get_diagnosis_history(
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Retrieves previous crop disease diagnosis scans for the authenticated farmer."""
    reports = db.query(CropDiseaseReport).filter(
        CropDiseaseReport.farmer_id == current_farmer.id
    ).order_by(CropDiseaseReport.created_at.desc()).all()

    results = []
    for r in reports:
        actions = r.recommended_actions.split("\nChemical: ") if r.recommended_actions else ["", ""]
        organic = actions[0].replace("Organic: ", "") if len(actions) > 0 else ""
        chemical = actions[1] if len(actions) > 1 else ""

        results.append(
            DiseaseDetectionResponse(
                crop_name=r.crop_name,
                detected_disease=r.detected_disease,
                confidence_score=r.confidence_score,
                symptoms=[s.strip() for s in r.symptoms.split(",") if s.strip()] if r.symptoms else [],
                organic_remedy=organic,
                chemical_remedy=chemical,
                expert_verification_needed=r.expert_verification_needed,
                safety_advisory="Review previous advisory with local agricultural extension officer if needed.",
                image_url=r.image_path
            )
        )
    return results
