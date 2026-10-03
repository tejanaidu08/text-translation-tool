import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { translations, favorites } from '../store.js'

const router = Router()

// GET /api/favorites?session_id=...
router.get('/', (req, res) => {
  const { session_id } = req.query
  if (!session_id) return res.status(422).json({ detail: 'session_id required.' })

  const entries = []
  for (const fav of favorites.values()) {
    const t = translations.get(fav.translation_id)
    if (t && t.session_id === session_id) {
      entries.push({
        favorite_id:     fav.favorite_id,
        translation_id:  fav.translation_id,
        source_text:     t.source_text,
        translated_text: t.translated_text,
        source_language: t.source_language,
        target_language: t.target_language,
        created_at:      fav.created_at,
      })
    }
  }

  entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  res.json(entries)
})

// POST /api/favorites
router.post('/', (req, res) => {
  const { translation_id, session_id } = req.body
  if (!translation_id || !session_id) {
    return res.status(422).json({ detail: 'translation_id and session_id required.' })
  }

  const t = translations.get(translation_id)
  if (!t || t.session_id !== session_id) {
    return res.status(404).json({ detail: 'Translation not found.' })
  }

  if (favorites.has(translation_id)) {
    return res.status(409).json({ detail: 'Already saved as a favorite.' })
  }

  const fav = {
    favorite_id:    uuidv4(),
    translation_id,
    created_at:     new Date().toISOString(),
  }
  favorites.set(translation_id, fav)

  res.status(201).json({
    ...fav,
    source_text:     t.source_text,
    translated_text: t.translated_text,
    source_language: t.source_language,
    target_language: t.target_language,
  })
})

// DELETE /api/favorites/:translation_id?session_id=...
router.delete('/:translation_id', (req, res) => {
  const { translation_id } = req.params
  const { session_id } = req.query
  if (!session_id) return res.status(422).json({ detail: 'session_id required.' })

  const fav = favorites.get(translation_id)
  if (!fav) return res.status(404).json({ detail: 'Favorite not found.' })

  const t = translations.get(translation_id)
  if (!t || t.session_id !== session_id) {
    return res.status(404).json({ detail: 'Favorite not found.' })
  }

  favorites.delete(translation_id)

  // SRS 5.3 — if also hidden from history, remove the translation record too
  if (!t.history_visible) {
    translations.delete(translation_id)
  }

  res.status(204).send()
})

export default router
