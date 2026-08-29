# نظام الصيانة والتحديث التلقائي — Majlisilm

## الهدف
مراقبة دورية للجودة والأمن والكاش والبيانات، مع إصلاح آمن محدود، وفتح PR واضح، ودمج/نشر فقط بعد نجاح الفحوصات.

## ماذا أصبح تلقائيًا
- مسح نصف يومي (GitHub Actions: `Auto Maintenance`) لـ:
  - عقد الكاش (`version.json` / `sw.js` / `sw-version.js`)
  - أسرار ظاهرة في الملفات المتتبَّعة
  - ملخص `pnpm audit`
  - نظافة بنيوية لبيانات عامة (روابط فارغة…)
  - فحص إنتاج `/version.json` (اختياري شبكة)
- توليد تقرير في `reports/auto-maintenance/`
- دمج منخفض الخطورة عبر منظومة `safe-auto-merge` الحالية بعد **Verify build**
- نشر الإنتاج عبر Vercel + `auto-deploy` مع مطابقة `version.json`

## ما لا يجب أن يكون تلقائيًا
- تعديل نص قرآن / حديث / فتوى / تفسير بدون مصدر موثوق
- حذف محتوى شرعي أو علمي
- ترقية major للاعتماديات
- تغييرات auth / RLS / migrations / Capacitor native عالية الخطورة

## ما يحتاج موافقة بشرية
- أي PR بوسم `needs-content-review` أو `risky:manual-review`
- تصحيح معلومات شرعية (المعلومة الحالية + سبب الاشتباه + المصدر + التعديل المقترح)
- تغييرات UX تمس الهوية البصرية جذريًا

## تشغيل يدوي
```bash
# مسح محلي (مع شبكة)
pnpm run auto:maintenance

# بدون شبكة
pnpm run auto:maintenance:offline

# اختبار السياسة
pnpm run test:auto-maintenance
```

## صيغة فروع الإصلاح التلقائي
`auto/fix-YYYY-MM-DD-summary`

عنوان مقترح: `fix(auto): إصلاح أخطاء مكتشفة تلقائيًا`

يجب أن يحتوي جسم الـPR على: المشكلة · السبب · الملفات · الاختبارات · المخاطر.

## الدمج والنشر
1. فحوصات خضراء (Verify build + repo-gates حسب المسار)
2. لا مسارات danger غير مستثناة
3. لا تعديل شرعي حساس بدون مراجعة
4. Auto-merge squash → `main` → Vercel Production → تطابق `/version.json`

## علاقة بالأنظمة الحالية
| نظام | الدور |
|---|---|
| `verify:ci` / CI | بوابة قبل الدفع والدمج |
| `safe-auto-merge` | سياسة الدمج الآمن |
| `auto-deploy` | التحقق بعد النشر |
| `scheduled-release-train` | قطار إصدارات نصف يومي |
| `content-runner` | مسار محتوى منفصل (لا يُدمج هنا عشوائيًا) |
| `useVersionCheck` + SW | منع الكاش القديم عند المستخدم |

## الوسوم
- `maintenance-safe` / `safe:auto-merge` — صيانة منخفضة الخطورة
- `needs-content-review` — محتوى شرعي/علمي يحتاج مراجعة
- `risky:manual-review` — خطر عام
- `blocked:danger-path` — مسار خطر
