from typing import Any, Dict, List

from arabic_utils import normalize_arabic
from safe_logging import logger
from settings import settings

_model = None
_faster_model = None


def get_model():
    """Load whisper-timestamped model (default production engine)."""
    global _model

    if _model is None:
        import whisper_timestamped as whisper

        _model = whisper.load_model(settings.model_name, device=settings.device)

    return _model


def get_faster_model():
    """Optional faster-whisper model. Not a hard dependency."""
    global _faster_model

    if _faster_model is None:
        from faster_whisper import WhisperModel

        compute_type = "float16" if settings.device.startswith("cuda") else "int8"
        _faster_model = WhisperModel(
            settings.model_name,
            device=settings.device,
            compute_type=compute_type,
        )

    return _faster_model


def extract_words(result: Dict[str, Any]) -> List[Dict[str, Any]]:
    words: List[Dict[str, Any]] = []

    for segment in result.get("segments", []):
        for word in segment.get("words", []):
            text = str(word.get("text", word.get("word", ""))).strip()

            if not text:
                continue

            normalized = normalize_arabic(text)

            if not normalized:
                continue

            start = float(word.get("start", 0.0))
            end = float(word.get("end", 0.0))
            confidence = float(word.get("confidence", word.get("probability", 0.0)))

            words.append(
                {
                    "word": normalized,
                    "originalWord": text,
                    "startMs": int(start * 1000),
                    "endMs": int(end * 1000),
                    "confidence": confidence,
                }
            )

    return words


def _pack_result(words: List[Dict[str, Any]], fallback_text: str = "") -> Dict[str, Any]:
    text = " ".join([word["word"] for word in words]).strip()

    if not text:
        text = normalize_arabic(fallback_text)

    confidence = (
        sum(float(word["confidence"]) for word in words) / len(words)
        if words
        else 0.0
    )

    return {
        "text": text,
        "confidence": confidence,
        "words": [
            {
                "word": word["word"],
                "startMs": word["startMs"],
                "endMs": word["endMs"],
                "confidence": word["confidence"],
            }
            for word in words
        ],
    }


def transcribe_with_whisper_timestamped(path: str, language: str = "ar") -> Dict[str, Any]:
    import whisper_timestamped as whisper

    model = get_model()

    result = whisper.transcribe(
        model,
        path,
        language=language,
        vad=True,
        detect_disfluencies=False,
        condition_on_previous_text=False,
        temperature=0.0,
    )

    words = extract_words(result)
    packed = _pack_result(words, fallback_text=str(result.get("text", "")).strip())
    packed["raw"] = result
    packed["engine"] = "whisper_timestamped"
    return packed


def transcribe_with_faster_whisper(path: str, language: str = "ar") -> Dict[str, Any]:
    model = get_faster_model()

    segments, _info = model.transcribe(
        path,
        language=language,
        word_timestamps=True,
        vad_filter=True,
    )

    words: List[Dict[str, Any]] = []
    texts: List[str] = []

    for segment in segments:
        if segment.text:
            texts.append(segment.text.strip())

        for word in segment.words or []:
            text = str(getattr(word, "word", "")).strip()
            if not text:
                continue

            normalized = normalize_arabic(text)
            if not normalized:
                continue

            start = float(getattr(word, "start", 0.0) or 0.0)
            end = float(getattr(word, "end", 0.0) or 0.0)
            confidence = float(getattr(word, "probability", 0.0) or 0.0)

            words.append(
                {
                    "word": normalized,
                    "originalWord": text,
                    "startMs": int(start * 1000),
                    "endMs": int(end * 1000),
                    "confidence": confidence,
                }
            )

    packed = _pack_result(words, fallback_text=" ".join(texts))
    packed["raw"] = {"engine": "faster_whisper"}
    packed["engine"] = "faster_whisper"
    return packed


def transcribe_file(path: str, language: str = "ar") -> Dict[str, Any]:
    """
    Transcribe audio. Default: whisper-timestamped.
    Optional: set TASMEE3_ASR_ENGINE=faster_whisper if faster-whisper is installed.
    """
    engine = (settings.engine or "whisper_timestamped").strip().lower()

    if engine in {"faster_whisper", "faster-whisper"}:
        try:
            return transcribe_with_faster_whisper(path, language=language)
        except ImportError:
            logger.warning(
                "faster-whisper not installed; falling back to whisper_timestamped"
            )
        except Exception:
            logger.exception(
                "faster-whisper failed; falling back to whisper_timestamped"
            )

    return transcribe_with_whisper_timestamped(path, language=language)
