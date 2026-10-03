import { Router } from 'express'
import { translations, favorites } from '../store.js'

const router = Router()

// GET /api/history?session_id=...
router.get('/', (req, res) => {
  const { session_id } = req.query
  if (!session_id) return res.status(422).json({ detail: 'session_id required.' })

  const entries = []
  for (const t of translations.values()) {
    if (t.session_id === session_id && t.history_visible) {
      entries.push({
        translation_id:  t.translation_id,
        source_text:     t.source_text,
        translated_text: t.translated_text,
        source_language: t.source_language,
        target_language: t.target_language,
        created_at:      t.created_at,
        is_favorite:     favorites.has(t.translation_id),
      })
    }
  }

  // Most recent first
  entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  res.json(entries)
})

// DELETE /api/history/:id?session_id=...
router.delete('/:id', (req, res) => {
  const { id } = req.params
  const { session_id } = req.query
  if (!session_id) return res.status(422).json({ detail: 'session_id required.' })

  const t = translations.get(id)
  if (!t || t.session_id !== session_id) {
    return res.status(404).json({ detail: 'History entry not found.' })
  }

  if (favorites.has(id)) {
    // Keep record but hide from history (SRS 5.3)
    t.history_visible = false
  } else {
    translations.delete(id)
  }

  res.status(204).send()
})

// DELETE /api/history?session_id=...  (clear all)
router.delete('/', (req, res) => {
  const { session_id } = req.query
  if (!session_id) return res.status(422).json({ detail: 'session_id required.' })

  for (const [id, t] of translations.entries()) {
    if (t.session_id === session_id && t.history_visible) {
      if (favorites.has(id)) {
        t.history_visible = false
      } else {
        translations.delete(id)
      }
    }
  }

  res.status(204).send()
})

export default router
