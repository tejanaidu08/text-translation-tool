/** FR5.4 — loading indicator while translation is in progress. */
export default function LoadingSpinner({ size = 'md', label = 'Translating…' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-label={label}>
      <svg
        className={`animate-spin text-primary-600 ${sizes[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-sm text-gray-500">{label}</span>
    </span>
  )
}
