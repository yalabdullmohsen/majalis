import json
import os
import re
import subprocess
import tempfile
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import whisper_timestamped as whisper
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

API_KEY = os.getenv("TASMEE3_ASR_API_KEY", "")
MODEL_NAME = os.getenv("TASMEE3_ASR_MODEL", "small")
DEVICE = os.getenv("TASMEE3_ASR_DEVICE", "cpu")
LOW_CONFIDENCE_THRESHOLD = float(os.getenv("TASMEE3_LOW_CONFIDENCE", "0.55"))
MIN_AUDIO_BYTES = int(os.getenv("TASMEE3_MIN_AUDIO_BYTES", "1200"))
MIN_AUDIO_DURATION_SECONDS = float(
    os.getenv("TASMEE3_MIN_AUDIO_DURATION_SECONDS", "1.2")
)

app = FastAPI(title="Tasmee3 ASR Server", version="3.0.0")

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


def get_audio_duration_seconds(path: str) -> float:
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                path,
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            return 0.0

        return float(result.stdout.strip())
    except Exception:
        return 0.0


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


def word_distance(a: str, b: str) -> int:
    if a == b:
        return 0

    rows = len(a) + 1
    cols = len(b) + 1

    dp = [[0 for _ in range(cols)] for _ in range(rows)]

    for i in range(rows):
        dp[i][0] = i

    for j in range(cols):
        dp[0][j] = j

    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if a[i - 1] == b[j - 1] else 1

            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )

    return dp[-1][-1]


def words_are_close(expected: str, recognized: str) -> bool:
    if expected == recognized:
        return True

    if not expected or not recognized:
        return False

    distance = word_distance(expected, recognized)
    max_len = max(len(expected), len(recognized))

    if max_len <= 3:
        return distance == 1

    ratio = distance / max_len
    return ratio <= 0.34


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


@dataclass
class AlignmentCell:
    cost: float
    operation: str


def align_with_edit_distance(
    expected_map: List[Dict[str, Any]],
    recognized_words: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    n = len(expected_map)
    m = len(recognized_words)

    dp: List[List[float]] = [[0.0] * (m + 1) for _ in range(n + 1)]
    op: List[List[str]] = [[""] * (m + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        dp[i][0] = float(i)
        op[i][0] = "missing"

    for j in range(1, m + 1):
        dp[0][j] = float(j)
        op[0][j] = "extra"

    for i in range(1, n + 1):
        expected_word = expected_map[i - 1]["word"]

        for j in range(1, m + 1):
            recognized_word = recognized_words[j - 1]["word"]

            if expected_word == recognized_word:
                sub_cost = 0.0
            elif words_are_close(expected_word, recognized_word):
                sub_cost = 0.45
            else:
                sub_cost = 1.0

            substitution = dp[i - 1][j - 1] + sub_cost
            deletion = dp[i - 1][j] + 1.0
            insertion = dp[i][j - 1] + 1.0

            best = min(substitution, deletion, insertion)
            dp[i][j] = best

            if best == substitution:
                op[i][j] = "match" if sub_cost == 0.0 else "mismatch"
            elif best == deletion:
                op[i][j] = "missing"
            else:
                op[i][j] = "extra"

    aligned_reversed: List[Dict[str, Any]] = []

    i = n
    j = m

    while i > 0 or j > 0:
        operation = op[i][j] if i <= n and j <= m else ""

        if i > 0 and j > 0 and operation in ("match", "mismatch"):
            expected_item = expected_map[i - 1]
            recognized = recognized_words[j - 1]
            confidence = float(recognized.get("confidence", 0.0))

            if operation == "match":
                status = "correct"
                if confidence > 0 and confidence < LOW_CONFIDENCE_THRESHOLD:
                    status = "lowConfidence"
            else:
                status = "mismatch"

            aligned_reversed.append(
                {
                    "expectedWord": expected_item["word"],
                    "recognizedWord": recognized["word"],
                    "globalWordIndex": expected_item["globalWordIndex"],
                    "wordIndexInAyah": expected_item["wordIndexInAyah"],
                    "surah": expected_item["surah"],
                    "ayah": expected_item["ayah"],
                    "startMs": recognized.get("startMs"),
                    "endMs": recognized.get("endMs"),
                    "confidence": confidence,
                    "status": status,
                }
            )

            i -= 1
            j -= 1
            continue

        if i > 0 and (operation == "missing" or j == 0):
            expected_item = expected_map[i - 1]

            aligned_reversed.append(
                {
                    "expectedWord": expected_item["word"],
                    "recognizedWord": None,
                    "globalWordIndex": expected_item["globalWordIndex"],
                    "wordIndexInAyah": expected_item["wordIndexInAyah"],
                    "surah": expected_item["surah"],
                    "ayah": expected_item["ayah"],
                    "startMs": None,
                    "endMs": None,
                    "confidence": 0.0,
                    "status": "missing",
                }
            )

            i -= 1
            continue

        if j > 0:
            j -= 1
            continue

        break

    return list(reversed(aligned_reversed))


def build_expected_map(
    expected_words: List[str],
    expected_word_map_raw: str,
    from_surah: int,
    from_ayah: int,
) -> List[Dict[str, Any]]:
    if expected_word_map_raw:
        try:
            decoded = json.loads(expected_word_map_raw)
            if isinstance(decoded, list):
                result = []

                for index, item in enumerate(decoded):
                    if not isinstance(item, dict):
                        continue

                    word = normalize_arabic(str(item.get("word", "")))

                    if not word:
                        continue

                    result.append(
                        {
                            "word": word,
                            "globalWordIndex": int(item.get("globalWordIndex", index)),
                            "wordIndexInAyah": int(item.get("wordIndexInAyah", index)),
                            "surah": int(item.get("surah", from_surah)),
                            "ayah": int(item.get("ayah", from_ayah)),
                        }
                    )

                if result:
                    return result
        except json.JSONDecodeError:
            pass

    return [
        {
            "word": word,
            "globalWordIndex": index,
            "wordIndexInAyah": index,
            "surah": from_surah,
            "ayah": from_ayah,
        }
        for index, word in enumerate(expected_words)
    ]


def build_ayah_scores(aligned_words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    grouped: Dict[Tuple[int, int], List[Dict[str, Any]]] = {}

    for word in aligned_words:
        key = (int(word.get("surah", 0)), int(word.get("ayah", 0)))
        grouped.setdefault(key, []).append(word)

    scores: List[Dict[str, Any]] = []

    for (surah, ayah), words in grouped.items():
        total = len(words)
        correct = sum(1 for w in words if w["status"] == "correct")
        missing = sum(1 for w in words if w["status"] == "missing")
        wrong = sum(1 for w in words if w["status"] == "mismatch")
        low = sum(1 for w in words if w["status"] == "lowConfidence")

        accuracy = 0.0 if total == 0 else correct / total

        scores.append(
            {
                "surah": surah,
                "ayah": ayah,
                "totalWords": total,
                "correctWords": correct,
                "missingWords": missing,
                "wrongWords": wrong,
                "lowConfidenceWords": low,
                "accuracy": accuracy,
            }
        )

    scores.sort(key=lambda item: (item["surah"], item["ayah"]))
    return scores


def build_weak_spots(ayah_scores: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    weak_spots: List[Dict[str, Any]] = []

    for score in ayah_scores:
        surah = int(score["surah"])
        ayah = int(score["ayah"])
        accuracy = float(score["accuracy"])
        missing = int(score["missingWords"])
        wrong = int(score["wrongWords"])
        low = int(score["lowConfidenceWords"])

        if accuracy < 0.75:
            weak_spots.append(
                {
                    "surah": surah,
                    "ayah": ayah,
                    "type": "lowAccuracy",
                    "title": "دقة منخفضة في الآية",
                    "description": f"الدقة التقريبية في هذه الآية {round(accuracy * 100)}%.",
                    "severity": 3,
                }
            )
        elif accuracy < 0.85:
            weak_spots.append(
                {
                    "surah": surah,
                    "ayah": ayah,
                    "type": "lowAccuracy",
                    "title": "تحتاج الآية إلى مراجعة",
                    "description": f"الدقة التقريبية في هذه الآية {round(accuracy * 100)}%.",
                    "severity": 2,
                }
            )

        if missing > 0:
            weak_spots.append(
                {
                    "surah": surah,
                    "ayah": ayah,
                    "type": "missingWords",
                    "title": "كلمات ناقصة",
                    "description": f"يوجد {missing} كلمة ناقصة في الآية.",
                    "severity": 3,
                }
            )

        if wrong > 0:
            weak_spots.append(
                {
                    "surah": surah,
                    "ayah": ayah,
                    "type": "repeatedMistake",
                    "title": "كلمات غير مطابقة",
                    "description": f"يوجد {wrong} كلمة غير مطابقة في الآية.",
                    "severity": 2,
                }
            )

        if low > 0:
            weak_spots.append(
                {
                    "surah": surah,
                    "ayah": ayah,
                    "type": "lowConfidence",
                    "title": "جودة تعرف منخفضة",
                    "description": f"يوجد {low} كلمة بثقة منخفضة. حاول القراءة في مكان أهدأ.",
                    "severity": 1,
                }
            )

    weak_spots.sort(key=lambda item: item["severity"], reverse=True)
    return weak_spots[:10]


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": DEVICE,
        "version": "3.0.0",
        "features": [
            "transcription",
            "word_timestamps",
            "forced_alignment",
            "edit_distance_alignment",
            "ayah_scores",
            "weak_spots",
            "audio_validation",
        ],
        "lowConfidenceThreshold": LOW_CONFIDENCE_THRESHOLD,
        "minAudioBytes": MIN_AUDIO_BYTES,
        "minAudioDurationSeconds": MIN_AUDIO_DURATION_SECONDS,
    }


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form("ar"),
    expectedText: str = Form(""),
    expectedWords: str = Form("[]"),
    expectedWordMap: str = Form("[]"),
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
        file_size = os.path.getsize(temp_path)

        if file_size < MIN_AUDIO_BYTES:
            raise HTTPException(
                status_code=400,
                detail="Audio file is too small or empty",
            )

        duration = get_audio_duration_seconds(temp_path)

        if duration < MIN_AUDIO_DURATION_SECONDS:
            raise HTTPException(
                status_code=400,
                detail="Audio duration is too short",
            )

        model = get_model()

        result = whisper.transcribe(
            model,
            temp_path,
            language=language,
            vad=True,
            detect_disfluencies=False,
            condition_on_previous_text=False,
            temperature=0.0,
        )

        recognized_words = extract_words(result)
        full_text = " ".join([word["word"] for word in recognized_words]).strip()

        if not full_text:
            full_text = normalize_arabic(str(result.get("text", "")).strip())

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

        expected_map = build_expected_map(
            expected_words=parsed_expected_words,
            expected_word_map_raw=expectedWordMap,
            from_surah=fromSurah,
            from_ayah=fromAyah,
        )

        if expected_map:
            aligned_words = align_with_edit_distance(
                expected_map=expected_map,
                recognized_words=recognized_words,
            )
        else:
            aligned_words = []

        ayah_scores = build_ayah_scores(aligned_words)
        weak_spots = build_weak_spots(ayah_scores)

        return {
            "fullText": full_text,
            "confidence": confidence,
            "isFinal": True,
            "meta": {
                "fromSurah": fromSurah,
                "fromAyah": fromAyah,
                "toSurah": toSurah,
                "toAyah": toAyah,
                "audio": {
                    "durationSeconds": duration,
                    "fileSizeBytes": file_size,
                },
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
            "ayahScores": ayah_scores,
            "weakSpots": weak_spots,
        }

    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


@app.websocket("/ws/live")
async def live_asr(websocket: WebSocket):
    """Protocol scaffold for live ASR. Does not replace /transcribe."""
    await websocket.accept()

    try:
        await websocket.send_json(
            {
                "type": "ready",
                "text": "",
                "confidence": 0.0,
                "words": [],
            }
        )

        buffer_messages = []
        is_started = False

        while True:
            message = await websocket.receive()

            if "text" in message:
                try:
                    payload = json.loads(message["text"])
                except json.JSONDecodeError:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "error": "Invalid JSON message",
                        }
                    )
                    continue

                msg_type = payload.get("type")

                if msg_type == "start":
                    is_started = True
                    await websocket.send_json(
                        {
                            "type": "partial",
                            "text": "",
                            "confidence": 0.0,
                            "words": [],
                        }
                    )

                elif msg_type == "stop":
                    await websocket.send_json(
                        {
                            "type": "final",
                            "text": "",
                            "confidence": 0.0,
                            "words": [],
                        }
                    )
                    break

                elif msg_type == "audioChunk":
                    # Placeholder:
                    # Real audio-chunk ASR needs agreed PCM/base64 protocol
                    # then batched transcription. Keep the connection stable.
                    buffer_messages.append(payload)

                    if is_started:
                        await websocket.send_json(
                            {
                                "type": "partial",
                                "text": "",
                                "confidence": 0.0,
                                "words": [],
                            }
                        )

            elif "bytes" in message:
                # Later: accept raw bytes. Currently acknowledge only.
                await websocket.send_json(
                    {
                        "type": "partial",
                        "text": "",
                        "confidence": 0.0,
                        "words": [],
                    }
                )

    except WebSocketDisconnect:
        return
    except Exception as exc:
        try:
            await websocket.send_json(
                {
                    "type": "error",
                    "error": str(exc),
                }
            )
        except Exception:
            pass
