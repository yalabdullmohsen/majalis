#!/usr/bin/env python3
from pathlib import Path

# Latin-corruption fixes (Arabic + stray latin letters)
REPLACEMENTS = [
    ("\u0627\u0644\u062b\u0627\u0628t", "\u0627\u0644\u062b\u0627\u0628\u062a"),
    ("\u0627\u0644\u0627\u0642t\u0635ad", "\u0627\u0644\u0627\u0642\u062a\u0635\u0627\u062f"),
    ("\u0645\u0631\u0627\u0639a\u0629", "\u0645\u0631\u0627\u0639\u0627\u0629"),
    ("\u0627\u0644\u0645\u0623m\u0648\u0646", "\u0627\u0644\u0645\u0623\u0645\u0648\u0646"),
    ("\u0627\u0644\u0642r\u0622n", "\u0627\u0644\u0642\u0631\u0622\u0646"),
    ("\u064a\u064f\u0630k\u0651r", "\u064a\u064f\u0630\u0643\u0651\u0631"),
    ("\u0645\u064a\u0633r", "\u0645\u064a\u0633\u0631"),
    ("\u0627\u0644\u0630\u0647\u0628i", "\u0627\u0644\u0630\u0647\u0628\u064a"),
    ("\u0627\u0644\u0631\u0648a\u064a\u0627\u062a", "\u0627\u0644\u0631\u0648\u0627\u064a\u0627\u062a"),
]

def fix_text(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    return text

def replace_r49_stories(seed_path: Path, block_path: Path) -> None:
    seed = seed_path.read_text(encoding="utf-8")
    block = block_path.read_text(encoding="utf-8").strip()
    start_marker = "/* ───────── جولة ٤٩: قصص (116-119) ───────── */"
    end_marker = "\n];"
    start = seed.find(start_marker)
    if start == -1:
        raise SystemExit(f"start marker not found in {seed_path}")
    end = seed.find(end_marker, start)
    if end == -1:
        raise SystemExit(f"end marker not found in {seed_path}")
    new_seed = seed[:start] + block + "\n\n" + seed[end:]
    seed_path.write_text(fix_text(new_seed), encoding="utf-8")
    print(f"replaced stories block in {seed_path}")

def main():
    root = Path(__file__).resolve().parent.parent
    replace_r49_stories(
        root / "src/lib/islamic-stories-seed.ts",
        root / "scripts/r49-original-stories.ts",
    )
    for rel in ["scripts/r49-original-stories.ts", "src/lib/islamic-stories-seed.ts"]:
        p = root / rel
        original = p.read_text(encoding="utf-8")
        fixed = fix_text(original)
        if fixed != original:
            p.write_text(fixed, encoding="utf-8")
            print(f"extra fixes: {p}")

if __name__ == "__main__":
    main()
