/**
 * Provider-independent translation service (SRS Appendix C).
 * Uses MyMemory free REST API — no key needed.
 * Falls back to a mock when the API is unreachable (dev convenience).
 */
import axios from 'axios'

// SRS Appendix C — initial language set
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'te', name: 'Telugu' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'ja', name: 'Japanese' },
]

const SUPPORTED_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code))

// MyMemory requires full BCP-47 locale codes for accurate translation
const LOCALE_MAP = {
  en: 'en-US',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  ja: 'ja-JP',
}

function toLocale(code) {
  return LOCALE_MAP[code] || code
}

// ── Language detection via MyMemory detect endpoint ───────────────────────────
export async function detectLanguage(text) {
  try {
    const res = await axios.get('https://api.mymemory.translated.net/detect', {
      params: { q: text.slice(0, 200) },
      timeout: 8000,
    })
    const code = res.data?.responseData?.language?.split('-')[0]
    if (!code || !SUPPORTED_CODES.has(code)) {
      throw new Error(
        'Could not detect the language. Please select the source language manually.'
      )
    }
    return code
  } catch (err) {
    if (err.message?.includes('detect') || err.message?.includes('manually')) throw err
    throw new Error('Could not detect the language. Please select the source language manually.')
  }
}

// ── Translate via MyMemory free API ───────────────────────────────────────────
export async function translate(text, sourceLang, targetLang) {
  // Resolve auto-detect
  let resolvedSource = sourceLang
  if (sourceLang === 'auto') {
    resolvedSource = await detectLanguage(text)
  }

  if (!SUPPORTED_CODES.has(resolvedSource)) {
    const err = new Error(`Source language '${resolvedSource}' is not supported.`)
    err.status = 422
    throw err
  }
  if (!SUPPORTED_CODES.has(targetLang)) {
    const err = new Error(`Target language '${targetLang}' is not supported.`)
    err.status = 422
    throw err
  }
  if (resolvedSource === targetLang) {
    const err = new Error('Source and target languages must be different.')
    err.status = 422
    throw err
  }

  // Try Google Translate unofficial endpoint first (best quality, no key needed)
  // Fall back to MyMemory if Google is unreachable
  try {
    const translated = await translateGoogle(text, resolvedSource, targetLang)
    return { translatedText: translated, resolvedSource }
  } catch (googleErr) {
    console.warn('Google translate failed, falling back to MyMemory:', googleErr.message)
  }

  try {
    const translated = await translateMyMemory(text, resolvedSource, targetLang)
    return { translatedText: translated, resolvedSource }
  } catch (err) {
    if (err.status) throw err
    const svcErr = new Error('Translation service is temporarily unavailable. Please try again later.')
    svcErr.status = 503
    throw svcErr
  }
}

// ── Provider: Google Translate (unofficial, no key needed) ────────────────────
async function translateGoogle(text, sourceLang, targetLang) {
  // Uses Google Translate's public API endpoint (same one used by translate.google.com)
  const url = 'https://translate.googleapis.com/translate_a/single'
  const res = await axios.get(url, {
    params: {
      client: 'gtx',
      sl: sourceLang,
      tl: targetLang,
      dt: 't',
      q: text,
    },
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  })

  // Response is a nested array: [ [ ["translated","original",...], ... ], ... ]
  const data = res.data
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Unexpected response format from translation service.')
  }

  // Concatenate all translated sentence chunks
  const translated = data[0]
    .filter((chunk) => Array.isArray(chunk) && chunk[0])
    .map((chunk) => chunk[0])
    .join('')

  if (!translated || translated.trim() === text.trim()) {
    throw new Error('Translation returned the source text unchanged.')
  }

  return translated
}

// ── Provider: MyMemory (fallback) ─────────────────────────────────────────────
async function translateMyMemory(text, resolvedSource, targetLang) {
  // Use full BCP-47 locale codes — MyMemory returns much better results with these
  const langPair = `${toLocale(resolvedSource)}|${toLocale(targetLang)}`
  const res = await axios.get('https://api.mymemory.translated.net/get', {
    params: { q: text, langpair: langPair },
    timeout: 15000,
  })

  const data = res.data
  if (!data?.responseData?.translatedText) {
    throw new Error('Translation service returned an empty response.')
  }

  let translated = data.responseData.translatedText

  // MyMemory sometimes returns the source text as the top result when a
  // low-quality crowd-sourced match wins. Pick a better one from matches[].
  if (translated.trim().toLowerCase() === text.trim().toLowerCase()) {
    const matches = data.matches || []
    const better = matches
      .filter((m) => m.translation && m.translation.trim().toLowerCase() !== text.trim().toLowerCase())
      .sort((a, b) => parseFloat(b.quality) - parseFloat(a.quality))[0]

    if (better) {
      translated = better.translation
    } else {
      const err = new Error('Translation service could not translate this text. Please try again later.')
      err.status = 503
      throw err
    }
  }

  return translated
}
