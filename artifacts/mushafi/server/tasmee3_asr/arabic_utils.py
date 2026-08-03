import re
from typing import List

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
