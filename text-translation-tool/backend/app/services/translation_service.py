"""
Translation service — provider-independent module (SRS Appendix C).

Supports:
  • MyMemory (free, no key required)   — TRANSLATION_PROVIDER=mymemory
  • Google Translate (deep-translator) — TRANSLATION_PROVIDER=google

The integration is isolated here so the provider can be swapped with
minimal changes to the rest of the system (SRS NFR2, Appendix C).
"""

import logging
from typing import Tuple

from app.config import settings

logger = logging.getLogger(__name__)

# ── Supported languages (SRS Appendix C initial set) ─────────────────────────
SUPPORTED_LANGUAGES: list[dict] = [
    {"code": "en", "name": "English"},
    {"code": "te", "name": "Telugu"},
    {"code": "hi", "name": "Hindi"},
    {"code": "ta", "name": "Tamil"},
    {"code": "kn", "name": "Kannada"},
    {"code": "ml", "name": "Malayalam"},
    {"code": "mr", "name": "Marathi"},
    {"code": "bn", "name": "Bengali"},
    {"code": "fr", "name": "French"},
    {"code": "de", "name": "German"},
    {"code": "es", "name": "Spanish"},
    {"code": "ja", "name": "Japanese"},
]

SUPPORTED_CODES = {lang["code"] for lang in SUPPORTED_LANGUAGES}


# ── Language detection ────────────────────────────────────────────────────────

def detect_language(text: str) -> str:
    """
    Detect the language of *text*.
    Returns an ISO 639-1 code or raises ValueError when detection fails
    or the detected language is not in the supported set.
    """
    try:
        from langdetect import detect, LangDetectException

        code = detect(text)
        # langdetect returns zh-cn etc.; normalise to first segment
        code = code.split("-")[0]
        if code not in SUPPORTED_CODES:
            raise ValueError(
                f"Detected language '{code}' is not supported. "
                "Please select the source language manually."
            )
        return code
    except ImportError:
        raise ValueError("Language detection is unavailable. Please select source language manually.")
    except Exception as exc:
        if isinstance(exc, ValueError):
            raise
        raise ValueError(
            "Could not detect the language. Please select source language manually."
        ) from exc


# ── Translation ───────────────────────────────────────────────────────────────

def translate_text(text: str, source_lang: str, target_lang: str) -> Tuple[str, str]:
    """
    Translate *text* from *source_lang* to *target_lang*.

    Returns (translated_text, resolved_source_lang).
    When source_lang == "auto" language detection is performed first.

    Raises:
        ValueError — validation / unsupported-language errors (shown to user)
        RuntimeError — provider/network errors (shown to user as service error)
    """
    if not text or not text.strip():
        raise ValueError("Input text cannot be empty.")

    resolved_source = source_lang
    if source_lang == "auto":
        resolved_source = detect_language(text)

    if resolved_source not in SUPPORTED_CODES:
        raise ValueError(f"Source language '{resolved_source}' is not supported.")
    if target_lang not in SUPPORTED_CODES:
        raise ValueError(f"Target language '{target_lang}' is not supported.")
    if resolved_source == target_lang:
        raise ValueError("Source and target languages must be different.")

    provider = settings.TRANSLATION_PROVIDER.lower()

    if provider == "google":
        translated = _translate_google(text, resolved_source, target_lang)
    else:
        translated = _translate_mymemory(text, resolved_source, target_lang)

    return translated, resolved_source


# ── Provider: MyMemory ────────────────────────────────────────────────────────

def _translate_mymemory(text: str, source: str, target: str) -> str:
    try:
        from deep_translator import MyMemoryTranslator

        translator = MyMemoryTranslator(source=source, target=target)
        result = translator.translate(text)
        if not result:
            raise RuntimeError("Translation service returned an empty response.")
        return result
    except ImportError:
        raise RuntimeError("Translation library not installed. Run: pip install deep-translator")
    except Exception as exc:
        logger.error("MyMemory translation error: %s", exc)
        raise RuntimeError(
            "Translation service is temporarily unavailable. Please try again later."
        ) from exc


# ── Provider: Google (deep-translator) ────────────────────────────────────────

def _translate_google(text: str, source: str, target: str) -> str:
    try:
        from deep_translator import GoogleTranslator

        translator = GoogleTranslator(source=source, target=target)
        result = translator.translate(text)
        if not result:
            raise RuntimeError("Translation service returned an empty response.")
        return result
    except ImportError:
        raise RuntimeError("Translation library not installed. Run: pip install deep-translator")
    except Exception as exc:
        logger.error("Google translation error: %s", exc)
        raise RuntimeError(
            "Translation service is temporarily unavailable. Please try again later."
        ) from exc
