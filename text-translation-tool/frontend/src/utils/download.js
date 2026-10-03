/**
 * FR11.3-5 — download translated text as a UTF-8 .txt file.
 * File is named meaningfully with target language and date.
 */
export function downloadTranslation(text, targetLanguageName) {
  const date = new Date().toISOString().split('T')[0]
  const safeName = (targetLanguageName || 'translation').replace(/\s+/g, '-').toLowerCase()
  const filename = `translation-${safeName}-${date}.txt`

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
