"""
AI Farmer Assistant Routes.
Provides agricultural advisory powered by Google Gemini with strict guardrails.
"""

import asyncio
import json
import time
from fastapi import APIRouter, Depends, Request
from starlette.responses import StreamingResponse
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


@router.post("/stream")
@router.post("/chat/stream")
async def stream_ai_assistant(request: Request):
    """
    Server-Sent Events (SSE) streaming endpoint for the web assistant.
    Provides real-time token streaming for a conversational experience.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    prompt = body.get("message") or body.get("question") or "Hello"
    target_language = body.get("language") or "en"
    context = body.get("context") or {}
    crop_context = None
    if isinstance(context, dict):
        crops = context.get("crops")
        if isinstance(crops, list) and len(crops) > 0:
            crop_context = crops[0].get("name") if isinstance(crops[0], dict) else str(crops[0])

    result = await gemini_service.ask_assistant(
        question=prompt,
        language=target_language,
        crop_context=crop_context
    )

    full_text = result["answer"]
    actions = result.get("suggested_actions", [])
    if actions:
        full_text += "\n\n💡 **Recommended Next Steps:**\n" + "\n".join(f"• {a}" for a in actions)

    conv_id = body.get("conversationId") or f"conv-{int(time.time())}"

    async def event_generator():
        yield f"event: conversation\ndata: {json.dumps({'conversationId': conv_id})}\n\n"
        words = full_text.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3]) + (" " if i + 3 < len(words) else "")
            yield f"event: delta\ndata: {json.dumps({'text': chunk})}\n\n"
            await asyncio.sleep(0.03)
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

