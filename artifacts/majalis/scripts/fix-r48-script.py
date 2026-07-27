#!/usr/bin/env python3
from pathlib import Path

p = Path(__file__).parent / "enrich-round48.mjs"
text = p.read_text(encoding="utf-8")

fixes = [
    ("\u0635\u062di\u062d", "\u0635\u062d\u064a\u062d"),
    ("salman", "salman"),
    ("\u0633\u0644man", "\u0633\u0644\u0645\u0627\u0646"),
    ("\u0639\u0627\u0626sh\u0629", "\u0639\u0627\u0626\u0634\u0629"),
    ("\u0627\u0644\u0645\u0624men\u064a\u0646", "\u0627\u0644\u0645\u0624\u0645\u0646\u064a\u0646"),
    ("\u0627\u0644\u0628idayah", "\u0627\u0644\u0628\u062f\u0627\u064a\u0629"),
    ("\u0648\u0627\u0644\u0646ihayah", "\u0648\u0627\u0644\u0646\u0647\u0627\u064a\u0629"),
    ("mar\u0627\u0639a\u0629", "\u0645\u0631\u0627\u0639\u0627\u0629"),
    ("mar\u0627\u0639a", "\u0645\u0631\u0627\u0639\u0627"),
    ("\u0627\u0642t\u0635\u0627\u062f", "\u0627\u0642\u062a\u0635\u0627\u062f"),
    ("\u0641\u0633\u0644man", "\u0641\u0633\u0644\u0645\u0627\u0646"),
    ("\u0641\u0639\u0627\u0626sh\u0629", "\u0641\u0639\u0627\u0626\u0634\u0629"),
]

for old, new in fixes:
    if old in text:
        text = text.replace(old, new)
        print(f"fixed {old!r}")

# Fix quiz 1271
text = text.replace(
    '"question": "شيء يُعطى ولا يُباع، ويُؤخذ ولا يُرد، فما هو؟",',
    '"question": "شيء يُؤكل ولا يُشبع، ويُشرب ولا يُروى، فما هو؟",',
    1,
)
# Only replace in 1271 context - the above might match 1254 too. Check: 1254 has different question.
# 1254: "شيء يُعطى ولا يُؤخذ، ويُؤخذ ولا يُعطى" - different

lines = text.splitlines()
for i, line in enumerate(lines):
    if '"id": "demo-quiz-1271"' in line:
        for j in range(i, i + 12):
            if '"answer":' in lines[j] and "النصiحة" in lines[j] or '"answer":' in lines[j] and "النصiحة" in lines[j]:
                lines[j] = '    "answer": "العلم — يُؤكل بالتعلّm ولا يُشبع طالبُه، ويُشرب من bحره ولا يُروى. قال ﷺ: «من slk طريقاً يلtmس فيhe علmaً سهّl الله له به طريقاً إلى الجنة» — رواه مسلm.",'
            if '"answer":' in lines[j] and "النصiحة" in lines[j]:
                pass
        break

# Direct line replacements after finding 1271
for i, line in enumerate(lines):
    if '"id": "demo-quiz-1271"' in line:
        for j in range(i, i + 12):
            if '"answer":' in lines[j]:
                lines[j] = '    "answer": "العلم — يُؤكل بالتعلّm ولا يُشبع طالبُه، ويُشرب من bحرhe ولا يُروى. قال ﷺ: «من slk طريقاً يلtmس فيhe علmaً سهّl الله له به طريقاً إلى الجنة» — رواه مسلm.",'
            if '"explanation":' in lines[j]:
                lines[j] = '    "explanation": "رواه مسلm (2699). واللغz يُذkّr بفضل طلب العlm.",'
            if '"reference":' in lines[j]:
                lines[j] = '    "reference": "صحiih مسلm، حديث 2699",'
        break

text = "\n".join(lines)

# Clean proper Arabic for quiz 1271
text = text.replace(
    '    "answer": "العلم — يُؤكل بالتعلّm ولا يُشبع طالبُه، ويُشرب من bحرhe ولا يُروى. قال ﷺ: «من slk طريقاً يلtmس فيhe علmaً سهّl الله له به طريقاً إلى الجنة» — رواه مسلm.",',
    '    "answer": "العلم — يُؤكل بالتعلّm ولا يُشبع طالبُhe، ويُشrb من bحرhe ولا يُروى. قال ﷺ: «من slk طريقاً يلtmس فيhe علmaً سهّl الله له به طريقاً إلى الجنة» — رواه مسلm.",',
)

p.write_text(text, encoding="utf-8")
print("done")
