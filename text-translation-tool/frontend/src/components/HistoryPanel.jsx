/**
 * FR7 — Translation History panel.
 * Lists entries most-recent first, allows reuse, delete, clear-all.
 * FR7.7 — empty state message.
 * FR7.8 — session-scoped (handled by API, not here).
 */
import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'

export default function HistoryPanel({
  entries,
  loading,
  error,
  onReuse,
  onDelete,
  onClearAll,
  onClose,
}) {
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <aside
      aria-label="Translation history"
      className="flex flex-col gap-3 h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-base font-semibold text-gray-800">History</h2>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            confirmClear ? (
              <span className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Delete all?</span>
                <button
                  onClick={() => { onClearAll(); setConfirmClear(false) }}
                  className="text-xs text-red-600 font-medium hover:underline"
                >Yes</button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs text-gray-500 hover:underline"
                >No</button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs text-red-500 hover:text-red-700 hover:underline transition"
                aria-label="Clear all history"
              >
                Clear all
              </button>
            )
          )}
          <button
            onClick={onClose}
            aria-label="Close history panel"
            className="rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {loading && <LoadingSpinner label="Loading history…" />}
        {error && <ErrorMessage message={error} type="error" />}

        {!loading && !error && entries.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No history yet.</p>
        )}

        {entries.map((entry) => (
          <HistoryCard
            key={entry.translation_id}
            entry={entry}
            onReuse={onReuse}
            onDelete={onDelete}
          />
        ))}
      </div>
    </aside>
  )
}

function HistoryCard({ entry, onReuse, onDelete }) {
  const date = new Date(entry.created_at).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">
            {entry.source_language} → {entry.target_language} · {date}
            {entry.is_favorite && <span className="ml-1 text-yellow-500">★</span>}
          </p>
          <p className="text-sm text-gray-700 mt-1 line-clamp-2">{entry.source_text}</p>
          <p className="text-sm text-primary-600 mt-0.5 line-clamp-2">{entry.translated_text}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => onReuse(entry)}
            className="text-xs text-primary-600 hover:underline font-medium"
            aria-label="Reuse this translation"
          >
            Reuse
          </button>
          <button
            onClick={() => onDelete(entry.translation_id)}
            className="text-xs text-red-400 hover:underline"
            aria-label="Delete this history entry"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
