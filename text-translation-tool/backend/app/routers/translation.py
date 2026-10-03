"""
Translation router — FR5 (Translate), FR2/FR3 (language), FR6 (output).
POST /translate
GET  /languages
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Translation
from app.schemas import TranslateRequest, TranslateResponse, LanguageItem
from app.config import settings
from app.services.translation_service import (
    translate_text,
    SUPPORTED_LANGUAGES,
)

router = APIRouter(prefix="/api", tags=["translation"])
logger = logging.getLogger(__name__)


@router.get("/languages", response_model=list[LanguageItem])
async def get_languages():
    """Return the list of supported languages (FR2, SRS Appendix C)."""
    return SUPPORTED_LANGUAGES


@router.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest, db: AsyncSession = Depends(get_db)):
    """
    Translate text and persist to history (FR5, FR7).
    Handles auto-detect (FR3), same-language guard (FR2.5), max-length (FR1.3).
    """
    # FR1.3 / FR1.6 — max length check
    if len(req.source_text) > settings.MAX_INPUT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Input text exceeds the maximum allowed length of {settings.MAX_INPUT_LENGTH} characters.",
        )

    # FR1.1 — empty input guard
    if not req.source_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Input text cannot be empty.",
        )

    try:
        translated_text, resolved_source = translate_text(
            req.source_text, req.source_language, req.target_language
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected translation error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )

    # FR7.1 — store each successful translation
    record = Translation(
        session_id=req.session_id,
        source_text=req.source_text,
        translated_text=translated_text,
        source_language=resolved_source,
        target_language=req.target_language,
        history_visible=True,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    detected = resolved_source if req.source_language == "auto" else None

    return TranslateResponse(
        translation_id=record.translation_id,
        source_text=record.source_text,
        translated_text=record.translated_text,
        source_language=record.source_language,
        target_language=record.target_language,
        detected_language=detected,
        created_at=record.created_at,
        is_favorite=False,
    )
