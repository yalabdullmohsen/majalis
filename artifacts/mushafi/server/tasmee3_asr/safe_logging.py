import logging
import time
import uuid
from contextlib import contextmanager

from settings import settings


def configure_logging():
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


logger = logging.getLogger("tasmee3_asr")


def new_request_id() -> str:
    return uuid.uuid4().hex[:12]


@contextmanager
def timed_operation(name: str, request_id: str):
    start = time.time()

    logger.info("request_id=%s operation=%s status=start", request_id, name)

    try:
        yield
        duration_ms = int((time.time() - start) * 1000)
        logger.info(
            "request_id=%s operation=%s status=success duration_ms=%s",
            request_id,
            name,
            duration_ms,
        )
    except Exception:
        duration_ms = int((time.time() - start) * 1000)
        logger.exception(
            "request_id=%s operation=%s status=error duration_ms=%s",
            request_id,
            name,
            duration_ms,
        )
        raise
