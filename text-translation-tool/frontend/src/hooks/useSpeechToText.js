/**
 * FR10 — Speech-to-Text using browser Web Speech API.
 * Gracefully degrades when unsupported (FR10.8).
 */
import { useState, useRef, useCallback } from 'react'

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null

export function useSpeechToText({ onResult, onError, language = 'en-US' }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const isSupported = Boolean(SpeechRecognition)

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onResult?.(transcript)
    }

    recognition.onerror = (event) => {
      setListening(false)
      const msgs = {
        'not-allowed': 'Microphone permission denied. Please allow microphone access.',
        'no-speech': 'No speech detected. Please try again.',
        'network': 'Network error during speech recognition.',
        'aborted': null, // user stopped manually — no error
      }
      const msg = msgs[event.error] ?? `Speech recognition error: ${event.error}`
      if (msg) onError?.(msg)
    }

    try {
      recognition.start()
    } catch {
      onError?.('Could not start microphone. Please try again.')
      setListening(false)
    }
  }, [isSupported, language, onResult, onError])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, isSupported, startListening, stopListening }
}
