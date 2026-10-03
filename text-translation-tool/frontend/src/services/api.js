/**
 * Centralised API client — all calls go through here.
 * FR5, FR7, FR8 routes mirror the FastAPI backend exactly.
 */

import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Response interceptor: normalise error messages (FR12) ────────────────────
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail =
      err.response?.data?.detail ||
      (err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : null) ||
      (err.message === 'Network Error' ? 'Network error. Please check your connection.' : null) ||
      'An unexpected error occurred. Please try again.'
    return Promise.reject(new Error(detail))
  }
)

// ── Languages (FR2) ───────────────────────────────────────────────────────────
export const fetchLanguages = () => client.get('/languages').then((r) => r.data)

// ── Translation (FR5) ─────────────────────────────────────────────────────────
export const translateText = (payload) =>
  client.post('/translate', payload).then((r) => r.data)

// ── History (FR7) ─────────────────────────────────────────────────────────────
export const fetchHistory = (sessionId) =>
  client.get('/history', { params: { session_id: sessionId } }).then((r) => r.data)

export const deleteHistoryEntry = (translationId, sessionId) =>
  client.delete(`/history/${translationId}`, { params: { session_id: sessionId } })

export const clearAllHistory = (sessionId) =>
  client.delete('/history', { params: { session_id: sessionId } })

// ── Favorites (FR8) ───────────────────────────────────────────────────────────
export const fetchFavorites = (sessionId) =>
  client.get('/favorites', { params: { session_id: sessionId } }).then((r) => r.data)

export const addFavorite = (translationId, sessionId) =>
  client.post('/favorites', { translation_id: translationId, session_id: sessionId }).then((r) => r.data)

export const removeFavorite = (translationId, sessionId) =>
  client.delete(`/favorites/${translationId}`, { params: { session_id: sessionId } })
