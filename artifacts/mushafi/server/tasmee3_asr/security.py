import time
from collections import defaultdict, deque
from typing import Optional

from fastapi import Header, HTTPException, Request

from settings import settings

_request_log: dict[str, deque[float]] = defaultdict(deque)


def check_auth_header(authorization: Optional[str]):
    if not settings.api_key:
        return

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    expected = f"Bearer {settings.api_key}"

    if authorization != expected:
        raise HTTPException(status_code=403, detail="Invalid API key")


def client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")

    if forwarded:
        return forwarded.split(",")[0].strip()

    if request.client:
        return request.client.host

    return "unknown"


def check_rate_limit(request: Request):
    limit = settings.rate_limit_per_minute

    if limit <= 0:
        return

    key = client_key(request)
    now = time.time()
    window_start = now - 60

    entries = _request_log[key]

    while entries and entries[0] < window_start:
        entries.popleft()

    if len(entries) >= limit:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
        )

    entries.append(now)
