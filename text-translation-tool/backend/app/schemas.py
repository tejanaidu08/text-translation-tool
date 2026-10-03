from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ── Translation ────────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    source_text: str = Field(..., min_length=1)
    source_language: str  # language code, e.g. "en" or "auto"
    target_language: str
    session_id: str


class TranslateResponse(BaseModel):
    translation_id: str
    source_text: str
    translated_text: str
    source_language: str          # resolved language (never "auto")
    target_language: str
    detected_language: Optional[str] = None   # set when auto-detect was used
    created_at: datetime
    is_favorite: bool = False


# ── History ────────────────────────────────────────────────────────────────────

class HistoryEntry(BaseModel):
    translation_id: str
    source_text: str
    translated_text: str
    source_language: str
    target_language: str
    created_at: datetime
    is_favorite: bool

    class Config:
        from_attributes = True


# ── Favorites ─────────────────────────────────────────────────────────────────

class FavoriteEntry(BaseModel):
    favorite_id: str
    translation_id: str
    source_text: str
    translated_text: str
    source_language: str
    target_language: str
    created_at: datetime          # favorite created_at

    class Config:
        from_attributes = True


# ── Languages ─────────────────────────────────────────────────────────────────

class LanguageItem(BaseModel):
    code: str
    name: str


# ── Error ──────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
