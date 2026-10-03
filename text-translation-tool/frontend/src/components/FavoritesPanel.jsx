/**
 * FR8 — Favorites panel.
 * Lists saved translations, allows removal and reuse.
 * FR8.7 — empty state message.
 */
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'

export default function FavoritesPanel({
  entries,
  loading,
  error,
  onReuse,
  onRemove,
  onClose,
}) {
  return (
    <aside
      aria-label="Favorite translations"
      className="flex flex-col gap-3 h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-base font-semibold text-gray-800">Favorites</h2>
        <button
          onClick={onClose}
          aria-label="Close favorites panel"
          className="rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {loading && <LoadingSpinner label="Loading favorites…" />}
        {error && <ErrorMessage message={error} type="error" />}

        {!loading && !error && entries.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No favorites saved yet.</p>
        )}

        {entries.map((entry) => (
          <FavoriteCard
            key={entry.favorite_id}
            entry={entry}
            onReuse={onReuse}
            onRemove={onRemove}
          />
        ))}
      </div>
    </aside>
  )
}

function FavoriteCard({ entry, onReuse, onRemove }) {
  const date = new Date(entry.created_at).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">
            <span className="text-yellow-500 mr-1">★</span>
            {entry.source_language} → {entry.target_language} · {date}
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
            onClick={() => onRemove(entry.translation_id)}
            className="text-xs text-red-400 hover:underline"
            aria-label="Remove from favorites"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
