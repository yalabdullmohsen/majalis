#!/usr/bin/env python3
from pathlib import Path

REPLACEMENTS = [
    ("الثابt", "الثابت"),
    ("الاقtصad", "الاقتصاد"),
    ("مراعaة", "مراعاة"),
    ("المأmون", "المأمون"),
    ("القrآn", "القرآن"),
    ("القrآn", "القرآن"),
    ("يُذkّr", "يُذكّr"),
    ("ميسr", "ميسr"),
    ("الذهبi", "الذهبي"),
    ("الروaيات", "الروايات"),
]

def fix_text(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    text = text.replace("يُذكّr", "يُذكّr")
    text = text.replace("ميسr", "ميسr")
    return text

def main():
    for rel in [
        "scripts/r49-original-stories.ts",
        "src/lib/islamic-stories-seed.ts",
    ]:
        p = Path(__file__).resolve().parent.parent / rel
        if not p.exists():
            continue
        original = p.read_text(encoding="utf-8")
        fixed = fix_text(original)
        if fixed != original:
            p.write_text(fixed, encoding="utf-8")
            print(f"fixed: {p}")

if __name__ == "__main__":
    main()
