"""
Favorites router — FR8 (Favorites / Saved Translations).

GET    /api/favorites?session_id=...
POST   /api/favorites
DELETE /api/favorites/{translation_id}?session_id=...
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models import Translation, Favorite
from app.schemas import FavoriteEntry

router = APIRouter(prefix="/api/favorites", tags=["favorites"])
logger = logging.getLogger(__name__)


class AddFavoriteRequest(BaseModel):
    translation_id: str
    session_id: str


@router.get("", response_model=list[FavoriteEntry])
async def get_favorites(
    session_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """FR8.2 — list all favorites for session."""
    result = await db.execute(
        select(Favorite)
        .join(Favorite.translation)
        .where(Translation.session_id == session_id)
        .order_by(Favorite.created_at.desc())
    )
    rows = result.scalars().all()

    return [
        FavoriteEntry(
            favorite_id=f.favorite_id,
            translation_id=f.translation_id,
            source_text=f.translation.source_text,
            translated_text=f.translation.translated_text,
            source_language=f.translation.source_language,
            target_language=f.translation.target_language,
            created_at=f.created_at,
        )
        for f in rows
    ]


@router.post("", response_model=FavoriteEntry, status_code=status.HTTP_201_CREATED)
async def add_favorite(req: AddFavoriteRequest, db: AsyncSession = Depends(get_db)):
    """FR8.1 — save a translation as a favorite."""
    result = await db.execute(
        select(Translation).where(
            Translation.translation_id == req.translation_id,
            Translation.session_id == req.session_id,
        )
    )
    translation = result.scalar_one_or_none()
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found.")

    # FR8.5 — idempotent: already a favorite
    if translation.favorite is not None:
        raise HTTPException(status_code=409, detail="Translation is already saved as a favorite.")

    favorite = Favorite(translation_id=req.translation_id)
    db.add(favorite)
    await db.commit()
    await db.refresh(favorite)
    await db.refresh(translation)

    return FavoriteEntry(
        favorite_id=favorite.favorite_id,
        translation_id=favorite.translation_id,
        source_text=translation.source_text,
        translated_text=translation.translated_text,
        source_language=translation.source_language,
        target_language=translation.target_language,
        created_at=favorite.created_at,
    )


@router.delete("/{translation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    translation_id: str,
    session_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    FR8.4 — remove a translation from favorites.
    SRS 5.3: if also not in history, permanently delete the Translation record.
    """
    result = await db.execute(
        select(Favorite)
        .join(Favorite.translation)
        .where(
            Favorite.translation_id == translation_id,
            Translation.session_id == session_id,
        )
    )
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found.")

    translation = favorite.translation
    await db.delete(favorite)

    # If also hidden from history, permanently delete the translation (SRS 5.3)
    if not translation.history_visible:
        await db.delete(translation)

    await db.commit()
