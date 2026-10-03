/**
 * In-memory store — replaces PostgreSQL for history and favorites.
 * Data lives for the lifetime of the server process.
 * Keyed by session_id so each browser tab sees only its own data.
 *
 * Shape:
 *   translations: Map<translation_id, TranslationRecord>
 *   favorites:    Map<translation_id, FavoriteRecord>
 */

export const translations = new Map()   // translation_id → record
export const favorites    = new Map()   // translation_id → favorite record

/**
 * TranslationRecord {
 *   translation_id, session_id,
 *   source_text, translated_text,
 *   source_language, target_language,
 *   created_at,          ← ISO string
 *   history_visible      ← boolean
 * }
 *
 * FavoriteRecord {
 *   favorite_id, translation_id, created_at
 * }
 */
