"""
Database models — mirrors SRS Section 5 data requirements exactly.

Translation table  (SRS 5.1)
Favorite table     (SRS 5.2)
Relationships      (SRS 5.3)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Translation(Base):
    """SRS 5.1 — Translation entity."""

    __tablename__ = "translations"

    translation_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_language: Mapped[str] = mapped_column(String(64), nullable=False)
    target_language: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )
    # SRS 5.1 — history_visible flag for soft-delete of history entries
    history_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # One Translation → zero or one Favorite (SRS 5.3)
    favorite: Mapped["Favorite"] = relationship(
        "Favorite", back_populates="translation", uselist=False, cascade="all, delete-orphan"
    )


class Favorite(Base):
    """SRS 5.2 — Favorite entity."""

    __tablename__ = "favorites"

    favorite_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # SRS 5.2 — FK to Translation
    translation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("translations.translation_id"), nullable=False, unique=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )

    translation: Mapped["Translation"] = relationship("Translation", back_populates="favorite")
