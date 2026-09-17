# 09 — القرآن والمصحف والصوت

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

## تأكيد سلامة هذه المهمة

مهمة التوثيق تكتب فقط تحت `docs/project-knowledge/`. **لم تُعدَّل** مصادر `public/data/quran*`, `public/fonts/qpc-v2`, ولا منطق عرض الآيات في هذه المهمة.

## المصحف — حقائق

| بند | قيمة | مصدر |
|---|---|---|
| Entry | `/mushaf` → `MushafReaderPage` → `NewMushafReader` | AppRoutes / pages/quran |
| Page count | **604** | `MUSHAF_PAGE_MAX`, `mushaf-604-integrity-gate`, 604 JSON files |
| Ayahs / words (بوابة) | 6236 / 83665 | integrity gate |
| نص الصفحات | `public/data/quran-v2/pages/page-XXX.json` QPC V2 | SOURCE.json |
| خطوط | `public/fonts/qpc-v2/` WOFF2 لكل صفحة | |
| Surah JSON | `public/data/quran/surah-*.json` | Tanzil عبر AlQuran Cloud (بيان) |
| Mapping | `madinah-604-v1` signature preset | sunnah-mushaf-signature-preset |

## ميزات القارئ

- تنقل صفحات، chrome، أوضاع تركيز، أسهم، scrubber، تفسير مرتبط، صوت قراء، آخر موضع (`quran-last-page` / page position storage)، كاش، إيماءات، مناطق آمنة — التفاصيل في `features/mushaf-reader/**` و`styles` quran/mushaf.
- تطبيع المراجع: `ayah-ref-normalize.ts` يمنع عرض رقم عالمي كرقم داخل السورة.

## Gates / قياس

- `test:mushaf-gates` / unit gates تحت `src/lib/__tests__/mushaf-*-gate.test.ts`.
- سكربتات `scripts/mushaf-madinah/` (measure/assert/visual).
- CI job `mushaf-gates` / measure حسب path-lane.
- `verify:ci` يدعم `--no-mushaf`.

## artifacts/mushafi

- مرجع تسميع/Hifz + ASR (Flutter) — `TASMEE3_INVENTORY.md`.
- **ممنوع الحذف.** دمج لاحق في سُنّة 1.1 وليس متجر 1.0.0 مستقل. `PLATFORMS.md`.
- لا يُضمَّن في binary 1.0.0.

## أداء / PRs

- إصلاحات أداء مصحف وُثقت في تقارير/بوابات على main عبر تاريخ الدمج — للتفاصيل راجع PRs المدمجة و`docs/mushaf/**`.
- أي PR مفتوح غير مدمج: **ليس** في main حتى يُدمج (Unknown قائمة حالية دون `gh pr list` إلزامي هنا؛ عند الحاجة شغّلgh).

## مخاطر

- عرض رقم آية خاطئ إن خُزّن global id — يُعالَج بالتطبيع في نقاط الاستهلاك.
- صور مصحف مدينة غير مرخّصة: ممنوعة عمدًا (`LICENSE_RISKS.md`).
- إعادة توزيع خط QPC تتطلب إذنًا مكتوبًا للمتجر.
