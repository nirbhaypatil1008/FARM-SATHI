"""
AI Farmer Assistant Routes.
Provides agricultural advisory powered by Google Gemini with strict guardrails.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.session import get_db
from schemas.ai import ChatRequest, ChatResponse
from services.gemini_service import gemini_service
from utils.dependencies import get_optional_farmer
from models.farmer import Farmer

router = APIRouter(prefix="/ai", tags=["AI Farmer Assistant"])


@router.post("/ask", response_model=ChatResponse)
async def ask_ai_assistant(
    payload: ChatRequest,
    current_farmer: Farmer = Depends(get_optional_farmer),
    db: Session = Depends(get_db)
):
    """
    Answers farmer queries regarding crops, soil, pest management, and schemes.
    Features:
    - Multilingual responses (Hindi, Marathi, Telugu, Punjabi, English, etc.)
    - Strict agricultural guardrails against pesticide hallucination
    - Prioritizes Organic & Integrated Pest Management (IPM)
    - Safe offline fallback when API key is unconfigured
    """
    # Use farmer's preferred language if available
    target_language = payload.language
    if current_farmer and current_farmer.preferred_language and not payload.language:
        target_language = current_farmer.preferred_language

    result = await gemini_service.ask_assistant(
        question=payload.question,
        language=target_language,
        crop_context=payload.crop_context
    )

    return ChatResponse(
        answer=result["answer"],
        language=result["language"],
        source=result["source"],
        suggested_actions=result.get("suggested_actions", [])
    )
