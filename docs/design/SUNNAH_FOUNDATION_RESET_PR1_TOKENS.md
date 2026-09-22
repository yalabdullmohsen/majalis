# SUNNAH FOUNDATION RESET — PR-1 Tokens + Typography + Density

**تاريخ:** 2026-09-22  
**أساس:** PR-0 `docs/design/SUNNAH_FOUNDATION_RESET_PR0_BASELINE.md`  
**نطاق:** مصدر حقيقة واحد فقط — بلا هجرة شاشات · بلا تعديل مصحف/حديث/أقسام/هيدر/Bottom Nav/عائم.

## مصدر الحقيقة

| المجال | الملف |
|---|---|
| CSS | `artifacts/majalis/src/styles/sunnah-foundation-tokens.css` (`--sf-*`) |
| TypeScript | `artifacts/majalis/src/lib/sunnah-foundation-tokens.ts` (`SunnahFoundationTokens`) |
| تحميل | `main.tsx` بعد `theme.css` وقبل `brand-v4` |

## اللوحة (خمسة فقط)

Warm Ivory · Deep Emerald · Quran Gold · Rich Ink · Luxury Night

## Typography

- **Display Arabic** (`--sf-font-display`): الشعار والعناوين المميزة
- **UI Arabic** (`--sf-font-ui`): التنقل · الأزرار · البطاقات · البحث · القوائم
- زخرفي (`--sf-font-ornament`): لحظات عرض فقط — ممنوع في تشغيل UI

السلم الواحد: Display · PageTitle · SectionTitle · CardTitle · Body · Supporting · Metadata · Caption

## Density

| الوضع | الاستخدام |
|---|---|
| COMPACT | Navigation · Filters · Lists |
| STANDARD | Pages · Cards |
| READING | Long content · Articles · Scientific (`comfortable` = alias) |

`html[data-density="…"]`

## الأنظمة المتعارضة → LEGACY_NON_SOT

أُزيلت **كدَور مصدر حقيقة** (ليست محذوفة من التشغيل بعد):

- `brand-v4.css`
- `green-surface-system.css`
- `final-release.css`
- `visual-identity-unify.css`

V2 و`typography-scale` أصبحتا جسر `var(--sf-*)` — بلا Design System رابعة.

## الحمايات

- `src/lib/__tests__/sunnah-foundation-reset-pr1-gate.test.ts`
- `scripts/lint-sunnah-foundation-tokens.mjs`

## ما لن يفعله PR-1

- لا تعديل شاشات / مصحف / حديث / فقه / هيدر / Bottom Nav / Floating
- لا حذف ملفات LEGACY التشغيلية (→ PR-13)
- لا إعلان `SUNNAH_FOUNDATION_REBUILD_COMPLETE`
