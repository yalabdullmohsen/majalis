# جرد الهيكلة الكبرى v7 — الحزمة A

تاريخ التوليد: **2026-08-07**

| الملف | الغرض |
|---|---|
| unused-exports.md | تصديرات بلا استخدام ظاهر |
| unused-files.md | ملفات لا يصلها استيراد من main.tsx |
| css-usage.md | أصناف CSS: مستخدم / مرة / ميت |
| duplicate-components.md | مرشّحو الدمج |
| route-map.md | مسارات ↔ views |
| deps-audit.md | اعتماديات |
| bundle-report.html | أكبر الأصول |

إعادة التوليد:

```bash
node artifacts/majalis/scripts/generate-codebase-inventory.mjs
```

**قرار:** `if: false` على Resolve PR conflicts — **غير موجود** في `.github/workflows/resolve-pr-conflicts.yml` (مُزال مسبقًا).

## الحزمة B

انظر [`architecture-target.md`](./architecture-target.md) — هيكل FSD + `pnpm --filter @workspace/majalis run verify:fsd-layers`.
