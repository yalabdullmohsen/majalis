#!/usr/bin/env python3
"""
سكربت تدقيق ألوان Hero/Banner — المجلس العلمي
يفحص:
  1. هل كل خلفيات Hero موحّدة على #18362A (elite-forest)
  2. WCAG contrast للنص الرئيسي والنصوص الفرعية فوق كل خلفية
"""
import re, sys
from pathlib import Path

BASE = Path(__file__).parent.parent / "artifacts/majalis/src"

# ── ثوابت WCAG ─────────────────────────────────────────────────
TARGET_BG_HEX = "#18362A"   # elite-forest — الخلفية المعيارية
LEGACY_BG_HEX = "#0E6E52"   # majalis-emerald — الخلفية القديمة (تحذير)
AA_NORMAL  = 4.5
AA_LARGE   = 3.0
AAA_NORMAL = 7.0

# ── محدِّدات Hero التي يجب أن تستخدم elite-forest ───────────────
HERO_SELECTORS = [
    ".ds-page-header",
    ".home-hero--v3",
    ".pt-hero",
    ".majalis-star-hero",
    ".uni-hero",
]


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(r: int, g: int, b: int) -> float:
    return (0.2126 * srgb_to_linear(r/255) +
            0.7152 * srgb_to_linear(g/255) +
            0.0722 * srgb_to_linear(b/255))


def contrast_ratio(l1: float, l2: float) -> float:
    bright, dark = max(l1, l2), min(l1, l2)
    return (bright + 0.05) / (dark + 0.05)


def hex_to_rgb(h: str):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c*2 for c in h)
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def blend_alpha(fg: tuple, alpha: float, bg: tuple) -> tuple:
    return tuple(int(fg[i]*alpha + bg[i]*(1-alpha)) for i in range(3))


def parse_rgba(s: str):
    """استخرج RGBA من نص مثل rgba(250,248,242,0.88) أو #FAF8F2"""
    m = re.search(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)', s)
    if m:
        r,g,b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        a = float(m.group(4)) if m.group(4) else 1.0
        return (r,g,b), a
    m2 = re.search(r'#([0-9a-fA-F]{3,6})', s)
    if m2:
        return hex_to_rgb(m2.group()), 1.0
    return None, None


def check_css_file(path: Path, warnings: list, errors: list):
    text = path.read_text(encoding="utf-8")
    rel  = path.relative_to(BASE.parent.parent)

    # 1. فحص خلفيات Hero المخالفة
    for sel in HERO_SELECTORS:
        # ابحث عن الـ selector في الملف
        pattern = re.compile(
            re.escape(sel) + r'\s*\{([^}]+)\}',
            re.DOTALL | re.MULTILINE
        )
        for m in pattern.finditer(text):
            body = m.group(1)
            # هل تحتوي على background يُشير للون القديم؟
            if LEGACY_BG_HEX.lower() in body.lower():
                errors.append(
                    f"[{rel}] {sel}: خلفية تستخدم اللون القديم {LEGACY_BG_HEX} "
                    f"بدلاً من {TARGET_BG_HEX}"
                )
            # هل تحتوي على gradient مخالف؟
            if "linear-gradient" in body and "majalis-emerald" in body:
                errors.append(
                    f"[{rel}] {sel}: يستخدم gradient بـ majalis-emerald بدلاً من elite-forest"
                )

    # 2. فحص WCAG لكل نص على خلفية داكنة
    bg_rgb = hex_to_rgb(TARGET_BG_HEX)
    L_bg   = relative_luminance(*bg_rgb)

    # استخرج أزواج (selector→color)
    pairs = re.finditer(
        r'(\.(?:ds-page-header|home-hero|pt-hero|majalis-star-hero)[^\s{]*)'
        r'[^{]*\{([^}]*color\s*:[^;}]+)[^}]*\}',
        text, re.DOTALL
    )
    for m in pairs:
        sel_name = m.group(1)
        decls    = m.group(2)
        # فقط خاصية color المستقلة — لا background-color ولا border-color
        colors_found = re.findall(r'(?<![a-zA-Z-])color\s*:\s*([^;]+)', decls)
        for col_str in colors_found:
            col_str = col_str.strip()
            if "var(" in col_str:
                continue  # تخطَّ tokens (صحيحة بالتعريف)
            rgb, alpha = parse_rgba(col_str)
            if rgb is None:
                continue
            if alpha < 1.0:
                effective = blend_alpha(rgb, alpha, bg_rgb)
            else:
                effective = rgb
            L_text = relative_luminance(*effective)
            cr = contrast_ratio(L_text, L_bg)
            if cr < AA_LARGE:
                errors.append(
                    f"[{rel}] {sel_name}: color '{col_str}' على {TARGET_BG_HEX} "
                    f"= {cr:.2f}:1 — فشل WCAG AA"
                )
            elif cr < AA_NORMAL:
                warnings.append(
                    f"[{rel}] {sel_name}: color '{col_str}' على {TARGET_BG_HEX} "
                    f"= {cr:.2f}:1 — AA للنص الكبير فقط"
                )


def main():
    warnings, errors = [], []

    css_files = list(BASE.rglob("*.css"))
    for f in sorted(css_files):
        if "node_modules" in str(f):
            continue
        check_css_file(f, warnings, errors)

    print("═══════════════════════════════════════════════")
    print("  تقرير تدقيق ألوان Hero — المجلس العلمي")
    print("═══════════════════════════════════════════════")

    if errors:
        print(f"\n❌ أخطاء ({len(errors)}):")
        for e in errors:
            print(f"  • {e}")
    else:
        print("\n✓ لا أخطاء")

    if warnings:
        print(f"\n⚠ تحذيرات ({len(warnings)}):")
        for w in warnings:
            print(f"  • {w}")
    else:
        print("✓ لا تحذيرات")

    print("\n═══ WCAG Reference ═══════════════════════════")
    bg_rgb = hex_to_rgb(TARGET_BG_HEX)
    L_bg   = relative_luminance(*bg_rgb)
    test_pairs = [
        ("أبيض #FFFFFF",              (255,255,255), 1.0),
        ("عاجي rgba(250,248,242,.88)",(250,248,242), 0.88),
        ("فاتح rgba(255,255,255,.82)",(255,255,255), 0.82),
        ("ذهبي فاتح #97A59F",         (151,165,159), 1.0),
    ]
    for label, rgb, alpha in test_pairs:
        effective = blend_alpha(rgb, alpha, bg_rgb) if alpha < 1 else rgb
        L = relative_luminance(*effective)
        cr = contrast_ratio(L, L_bg)
        grade = "AAA" if cr>=AAA_NORMAL else "AA" if cr>=AA_NORMAL else "AA-large" if cr>=AA_LARGE else "FAIL"
        print(f"  {label:35} → {cr:5.2f}:1  [{grade}]")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
