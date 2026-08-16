# جولة سلامة — استكمال P1/P2 (جرد الأحكام + المجمع + الحذف)

فرع: `fix/integrity-round-rulings-inventory-p2`  
أساس الإنتاج عند البدء: `6f19e7b90` (Empty State الأحكام + مصادر المكتبة + SSR التواصل).

## P0 (مؤكد حيًا — بلا إعادة بناء)

| فحص | نتيجة |
|---|---|
| أحكام encyclopedia | total 147 · pending_review 147 · publicEligible **0** |
| `/rulings` | Empty State صادقة |
| عيّنة `/rulings/:id` | **404** · بلا `pending_review` في HTML |
| sitemap/search أحكام تفصيل | **0** |

## P1 — Full Rulings Route Inventory

- سكربت: `artifacts/majalis/scripts/audit-rulings-route-inventory.mjs`
- تقرير: `reports/rulings-route-inventory.json`
- HTTP على الإنتاج (`MAJLIS_AUDIT_BASE_URL=https://majlisilm.com`): **147/147 → 404**، صفر 200 للمنشور غير العام، صفر في sitemap/search/prerender.

## P1 — مصادر الكتب / التواصل

لم تُعدَّل سياسة النشر؛ فحوصات الانحدار السابقة ما زالت في `test:round-integrity-p0`.

## P2 — المجمع الفقهي (مطابقة المصدر الرسمي)

اختبار حي لصفحات IIFA الأربع (بعد إزالة علامات الاتجاه Unicode من HTML):

| slug | قرار | المصدر | ok |
|---|---|---|---|
| items-cultured-meat | 265 (10/26) | iifa …/56053 | ✓ |
| items-gmo-animal-foods | 266 (11/26) | …/56054 | ✓ |
| items-encrypted-digital-currencies | 237 (24/8) | …/5192 | ✓ |
| items-smart-contracts | 230 (24/1) | …/5211 | ✓ |

**لا تعديل بيانات** — validation فقط.

## P2 — حذف الحساب / الخصوصية / التلاوة

| بند | الحالة |
|---|---|
| `POST /api/account/delete` بلا JWT | 401 |
| JWT باطل | 401 |
| GET | 405 |
| `admin.deleteUser` في الكود | ✓ |
| مسح محلي + logout بعد النجاح | ✓ |
| نص «الفتاوى المنشورة» | غير موجود |
| CASCADE للجداول في DB الحي | **غير مُثبت** (يحتاج حساب اختبار) |
| عدم رفع الصوت لخوادم Majlisilm أثناء التلاوة | **غير مُثبت شبكيًا** |
| وصف التلاوة | يحدّد مطابقة كلمات / إغفال / زيادة؛ ينفي مخارج كاملة |

## زحف مسارات حرجة

`scripts/audit-critical-routes-http.mjs` → `reports/critical-routes-http-audit.json`

## ما لم يُثبت في هذه الدفعة

- Lighthouse Mobile / axe / Playwright على أجهزة حقيقية / TestFlight
- حذف حساب حي end-to-end ضد Supabase
- زحف 100% لكل مسارات الموقع الديناميكية خارج الأحكام + عيّنة sitemap

## أوامر

```bash
pnpm --filter @workspace/majalis run test:round-integrity-p0
pnpm --filter @workspace/majalis run test:round-integrity-p1
MAJLIS_AUDIT_BASE_URL=https://majlisilm.com node artifacts/majalis/scripts/audit-rulings-route-inventory.mjs
MAJLIS_AUDIT_BASE_URL=https://majlisilm.com node artifacts/majalis/scripts/audit-critical-routes-http.mjs
pnpm run verify:ci
```
