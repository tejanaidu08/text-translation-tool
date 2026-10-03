/**
 * App.jsx — root component, coordinates all FR1-FR13 features.
 *
 * State ownership:
 *   • sourceText, sourceLang, targetLang     — translator state
 *   • translationResult                       — current output
 *   • history[], favorites[]                  — panel data
 *   • activePanel: null | 'history' | 'fav'  — panel visibility
 *   • error, ttsError                         — FR12 error messages
 *   • loading                                 — FR5.4 loading state
 */

import { useState, useEffect, useCallback } from 'react'
import { getSessionId } from './utils/session'
import {
  fetchLanguages,
  translateText,
  fetchHistory,
  deleteHistoryEntry,
  clearAllHistory,
  fetchFavorites,
  addFavorite,
  removeFavorite,
} from './services/api'

import LanguageSelector from './components/LanguageSelector'
import TextInput from './components/TextInput'
import TranslationOutput from './components/TranslationOutput'
import HistoryPanel from './components/HistoryPanel'
import FavoritesPanel from './components/FavoritesPanel'
import ErrorMessage from './components/ErrorMessage'
import LoadingSpinner from './components/LoadingSpinner'
import { useSpeechToText } from './hooks/useSpeechToText'
import { useTextToSpeech } from './hooks/useTextToSpeech'

const SESSION_ID = getSessionId()

export default function App() {
  // ── Languages ───────────────────────────────────────────────────────────────
  const [languages, setLanguages] = useState([])
  const [langsLoading, setLangsLoading] = useState(true)

  // ── Translator state ────────────────────────────────────────────────────────
  const [sourceText, setSourceText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('en')
  const [translationResult, setTranslationResult] = useState(null) // TranslateResponse
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Panel state ─────────────────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState(null) // null | 'history' | 'favorites'
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [favorites, setFavorites] = useState([])
  const [favsLoading, setFavsLoading] = useState(false)
  const [favsError, setFavsError] = useState('')

  // ── TTS / STT state ─────────────────────────────────────────────────────────
  const [speechError, setSpeechError] = useState('')

  const handleSpeechResult = useCallback((transcript) => {
    setSourceText((prev) => (prev ? prev + ' ' + transcript : transcript))
    setSpeechError('')
  }, [])

  const handleSpeechError = useCallback((msg) => setSpeechError(msg), [])
  const handleTtsError = useCallback((msg) => setSpeechError(msg), [])

  // Resolve STT language: use sourceLang code, fall back to 'en' when auto (FR10.3)
  const sttLang = sourceLang === 'auto' ? 'en-US' : `${sourceLang}-${sourceLang.toUpperCase()}`

  const { listening, isSupported: sttSupported, startListening, stopListening } =
    useSpeechToText({ onResult: handleSpeechResult, onError: handleSpeechError, language: sttLang })

  const { playing: ttsPlaying, isSupported: ttsSupported, play: ttsPlay, stop: ttsStop } =
    useTextToSpeech({ onError: handleTtsError })

  // ── Load languages on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchLanguages()
      .then((data) => {
        setLanguages(data)
        // Default target to English if available
        const hasEn = data.some((l) => l.code === 'en')
        if (hasEn) setTargetLang('en')
        else if (data.length) setTargetLang(data[0].code)
      })
      .catch(() => setError('Failed to load supported languages. Please refresh.'))
      .finally(() => setLangsLoading(false))
  }, [])

  // ── Translate — FR5 ─────────────────────────────────────────────────────────
  const handleTranslate = useCallback(async () => {
    setError('')
    setSpeechError('')

    if (!sourceText.trim()) {
      setError('Please enter some text to translate.')
      return
    }
    // FR2.5 — same language guard
    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      setError('Source and target languages must be different.')
      return
    }

    setLoading(true)
    try {
      const result = await translateText({
        source_text: sourceText,
        source_language: sourceLang,
        target_language: targetLang,
        session_id: SESSION_ID,
      })
      setTranslationResult(result)
      // Refresh history if panel is open
      if (activePanel === 'history') loadHistory()
    } catch (err) {
      setError(err.message)
      // FR5.7 — retain input text on failure (it stays in state)
    } finally {
      setLoading(false)
    }
  }, [sourceText, sourceLang, targetLang, activePanel])

  // ── Language swap — FR4 ──────────────────────────────────────────────────────
  const handleSwap = useCallback(() => {
    // FR4.4 — disable swap when Auto Detect and no language detected
    if (sourceLang === 'auto' && !translationResult?.detected_language) {
      setError('Cannot swap: source language is Auto Detect and no language has been detected yet.')
      return
    }

    const newSource = sourceLang === 'auto' ? translationResult.source_language : sourceLang
    const newTarget = sourceLang === 'auto' ? targetLang : sourceLang
    const prevSource = targetLang

    setSourceLang(newSource === targetLang ? prevSource : newSource)
    setTargetLang(newTarget === newSource ? prevSource : newTarget)

    // FR4.3 — move translated text to input, previous input to output
    if (translationResult) {
      setSourceText(translationResult.translated_text)
      setTranslationResult((prev) => ({
        ...prev,
        translated_text: prev.source_text,
        source_text: prev.translated_text,
      }))
    }
  }, [sourceLang, targetLang, translationResult])

  // ── Clear ───────────────────────────────────────────────────────────────────
  const handleClearInput = useCallback(() => {
    setSourceText('')
    setError('')
    setSpeechError('')
  }, [])

  const handleClearOutput = useCallback(() => {
    // FR6 — clear output without affecting history
    setTranslationResult(null)
    ttsStop()
  }, [ttsStop])

  // ── Favorite — FR8 ──────────────────────────────────────────────────────────
  const handleToggleFavorite = useCallback(async () => {
    if (!translationResult) return
    const { translation_id, is_favorite } = translationResult

    try {
      if (is_favorite) {
        await removeFavorite(translation_id, SESSION_ID)
        setTranslationResult((r) => ({ ...r, is_favorite: false }))
      } else {
        await addFavorite(translation_id, SESSION_ID)
        setTranslationResult((r) => ({ ...r, is_favorite: true }))
      }
      if (activePanel === 'favorites') loadFavorites()
      if (activePanel === 'history') loadHistory()
    } catch (err) {
      setError(err.message)
    }
  }, [translationResult, activePanel])

  // ── History ─────────────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const data = await fetchHistory(SESSION_ID)
      setHistory(data)
    } catch (err) {
      setHistoryError(err.message)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const openHistory = useCallback(() => {
    setActivePanel('history')
    loadHistory()
  }, [loadHistory])

  const handleReuseHistory = useCallback((entry) => {
    setSourceText(entry.source_text)
    setSourceLang(entry.source_language)
    setTargetLang(entry.target_language)
    setTranslationResult({
      translation_id: entry.translation_id,
      source_text: entry.source_text,
      translated_text: entry.translated_text,
      source_language: entry.source_language,
      target_language: entry.target_language,
      is_favorite: entry.is_favorite,
      created_at: entry.created_at,
    })
    setActivePanel(null)
  }, [])

  const handleDeleteHistory = useCallback(async (translationId) => {
    try {
      await deleteHistoryEntry(translationId, SESSION_ID)
      setHistory((h) => h.filter((e) => e.translation_id !== translationId))
    } catch (err) {
      setHistoryError(err.message)
    }
  }, [])

  const handleClearHistory = useCallback(async () => {
    try {
      await clearAllHistory(SESSION_ID)
      setHistory([])
    } catch (err) {
      setHistoryError(err.message)
    }
  }, [])

  // ── Favorites ────────────────────────────────────────────────────────────────
  const loadFavorites = useCallback(async () => {
    setFavsLoading(true)
    setFavsError('')
    try {
      const data = await fetchFavorites(SESSION_ID)
      setFavorites(data)
    } catch (err) {
      setFavsError(err.message)
    } finally {
      setFavsLoading(false)
    }
  }, [])

  const openFavorites = useCallback(() => {
    setActivePanel('favorites')
    loadFavorites()
  }, [loadFavorites])

  const handleReuseFavorite = useCallback((entry) => {
    setSourceText(entry.source_text)
    setSourceLang(entry.source_language)
    setTargetLang(entry.target_language)
    setTranslationResult({
      translation_id: entry.translation_id,
      source_text: entry.source_text,
      translated_text: entry.translated_text,
      source_language: entry.source_language,
      target_language: entry.target_language,
      is_favorite: true,
      created_at: entry.created_at,
    })
    setActivePanel(null)
  }, [])

  const handleRemoveFavorite = useCallback(async (translationId) => {
    try {
      await removeFavorite(translationId, SESSION_ID)
      setFavorites((f) => f.filter((e) => e.translation_id !== translationId))
      if (translationResult?.translation_id === translationId) {
        setTranslationResult((r) => r ? { ...r, is_favorite: false } : r)
      }
    } catch (err) {
      setFavsError(err.message)
    }
  }, [translationResult])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getLangName = (code) => languages.find((l) => l.code === code)?.name || code

  const targetLangName = getLangName(targetLang)
  const sourceLangName =
    sourceLang === 'auto'
      ? (translationResult?.detected_language ? getLangName(translationResult.detected_language) : 'Auto Detect')
      : getLangName(sourceLang)

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🌐</span>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Text Translation Tool</h1>
          </div>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <NavButton
              onClick={openHistory}
              active={activePanel === 'history'}
              icon="🕐"
              label="History"
            />
            <NavButton
              onClick={openFavorites}
              active={activePanel === 'favorites'}
              icon="★"
              label="Favorites"
            />
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
        {langsLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" label="Loading…" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">

            {/* ── Translator card ── */}
            <section
              className="flex-1 flex flex-col gap-4 bg-white rounded-2xl shadow-md p-5 lg:p-6"
              aria-label="Translator"
            >
              {/* Language bar — FR2, FR4 */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[140px]">
                  <LanguageSelector
                    id="source-lang"
                    label="From"
                    value={sourceLang}
                    onChange={(v) => {
                      setSourceLang(v)
                      setError('')
                      // FR2.5 — if new source matches current target, pick next available target
                      if (v !== 'auto' && v === targetLang) {
                        const next = languages.find((l) => l.code !== v)
                        if (next) setTargetLang(next.code)
                      }
                    }}
                    languages={languages}
                    includeAuto
                    disabledCode={targetLang}
                  />
                </div>

                {/* Swap button — FR4 */}
                <button
                  onClick={handleSwap}
                  aria-label="Swap source and target languages"
                  title="Swap languages"
                  className="mb-0.5 rounded-full border border-gray-300 p-2 text-gray-500
                             hover:bg-gray-100 hover:text-primary-600 transition focus:outline-none
                             focus:ring-2 focus:ring-primary-400"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>

                <div className="flex-1 min-w-[140px]">
                  <LanguageSelector
                    id="target-lang"
                    label="To"
                    value={targetLang}
                    onChange={(v) => {
                      setTargetLang(v)
                      setError('')
                      // FR2.5 — if new target matches current source, pick next available source
                      if (sourceLang !== 'auto' && v === sourceLang) {
                        const next = languages.find((l) => l.code !== v)
                        if (next) setSourceLang(next.code)
                      }
                    }}
                    languages={languages}
                    disabledCode={sourceLang === 'auto' ? undefined : sourceLang}
                  />
                </div>
              </div>

              {/* Error messages — FR12 */}
              {error && (
                <ErrorMessage message={error} type="error" onDismiss={() => setError('')} />
              )}
              {speechError && (
                <ErrorMessage message={speechError} type="warning" onDismiss={() => setSpeechError('')} />
              )}

              {/* Input / Output columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {/* Input — FR1 */}
                <TextInput
                  value={sourceText}
                  onChange={setSourceText}
                  onClear={handleClearInput}
                  onMicClick={listening ? stopListening : startListening}
                  micListening={listening}
                  micSupported={sttSupported}
                  disabled={loading}
                />

                {/* Output — FR6 */}
                <div className="flex flex-col gap-2 min-h-[180px]">
                  {loading ? (
                    <div className="flex flex-1 items-center justify-center min-h-[160px]
                                    rounded-lg border border-dashed border-gray-200 bg-gray-50">
                      <LoadingSpinner label="Translating…" />
                    </div>
                  ) : translationResult ? (
                    <TranslationOutput
                      translatedText={translationResult.translated_text}
                      targetLanguageName={targetLangName}
                      targetLanguageCode={targetLang}
                      sourceLangName={sourceLangName}
                      detectedLanguage={translationResult.detected_language}
                      onClear={handleClearOutput}
                      onFavorite={handleToggleFavorite}
                      isFavorite={translationResult.is_favorite}
                      ttsPlaying={ttsPlaying}
                      ttsSupported={ttsSupported}
                      onTtsPlay={ttsPlay}
                      onTtsStop={ttsStop}
                    />
                  ) : (
                    <div className="flex flex-1 items-center justify-center min-h-[160px]
                                    rounded-lg border border-dashed border-gray-200 bg-gray-50">
                      <p className="text-sm text-gray-400">Translation will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Translate button — FR5.1 */}
              <button
                onClick={handleTranslate}
                disabled={loading || !sourceText.trim()}
                className="w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold
                           text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98]
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Translate text"
              >
                {loading ? 'Translating…' : 'Translate'}
              </button>
            </section>

            {/* ── Side panel (History / Favorites) — FR7, FR8 ── */}
            {activePanel && (
              <aside className="w-full lg:w-80 xl:w-96 bg-white rounded-2xl shadow-md p-5 flex flex-col gap-4 max-h-[600px]">
                {activePanel === 'history' ? (
                  <HistoryPanel
                    entries={history}
                    loading={historyLoading}
                    error={historyError}
                    onReuse={handleReuseHistory}
                    onDelete={handleDeleteHistory}
                    onClearAll={handleClearHistory}
                    onClose={() => setActivePanel(null)}
                  />
                ) : (
                  <FavoritesPanel
                    entries={favorites}
                    loading={favsLoading}
                    error={favsError}
                    onReuse={handleReuseFavorite}
                    onRemove={handleRemoveFavorite}
                    onClose={() => setActivePanel(null)}
                  />
                )}
              </aside>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-8 pb-6 text-center text-xs text-gray-400">
        Text Translation Tool · Translations powered by an external service
      </footer>
    </div>
  )
}

function NavButton({ onClick, active, icon, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition
                  focus:outline-none focus:ring-2 focus:ring-primary-400
                  ${active
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  )
}
