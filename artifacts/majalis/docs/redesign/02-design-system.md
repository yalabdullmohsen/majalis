# Checkpoint 2 — Islamic Geometric Design System (Tokens)

## الملفات
- `src/styles/igds/tokens.css` — primitives + semantic light/dark + جسر aliases للرموز القديمة
- `src/styles/igds/foundation.css` — containers, geo-wash خفيف, cluster/stack, reduced-motion

## اتجاه الألوان
| دور | قيمة دلالية |
|-----|-------------|
| Deep Emerald | `--igds-em-800` → brand |
| Warm Ivory | `--igds-ivory-100` → bg |
| Sage | `--igds-sage-*` → دعم ثانوي |
| Charcoal Green | `--igds-charcoal` → نص |
| Soft Gold | `--igds-gold-400` → accent فقط |
| Warm Gray | `--igds-warm-*` → نص ثانوي/حدود |

## RTL
الرموز لا تفترض اتجاهًا؛ الطبقة foundation تستخدم `margin-inline` / `padding-inline`.

## Light/Dark
`html[data-theme="dark"]` يعيد تعريف الدلالة؛ الجسر يحدّث `--color-*` / `--bg` إلخ.

## التحميل
يُستورد في `main.tsx` مباشرة بعد `brand-v4.css`.

لإبقاء ميزانية CSS الحرج ≤505KB: أُجّلت `patterns.css` و`majalis-v2.css` و`modern-2026.css`
عبر `void import(...)` بعد الإقلاع (ما زالت تُحمَّل، خارج `index-*.css` الحرج).
