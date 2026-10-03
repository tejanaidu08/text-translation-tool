import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { translations } from '../store.js'
import { translate, SUPPORTED_LANGUAGES } from '../services/translation.js'

const router = Router()

// GET /api/languages
router.get('/languages', (_req, res) => {
  res.json(SUPPORTED_LANGUAGES)
})

// POST /api/translate
router.post('/translate', async (req, res) => {
  const { source_text, source_language, target_language, session_id } = req.body
  const MAX = parseInt(process.env.MAX_INPUT_LENGTH || '5000', 10)

  if (!source_text || !source_text.trim()) {
    return res.status(422).json({ detail: 'Input text cannot be empty.' })
  }
  if (source_text.length > MAX) {
    return res.status(422).json({ detail: `Input text exceeds the maximum allowed length of ${MAX} characters.` })
  }
  if (!source_language || !target_language || !session_id) {
    return res.status(422).json({ detail: 'Missing required fields.' })
  }

  try {
    const { translatedText, resolvedSource } = await translate(
      source_text,
      source_language,
      target_language
    )

    const translationId = uuidv4()
    const now = new Date().toISOString()

    // Save to in-memory store
    translations.set(translationId, {
      translation_id:  translationId,
      session_id,
      source_text,
      translated_text: translatedText,
      source_language: resolvedSource,
      target_language,
      created_at:      now,
      history_visible: true,
    })

    return res.json({
      translation_id:    translationId,
      source_text,
      translated_text:   translatedText,
      source_language:   resolvedSource,
      target_language,
      detected_language: source_language === 'auto' ? resolvedSource : null,
      created_at:        now,
      is_favorite:       false,
    })
  } catch (err) {
    console.error('Translation error:', err.message)
    const status = err.status || 500
    return res.status(status).json({ detail: err.message || 'An unexpected error occurred.' })
  }
})

export default router
