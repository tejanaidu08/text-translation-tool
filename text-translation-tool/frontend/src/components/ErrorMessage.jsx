/**
 * FR12 — displays user-friendly error and info messages.
 * Never shows technical details (FR12 SRS constraint).
 */
export default function ErrorMessage({ message, type = 'error', onDismiss }) {
  if (!message) return null

  const styles = {
    error: 'bg-red-50 border-red-300 text-red-800',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
    success: 'bg-green-50 border-green-300 text-green-800',
  }

  const icons = {
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
    success: '✓',
  }

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${styles[type]}`}
    >
      <span className="mt-0.5 font-bold shrink-0">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="ml-2 shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  )
}
