import os
import tempfile
from typing import Any, Dict, List

import whisper_timestamped as whisper
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

API_KEY = os.getenv("TASMEE3_ASR_API_KEY", "")
MODEL_NAME = os.getenv("TASMEE3_ASR_MODEL", "small")
DEVICE = os.getenv("TASMEE3_ASR_DEVICE", "cpu")

app = FastAPI(title="Tasmee3 ASR Server", version="1.0.0")

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


def check_auth(authorization: str | None):
    if not API_KEY:
        return

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    expected = f"Bearer {API_KEY}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="Invalid API key")


def extract_words(result: Dict[str, Any]) -> List[Dict[str, Any]]:
    words: List[Dict[str, Any]] = []

    for segment in result.get("segments", []):
        for word in segment.get("words", []):
            text = str(word.get("text", word.get("word", ""))).strip()
            if not text:
                continue

            start = float(word.get("start", 0.0))
            end = float(word.get("end", 0.0))
            confidence = float(word.get("confidence", word.get("probability", 0.0)))

            words.append(
                {
                    "word": text,
                    "startMs": int(start * 1000),
                    "endMs": int(end * 1000),
                    "confidence": confidence,
                }
            )

    return words


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME, "device": DEVICE}


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = "ar",
    authorization: str | None = Header(default=None),
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

        words = extract_words(result)

        full_text = " ".join([word["word"] for word in words]).strip()

        if not full_text:
            full_text = str(result.get("text", "")).strip()

        if words:
            confidence = sum(word["confidence"] for word in words) / len(words)
        else:
            confidence = 0.0

        return {
            "fullText": full_text,
            "confidence": confidence,
            "isFinal": True,
            "words": words,
        }

    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass
