# توحيد المصحف: الموقع (majalis) والتطبيق (mushafi)

هدف هذا الملف: توضيح ما هو **مشترك فعلاً** بين مصحف majlisilm.com وتطبيق مصحفي، وما يبقى منفصلًا عمدًا.

## ما لا يُدّعى

- التطبيق Flutter **لا يعمل داخل** الموقع، والموقع React/QPC **ليس** نفس محرّك Flutter.
- لا يوجد عرض بكسل-ببكسل موحّد بين المنصتين.
- نص القرآن لا يُولَّد ولا يُصحَّح بالذكاء الاصطناعي على أي من المنصتين.

## ما هو موحّد

| الطبقة | المصدر | الاستهلاك |
|---|---|---|
| حدود 604 صفحة (سورة/آية من→إلى) + جزء/حزب/ربع | `artifacts/majalis/public/data/quran/pages-manifest.json` + `page-juz-index.json` | يُزامَن إلى `artifacts/mushafi/assets/quran/quran_page_metadata.json` |
| مسارات عميقة | انظر أدناه | الويب + GoRouter في مصحفي |
| ورق القراءة الدافئ | `#FAF7F2` حبر `#2C2C2E` | `AYAH_MUSHAF_*` (ويب) و`MushafColors` / ثيم sepia (Flutter) |
| الطبعة المرجعية | مصحف المدينة، حفص عن عاصم | صفحة `/mushaf/about-edition` + ملاحظة الخصوصية في التطبيق |

### مزامنة حدود الصفحات

من جذر المستودع:

```bash
node scripts/sync-mushaf-page-metadata.mjs          # كتابة
node scripts/sync-mushaf-page-metadata.mjs --check  # بوابة CI
```

بعد أي تغيير على `pages-manifest.json` أو `page-juz-index.json` شغّل السكربت ثم أدرج ملف Flutter.

### مسارات عميقة مشتركة

| المسار | المعنى |
|---|---|
| `/mushaf` | فتح القارئ (استئناف محلي إن وُجد) |
| `/mushaf/page/:n` | صفحة رقم `n` (1…604) |
| `/mushaf/:surah` | أول صفحة للسورة |
| `/mushaf/:surah?ayah=k` | صفحة الآية `k` من السورة |
| `/mushaf/about-edition` | طبعة المصحف (ويب فقط حاليًا) |
| `/mushaf-home` | لوحة المصحف في التطبيق (Flutter فقط) |

## ما يبقى مختلفًا

| | الموقع | التطبيق |
|---|---|---|
| محرّك العرض | QPC V2 (تخطيط سطري مطبق) | بناء صفحات من نص عثماني + metadata |
| هوية الواجهة | زمردي / نظام majalis | عاجي/ذهبي مصحفي حول مساحة القراءة |
| التسميع والختمة المتقدمة | جزئي / مسارات أخرى | ميزة رئيسية في Flutter |
| الصوت والتنزيلات | حسب تفضيلات الويب | شاشات تنزيل/قراء داخل التطبيق |

## بوابة الجودة

- CI: `node scripts/sync-mushaf-page-metadata.mjs --check` ضمن فحوص المولَّدات.
- Flutter: `dart run scripts/check_quran_asset.dart` (يتوقع 604 صفحة في metadata).
