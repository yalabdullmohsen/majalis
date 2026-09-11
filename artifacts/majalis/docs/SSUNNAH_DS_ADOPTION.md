# ترحيل Design System — سُنّة (موجز تشغيلي)

مرجع الهجرة فوق النظام المقفول. التثبيت الكامل: `SSUNNAH_DESIGN_SYSTEM.md`.

## Canonical tokens

`src/styles/ssunnah-ds-canonical.css` — أسماء `--ds-*` فوق `--mj-*` / `--ss-*`.

لا hex في الشاشات أو `components/design-system`.

## طبقة التبني

`modern-ui-refresh.css` بعد `ssunnah-ds-canonical.css` في `main.tsx`:

- بطاقات أخف وحدود شفافة
- Segmented filters
- Heroes أقصر
- Reader blocks
- Settings list
- تخفيف FloatingBack دون حذف المسارات بعد

## المكوّنات الرسمية

SettingsList · ActionButton · AppCard/FeatureCard/ContentCard · Screen patterns · SegmentedFilter

## الحوكمة

- `ssunnah-ds-governance-gate.test.ts`
- `modern-ui-refresh-gate.test.ts`
- `ssunnah-design-system-lockdown-gate.test.ts` (مستويات + allowlist + لقطات)
- `pnpm run test:ds-coverage` → `docs/SSUNNAH_DS_COVERAGE.json`

## استثناءات موثّقة

- سطح المصحف/الآية (`data-scripture`) — لا تغيير توزيع النص الشرعي
- Allowlist ESLint للهجرة التدريجية فقط

## شاشة جديدة

1. اتبع مستويات `SSUNNAH_DESIGN_SYSTEM.md`
2. Tokens + مكوّنات DS فقط
3. لا FloatingBackButton
4. بوابات soft-cards + governance + typography قبل الدفع
