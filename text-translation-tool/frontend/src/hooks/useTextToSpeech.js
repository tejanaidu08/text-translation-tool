/**
 * FR9 — Text-to-Speech using browser SpeechSynthesis API.
 * Gracefully degrades when unsupported or no voice available (FR9.5-6).
 */
import { useState, useRef, useCallback } from 'react'

const synth = window.speechSynthesis || null

/** Map ISO 639-1 codes to BCP-47 language tags for voice matching. */
const LANG_MAP = {
  en: 'en-US', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN',
  kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', bn: 'bn-IN',
  fr: 'fr-FR', de: 'de-DE', es: 'es-ES', ja: 'ja-JP',
}

function findVoice(langCode) {
  const bcp47 = LANG_MAP[langCode] || langCode
  const voices = synth?.getVoices() || []
  return (
    voices.find((v) => v.lang === bcp47) ||
    voices.find((v) => v.lang.startsWith(bcp47.split('-')[0])) ||
    null
  )
}

export function useTextToSpeech({ onError }) {
  const [playing, setPlaying] = useState(false)
  const utteranceRef = useRef(null)

  const isSupported = Boolean(synth)

  const play = useCallback(
    (text, langCode) => {
      if (!isSupported) {
        onError?.('Text-to-speech is not supported in this browser.')
        return
      }
      synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      const voice = findVoice(langCode)
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      } else {
        utterance.lang = LANG_MAP[langCode] || langCode
        // Inform but still attempt playback with default voice
        onError?.(
          `No voice available for the selected language. Playing with default voice.`
        )
      }

      utterance.onstart = () => setPlaying(true)
      utterance.onend = () => setPlaying(false)
      utterance.onerror = (e) => {
        setPlaying(false)
        if (e.error !== 'interrupted') {
          onError?.('Text-to-speech playback failed. Please try again.')
        }
      }

      utteranceRef.current = utterance
      synth.speak(utterance)
    },
    [isSupported, onError]
  )

  const stop = useCallback(() => {
    synth?.cancel()
    setPlaying(false)
  }, [])

  return { playing, isSupported, play, stop }
}
