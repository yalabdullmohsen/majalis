import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ServerSettings:
    api_key: str
    model_name: str
    device: str
    engine: str
    low_confidence_threshold: float
    min_audio_bytes: int
    max_audio_bytes: int
    min_audio_duration_seconds: float
    max_audio_duration_seconds: float
    live_min_interval_seconds: float
    rate_limit_per_minute: int
    temp_dir: str
    log_level: str

    @staticmethod
    def from_env() -> "ServerSettings":
        return ServerSettings(
            api_key=os.getenv("TASMEE3_ASR_API_KEY", ""),
            model_name=os.getenv("TASMEE3_ASR_MODEL", "small"),
            device=os.getenv("TASMEE3_ASR_DEVICE", "cpu"),
            engine=os.getenv("TASMEE3_ASR_ENGINE", "whisper_timestamped"),
            low_confidence_threshold=float(
                os.getenv("TASMEE3_LOW_CONFIDENCE", "0.55")
            ),
            min_audio_bytes=int(os.getenv("TASMEE3_MIN_AUDIO_BYTES", "1200")),
            max_audio_bytes=int(os.getenv("TASMEE3_MAX_AUDIO_BYTES", "25000000")),
            min_audio_duration_seconds=float(
                os.getenv("TASMEE3_MIN_AUDIO_DURATION_SECONDS", "1.2")
            ),
            max_audio_duration_seconds=float(
                os.getenv("TASMEE3_MAX_AUDIO_DURATION_SECONDS", "180")
            ),
            live_min_interval_seconds=float(
                os.getenv("TASMEE3_LIVE_MIN_INTERVAL", "2.5")
            ),
            rate_limit_per_minute=int(
                os.getenv("TASMEE3_RATE_LIMIT_PER_MINUTE", "60")
            ),
            temp_dir=os.getenv("TASMEE3_TEMP_DIR", ""),
            log_level=os.getenv("TASMEE3_LOG_LEVEL", "INFO"),
        )


settings = ServerSettings.from_env()
