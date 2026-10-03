/**
 * FR1 — text input area with:
 *   - character & word count (FR1.5)
 *   - max-length warning (FR1.6)
 *   - clear button (FR1.4)
 *   - microphone button (FR10)
 */
import { useCallback } from 'react'

const MAX_LENGTH = 5000

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export default function TextInput({
  value,
  onChange,
  onClear,
  onMicClick,
  micListening,
  micSupported,
  placeholder = 'Enter text to translate…',
  disabled = false,
}) {
  const charCount = value.length
  const wCount = wordCount(value)
  const overLimit = charCount > MAX_LENGTH

  const handleChange = useCallback(
    (e) => onChange(e.target.value),
    [onChange]
  )

  return (
    <div className="flex flex-col gap-1 h-full">
      <div className="relative flex-1">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={MAX_LENGTH + 500} /* soft limit — hard check on backend */
          aria-label="Source text"
          aria-describedby="char-count"
          className={`w-full h-full min-h-[160px] resize-none rounded-lg border px-4 py-3 pr-12
                      text-sm text-gray-800 placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      disabled:opacity-50 transition
                      ${overLimit ? 'border-red-400' : 'border-gray-300'}`}
        />

        {/* Clear button — FR1.4 */}
        {value && !disabled && (
          <button
            onClick={onClear}
            aria-label="Clear input"
            className="absolute top-2 right-2 rounded-full p-1 text-gray-400 hover:text-gray-700
                       hover:bg-gray-100 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer: counts + mic */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span id="char-count" className={overLimit ? 'text-red-500 font-medium' : ''}>
          {overLimit
            ? `Exceeds maximum length (${MAX_LENGTH} characters)`
            : `${charCount} chars · ${wCount} words`}
        </span>

        {/* Microphone — FR10 */}
        {micSupported && (
          <button
            onClick={onMicClick}
            aria-label={micListening ? 'Stop listening' : 'Start voice input'}
            title={micListening ? 'Stop listening' : 'Speak to enter text'}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition
                        ${micListening
                          ? 'bg-red-100 text-red-600 animate-pulse'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6.5 9a.5.5 0 0 1 .5.5
                       C19 14.09 15.94 17 12 17s-7-2.91-7-6.5a.5.5 0 0 1 1 0C6 13.54 8.69 16 12 16
                       s6-2.46 6-5.5a.5.5 0 0 1 .5-.5zM11 19h2v2h-2v-2z"/>
            </svg>
            {micListening ? 'Listening…' : 'Voice'}
          </button>
        )}
      </div>
    </div>
  )
}
