import base64
import json
import os
import time
from collections import deque
from typing import List, Optional

from fastapi import (
    FastAPI,
    File,
    Form,
    Header,
    HTTPException,
    Request,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from alignment_utils import (
    align_with_edit_distance,
    build_ayah_scores,
    build_expected_map,
    build_weak_spots,
)
from arabic_utils import normalize_arabic, tokenize
from asr_engine import transcribe_file
from audio_utils import (
    safe_remove,
    temp_file_path,
    validate_audio_file,
    write_chunks_to_file,
    write_pcm_to_wav,
)
from safe_logging import configure_logging, logger, new_request_id, timed_operation
from security import check_auth_header, check_rate_limit
from settings import settings

configure_logging()

app = FastAPI(title="Tasmee3 ASR Server", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path not in ["/health"]:
        try:
            check_rate_limit(request)
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )

    response = await call_next(request)
    return response


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "4.0.0",
        "model": settings.model_name,
        "device": settings.device,
        "engine": settings.engine,
        "features": [
            "transcription",
            "word_timestamps",
            "forced_alignment",
            "edit_distance_alignment",
            "ayah_scores",
            "weak_spots",
            "websocket_live",
            "pcm_streaming",
            "rate_limiting",
            "safe_logging",
            "optional_faster_whisper",
        ],
        "limits": {
            "minAudioBytes": settings.min_audio_bytes,
            "maxAudioBytes": settings.max_audio_bytes,
            "minAudioDurationSeconds": settings.min_audio_duration_seconds,
            "maxAudioDurationSeconds": settings.max_audio_duration_seconds,
            "rateLimitPerMinute": settings.rate_limit_per_minute,
        },
        "lowConfidenceThreshold": settings.low_confidence_threshold,
        "authRequired": bool(settings.api_key),
    }


@app.post("/transcribe")
async def transcribe(
    request: Request,
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
    request_id = new_request_id()
    check_auth_header(authorization)

    suffix = os.path.splitext(audio.filename or "audio.m4a")[1] or ".m4a"
    temp_path = temp_file_path(suffix)

    try:
        with timed_operation("save_upload", request_id):
            with open(temp_path, "wb") as file:
                file.write(await audio.read())

        audio_meta = validate_audio_file(temp_path)

        with timed_operation("asr_transcribe", request_id):
            asr_result = transcribe_file(temp_path, language=language)

        recognized_words = [
            {
                "word": word["word"],
                "startMs": word["startMs"],
                "endMs": word["endMs"],
                "confidence": word["confidence"],
            }
            for word in asr_result["words"]
        ]

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
            with timed_operation("alignment", request_id):
                aligned_words = align_with_edit_distance(
                    expected_map=expected_map,
                    recognized_words=recognized_words,
                )
        else:
            aligned_words = []

        ayah_scores = build_ayah_scores(aligned_words)
        weak_spots = build_weak_spots(ayah_scores)

        # Privacy: log counts only — never full transcript or API key.
        logger.info(
            "request_id=%s endpoint=/transcribe status=success duration=%.2f words=%s aligned=%s",
            request_id,
            audio_meta["durationSeconds"],
            len(recognized_words),
            len(aligned_words),
        )

        return {
            "fullText": asr_result["text"],
            "confidence": asr_result["confidence"],
            "isFinal": True,
            "meta": {
                "fromSurah": fromSurah,
                "fromAyah": fromAyah,
                "toSurah": toSurah,
                "toAyah": toAyah,
                "audio": audio_meta,
                "requestId": request_id,
                "engine": asr_result.get("engine", settings.engine),
            },
            "words": recognized_words,
            "alignedWords": aligned_words,
            "ayahScores": ayah_scores,
            "weakSpots": weak_spots,
        }

    finally:
        safe_remove(temp_path)


@app.websocket("/ws/live")
async def live_asr(websocket: WebSocket):
    await websocket.accept()

    pcm_buffer = bytearray()
    recent_pcm_buffers: deque[bytes] = deque(maxlen=6)

    m4a_chunks: deque[bytes] = deque(maxlen=4)
    all_m4a_chunks: List[bytes] = []

    language = "ar"
    sample_rate = 16000
    channels = 1
    bits_per_sample = 16

    last_transcribe_at = 0.0
    last_sequence = 0
    started_pcm = False
    started_m4a = False

    try:
        await websocket.send_json(
            {
                "type": "ready",
                "text": "",
                "confidence": 0.0,
                "words": [],
                "sequence": 0,
            }
        )

        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"] is not None:
                if not started_pcm:
                    continue

                chunk = message["bytes"]
                pcm_buffer.extend(chunk)
                recent_pcm_buffers.append(chunk)

                now = time.time()

                if now - last_transcribe_at < settings.live_min_interval_seconds:
                    continue

                last_transcribe_at = now

                recent_bytes = b"".join(recent_pcm_buffers)

                if len(recent_bytes) < sample_rate * 2:
                    continue

                wav_path = write_pcm_to_wav(
                    recent_bytes,
                    sample_rate=sample_rate,
                    channels=channels,
                    sample_width=max(1, bits_per_sample // 8),
                )

                try:
                    live_result = transcribe_file(wav_path, language=language)
                    text = live_result.get("text", "") or ""

                    if not text:
                        await websocket.send_json(
                            {
                                "type": "partial",
                                "text": "",
                                "confidence": 0.0,
                                "words": [],
                                "sequence": last_sequence,
                            }
                        )
                    else:
                        await websocket.send_json(
                            {
                                "type": "partial",
                                "text": text,
                                "confidence": live_result["confidence"],
                                "words": live_result["words"],
                                "sequence": last_sequence,
                            }
                        )
                except Exception as exc:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "error": str(exc),
                            "sequence": last_sequence,
                        }
                    )
                finally:
                    safe_remove(wav_path)

                continue

            if "text" not in message:
                continue

            try:
                payload = json.loads(message["text"])
            except json.JSONDecodeError:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": "Invalid JSON message",
                        "sequence": last_sequence,
                    }
                )
                continue

            msg_type = payload.get("type")
            last_sequence = int(payload.get("sequence", last_sequence))

            if msg_type == "startPcm":
                started_pcm = True
                started_m4a = False
                language = str(payload.get("language", "ar"))
                sample_rate = int(payload.get("sampleRate", 16000))
                channels = int(payload.get("channels", 1))
                bits_per_sample = int(payload.get("bitsPerSample", 16))

                pcm_buffer.clear()
                recent_pcm_buffers.clear()
                last_transcribe_at = 0.0

                await websocket.send_json(
                    {
                        "type": "partial",
                        "text": "",
                        "confidence": 0.0,
                        "words": [],
                        "sequence": last_sequence,
                    }
                )

            elif msg_type == "pcmMeta":
                last_sequence = int(payload.get("sequence", last_sequence))

            elif msg_type == "stopPcm":
                if pcm_buffer:
                    wav_path = write_pcm_to_wav(
                        bytes(pcm_buffer),
                        sample_rate=sample_rate,
                        channels=channels,
                        sample_width=max(1, bits_per_sample // 8),
                    )

                    try:
                        final_result = transcribe_file(wav_path, language=language)

                        await websocket.send_json(
                            {
                                "type": "final",
                                "text": final_result.get("text", "") or "",
                                "confidence": float(
                                    final_result.get("confidence", 0.0) or 0.0
                                ),
                                "words": final_result.get("words", []) or [],
                                "sequence": last_sequence,
                            }
                        )
                    except Exception as exc:
                        await websocket.send_json(
                            {
                                "type": "error",
                                "error": str(exc),
                                "sequence": last_sequence,
                            }
                        )
                    finally:
                        safe_remove(wav_path)
                else:
                    await websocket.send_json(
                        {
                            "type": "final",
                            "text": "",
                            "confidence": 0.0,
                            "words": [],
                            "sequence": last_sequence,
                        }
                    )

                break

            elif msg_type == "start":
                started_m4a = True
                started_pcm = False
                language = str(payload.get("language", "ar"))
                m4a_chunks.clear()
                all_m4a_chunks.clear()
                last_transcribe_at = 0.0

                await websocket.send_json(
                    {
                        "type": "partial",
                        "text": "",
                        "confidence": 0.0,
                        "words": [],
                        "sequence": last_sequence,
                    }
                )

            elif msg_type == "audioChunk":
                if not started_m4a:
                    continue

                data = payload.get("data", "")
                fmt = payload.get("format", "m4a")

                if not data:
                    continue

                try:
                    chunk = base64.b64decode(data)
                except Exception:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "error": "Invalid base64 audio chunk",
                            "sequence": last_sequence,
                        }
                    )
                    continue

                m4a_chunks.append(chunk)
                all_m4a_chunks.append(chunk)

                now = time.time()

                if now - last_transcribe_at < settings.live_min_interval_seconds:
                    continue

                last_transcribe_at = now

                # Prefer latest standalone m4a chunk (concat of containers is unreliable).
                suffix = ".m4a" if fmt == "m4a" else ".wav"
                temp_path = write_chunks_to_file([chunk], suffix=suffix)

                try:
                    live_result = transcribe_file(temp_path, language=language)
                    text = live_result.get("text", "") or ""

                    if not text:
                        await websocket.send_json(
                            {
                                "type": "partial",
                                "text": "",
                                "confidence": 0.0,
                                "words": [],
                                "sequence": last_sequence,
                            }
                        )
                    else:
                        await websocket.send_json(
                            {
                                "type": "partial",
                                "text": text,
                                "confidence": live_result["confidence"],
                                "words": live_result["words"],
                                "sequence": last_sequence,
                            }
                        )
                except Exception as exc:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "error": str(exc),
                            "sequence": last_sequence,
                        }
                    )
                finally:
                    safe_remove(temp_path)

            elif msg_type == "stop":
                if all_m4a_chunks:
                    texts: List[str] = []
                    words_out: List[dict] = []
                    confidences: List[float] = []

                    for chunk in all_m4a_chunks:
                        temp_path = write_chunks_to_file([chunk], suffix=".m4a")
                        try:
                            part = transcribe_file(temp_path, language=language)
                            if part.get("text"):
                                texts.append(part["text"])
                            words_out.extend(part.get("words", []) or [])
                            confidences.append(float(part.get("confidence", 0.0) or 0.0))
                        except Exception:
                            pass
                        finally:
                            safe_remove(temp_path)

                    await websocket.send_json(
                        {
                            "type": "final",
                            "text": " ".join(texts).strip(),
                            "confidence": (
                                sum(confidences) / len(confidences)
                                if confidences
                                else 0.0
                            ),
                            "words": words_out,
                            "sequence": last_sequence,
                        }
                    )
                else:
                    await websocket.send_json(
                        {
                            "type": "final",
                            "text": "",
                            "confidence": 0.0,
                            "words": [],
                            "sequence": last_sequence,
                        }
                    )

                break

    except WebSocketDisconnect:
        return
    except Exception as exc:
        try:
            await websocket.send_json(
                {
                    "type": "error",
                    "error": str(exc),
                    "sequence": last_sequence,
                }
            )
        except Exception:
            pass
