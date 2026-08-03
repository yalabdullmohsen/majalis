import json
import os
import re
import tempfile
from typing import Any, Dict, List, Optional

import whisper_timestamped as whisper
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

API_KEY = os.getenv("TASMEE3_ASR_API_KEY", "")
MODEL_NAME = os.getenv("TASMEE3_ASR_MODEL", "small")
DEVICE = os.getenv("TASMEE3_ASR_DEVICE", "cpu")
LOW_CONFIDENCE_THRESHOLD = float(os.getenv("TASMEE3_LOW_CONFIDENCE", "0.55"))

app = FastAPI(title="Tasmee3 ASR Server", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None


def get_model():
    global _model
    if _model is None:
        _model = whisper.load_model(MODEL_NAME, device=DEVICE)
    return _model


def check_auth(authorization: Optional[str]):
    if not API_KEY:
        return

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    expected = f"Bearer {API_KEY}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="Invalid API key")


_TASHKEEL_RE = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]")
_NON_ARABIC_RE = re.compile(r"[^\u0621-\u064A\s]")
_SPACES_RE = re.compile(r"\s+")


def normalize_arabic(text: str) -> str:
    text = text.strip()
    text = text.replace("ـ", "")
    text = _TASHKEEL_RE.sub("", text)

    text = text.replace("ٱ", "ا")
    text = text.replace("آ", "ا")
    text = text.replace("أ", "ا")
    text = text.replace("إ", "ا")

    text = text.replace("ى", "ي")
    text = text.replace("ؤ", "و")
    text = text.replace("ئ", "ي")
    text = text.replace("ة", "ه")

    text = _NON_ARABIC_RE.sub(" ", text)
    text = _SPACES_RE.sub(" ", text)

    return text.strip()


def tokenize(text: str) -> List[str]:
    normalized = normalize_arabic(text)
    if not normalized:
        return []
    return [word for word in normalized.split(" ") if word.strip()]


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


def align_expected_to_recognized(
    expected_words: List[str],
    recognized_words: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    aligned: List[Dict[str, Any]] = []

    i = 0
    j = 0

    while i < len(expected_words) and j < len(recognized_words):
        expected = expected_words[i]
        recognized = recognized_words[j]
        rec_word = recognized["word"]
        confidence = float(recognized.get("confidence", 0.0))

        if expected == rec_word:
            status = "correct"
            if confidence > 0 and confidence < LOW_CONFIDENCE_THRESHOLD:
                status = "lowConfidence"

            aligned.append(
                {
                    "expectedWord": expected,
                    "recognizedWord": rec_word,
                    "globalWordIndex": i,
                    "startMs": recognized.get("startMs"),
                    "endMs": recognized.get("endMs"),
                    "confidence": confidence,
                    "status": status,
                }
            )

            i += 1
            j += 1
            continue

        next_expected = expected_words[i + 1] if i + 1 < len(expected_words) else None
        next_recognized = (
            recognized_words[j + 1]["word"] if j + 1 < len(recognized_words) else None
        )

        if next_expected is not None and next_expected == rec_word:
            aligned.append(
                {
                    "expectedWord": expected,
                    "recognizedWord": None,
                    "globalWordIndex": i,
                    "startMs": None,
                    "endMs": None,
                    "confidence": 0.0,
                    "status": "missing",
                }
            )
            i += 1
            continue

        if next_recognized is not None and expected == next_recognized:
            # Extra recognized word — skip it and keep expected for next match.
            j += 1
            continue

        aligned.append(
            {
                "expectedWord": expected,
                "recognizedWord": rec_word,
                "globalWordIndex": i,
                "startMs": recognized.get("startMs"),
                "endMs": recognized.get("endMs"),
                "confidence": confidence,
                "status": "mismatch",
            }
        )

        i += 1
        j += 1

    while i < len(expected_words):
        aligned.append(
            {
                "expectedWord": expected_words[i],
                "recognizedWord": None,
                "globalWordIndex": i,
                "startMs": None,
                "endMs": None,
                "confidence": 0.0,
                "status": "missing",
            }
        )
        i += 1

    return aligned


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": DEVICE,
        "version": "2.0.0",
        "features": ["transcription", "word_timestamps", "forced_alignment"],
    }


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form("ar"),
    expectedText: str = Form(""),
    expectedWords: str = Form("[]"),
    fromSurah: int = Form(0),
    fromAyah: int = Form(0),
    toSurah: int = Form(0),
    toAyah: int = Form(0),
    authorization: Optional[str] = Header(default=None),
):
    check_auth(authorization)

    suffix = os.path.splitext(audio.filename or "audio.m4a")[1] or ".m4a"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp.write(await audio.read())
        temp_path = temp.name

    try:
        model = get_model()

        result = whisper.transcribe(
            model,
            temp_path,
            language=language,
            vad=True,
            detect_disfluencies=False,
        )

        recognized_words = extract_words(result)
        full_text = " ".join([word["word"] for word in recognized_words]).strip()

        if not full_text:
            full_text = str(result.get("text", "")).strip()

        if recognized_words:
            confidence = sum(float(word["confidence"]) for word in recognized_words) / len(
                recognized_words
            )
        else:
            confidence = 0.0

        parsed_expected_words: List[str] = []

        try:
            decoded_expected = json.loads(expectedWords)
            if isinstance(decoded_expected, list):
                parsed_expected_words = [
                    normalize_arabic(str(word))
                    for word in decoded_expected
                    if normalize_arabic(str(word))
                ]
        except json.JSONDecodeError:
            parsed_expected_words = []

        if not parsed_expected_words and expectedText:
            parsed_expected_words = tokenize(expectedText)

        if parsed_expected_words:
            aligned_words = align_expected_to_recognized(
                parsed_expected_words,
                recognized_words,
            )
        else:
            aligned_words = []

        return {
            "fullText": full_text,
            "confidence": confidence,
            "isFinal": True,
            "meta": {
                "fromSurah": fromSurah,
                "fromAyah": fromAyah,
                "toSurah": toSurah,
                "toAyah": toAyah,
            },
            "words": [
                {
                    "word": word["word"],
                    "startMs": word["startMs"],
                    "endMs": word["endMs"],
                    "confidence": word["confidence"],
                }
                for word in recognized_words
            ],
            "alignedWords": aligned_words,
        }

    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass
