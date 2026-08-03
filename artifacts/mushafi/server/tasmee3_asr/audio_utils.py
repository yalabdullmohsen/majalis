import os
import subprocess
import tempfile
import wave
from typing import List

from fastapi import HTTPException

from settings import settings


def temp_file_path(suffix: str) -> str:
    if settings.temp_dir:
        os.makedirs(settings.temp_dir, exist_ok=True)

        temp = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
            dir=settings.temp_dir,
        )
    else:
        temp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)

    path = temp.name
    temp.close()
    return path


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


def validate_audio_file(path: str):
    file_size = os.path.getsize(path)

    if file_size < settings.min_audio_bytes:
        raise HTTPException(
            status_code=400,
            detail="Audio file is too small or empty",
        )

    if file_size > settings.max_audio_bytes:
        raise HTTPException(
            status_code=413,
            detail="Audio file is too large",
        )

    duration = get_audio_duration_seconds(path)

    if duration > 0 and duration < settings.min_audio_duration_seconds:
        raise HTTPException(
            status_code=400,
            detail="Audio duration is too short",
        )

    if duration > settings.max_audio_duration_seconds:
        raise HTTPException(
            status_code=413,
            detail="Audio duration is too long",
        )

    return {
        "durationSeconds": duration,
        "fileSizeBytes": file_size,
    }


def write_chunks_to_file(chunks: List[bytes], suffix: str = ".m4a") -> str:
    path = temp_file_path(suffix)

    with open(path, "wb") as file:
        for chunk in chunks:
            file.write(chunk)

    return path


def write_pcm_to_wav(
    pcm_bytes: bytes,
    sample_rate: int = 16000,
    channels: int = 1,
    sample_width: int = 2,
) -> str:
    path = temp_file_path(".wav")

    with wave.open(path, "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_bytes)

    return path


def safe_remove(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass
