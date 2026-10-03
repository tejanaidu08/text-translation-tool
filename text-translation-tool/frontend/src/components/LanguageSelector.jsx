/**
 * FR2 — language selector with optional Auto Detect entry (FR2.3).
 * FR2.5 — prevents same source/target selection by filtering out the other
 *          selected language from the list entirely.
 */
export default function LanguageSelector({
  id,
  label,
  value,
  onChange,
  languages,
  includeAuto = false,
  disabledCode,       // FR2.5 — code to exclude from this selector's list
  disabled = false,
}) {
  // Filter out the other selector's chosen language completely (cleaner UX than greying out)
  const filteredLanguages = disabledCode
    ? languages.filter((l) => l.code !== disabledCode)
    : languages

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   disabled:opacity-50 disabled:cursor-not-allowed transition"
        aria-label={label}
      >
        {includeAuto && (
          <option value="auto">Auto Detect</option>
        )}
        {filteredLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
