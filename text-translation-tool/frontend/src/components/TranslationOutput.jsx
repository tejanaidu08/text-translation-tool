/**
 * FR6 — Translation output area with:
 *   Copy, Clear, Download, Share, TTS play/stop, Save as Favorite buttons.
 * FR11 — copy confirmation toast, download, share.
 * FR9  — TTS play/stop controls.
 * FR8  — Favorite button.
 */
import { useState, useCallback } from 'react'
import { downloadTranslation } from '../utils/download'

export default function TranslationOutput({
  translatedText,
  targetLanguageName,
  targetLanguageCode,
  onClear,
  onFavorite,
  isFavorite,
  ttsPlaying,
  ttsSupported,
  onTtsPlay,
  onTtsStop,
  detectedLanguage,    // FR3.2 — show detected language
  sourceLangName,
}) {
  const [copyMsg, setCopyMsg] = useState('')

  // FR11.1-2 — copy with confirmation
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(translatedText)
      setCopyMsg('Copied!')
      setTimeout(() => setCopyMsg(''), 2000)
    } catch {
      setCopyMsg('Copy failed — please select text manually.')
      setTimeout(() => setCopyMsg(''), 3000)
    }
  }, [translatedText])

  // FR11.3 — download
  const handleDownload = useCallback(() => {
    downloadTranslation(translatedText, targetLanguageName)
  }, [translatedText, targetLanguageName])

  // FR11.6-7 — share (where supported)
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: translatedText, title: 'Translation' })
      } catch {
        // user cancelled — no error shown
      }
    }
  }, [translatedText])

  const shareSupported = Boolean(navigator.share)

  if (!translatedText) return null

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Target language label — FR6.1 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {targetLanguageName}
        </span>
        {detectedLanguage && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Detected: {sourceLangName}
          </span>
        )}
      </div>

      {/* Output text — FR6.2 read-only */}
      <div
        aria-label="Translated text"
        aria-live="polite"
        className="flex-1 min-h-[160px] rounded-lg border border-gray-200 bg-gray-50
                   px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap overflow-y-auto"
      >
        {translatedText}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Copy */}
        <ActionButton onClick={handleCopy} icon="📋" label={copyMsg || 'Copy'} />

        {/* Clear — FR6 */}
        <ActionButton onClick={onClear} icon="✕" label="Clear" />

        {/* Download — FR11.3 */}
        <ActionButton onClick={handleDownload} icon="⬇" label="Download" />

        {/* Share — FR11.6 */}
        {shareSupported && (
          <ActionButton onClick={handleShare} icon="↗" label="Share" />
        )}

        {/* TTS — FR9 */}
        {ttsSupported && (
          <ActionButton
            onClick={ttsPlaying ? onTtsStop : () => onTtsPlay(translatedText, targetLanguageCode)}
            icon={ttsPlaying ? '⏹' : '🔊'}
            label={ttsPlaying ? 'Stop' : 'Listen'}
            active={ttsPlaying}
          />
        )}

        {/* Favorite — FR8.1 */}
        <ActionButton
          onClick={onFavorite}
          icon={isFavorite ? '★' : '☆'}
          label={isFavorite ? 'Saved' : 'Save'}
          active={isFavorite}
          className={isFavorite ? '!text-yellow-500' : ''}
        />
      </div>
    </div>
  )
}

function ActionButton({ onClick, icon, label, active = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium
                  transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400
                  ${active ? 'border-primary-400 text-primary-600 bg-primary-50' : 'border-gray-200 text-gray-600'}
                  ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  )
}
