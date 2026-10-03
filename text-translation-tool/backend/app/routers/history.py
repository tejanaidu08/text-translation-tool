"""
History router — FR7 (Translation History).

GET    /api/history?session_id=...
DELETE /api/history/{translation_id}?session_id=...
DELETE /api/history?session_id=...      (clear all)
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models import Translation, Favorite
from app.schemas import HistoryEntry

router = APIRouter(prefix="/api/history", tags=["history"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[HistoryEntry])
async def get_history(
    session_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """FR7.3 — list history entries for session, most recent first."""
    result = await db.execute(
        select(Translation)
        .where(
            Translation.session_id == session_id,
            Translation.history_visible == True,
        )
        .order_by(Translation.created_at.desc())
    )
    rows = result.scalars().all()

    return [
        HistoryEntry(
            translation_id=r.translation_id,
            source_text=r.source_text,
            translated_text=r.translated_text,
            source_language=r.source_language,
            target_language=r.target_language,
            created_at=r.created_at,
            is_favorite=r.favorite is not None,
        )
        for r in rows
    ]


@router.delete("/{translation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_entry(
    translation_id: str,
    session_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    FR7.5 — delete individual history entry.
    SRS 5.3: sets history_visible=False; if not a favorite, permanently deletes.
    """
    result = await db.execute(
        select(Translation).where(
            Translation.translation_id == translation_id,
            Translation.session_id == session_id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="History entry not found.")

    if record.favorite is not None:
        # Keep the record but hide from history (SRS 5.3)
        record.history_visible = False
    else:
        # Permanently remove (SRS 5.3)
        await db.delete(record)

    await db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_history(
    session_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """FR7.6 — clear all history for session."""
    result = await db.execute(
        select(Translation).where(
            Translation.session_id == session_id,
            Translation.history_visible == True,
        )
    )
    rows = result.scalars().all()

    for record in rows:
        if record.favorite is not None:
            record.history_visible = False
        else:
            await db.delete(record)

    await db.commit()
