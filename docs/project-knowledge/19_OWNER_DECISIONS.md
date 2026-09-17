# 19 — قرارات المالك (لا يقررها الوكيل تلقائيًا)

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

| قرار | خلفية | خيارات (بلا ترجيح من الوكيل) | أثر | ما ينقص للحسم |
|---|---|---|---|---|
| طريقة مواقيت الصلاة الافتراضية | Kuwait الآن في prefs | إبقاء / تغيير لطريقة أخرى | تغيّر الأوقات لكل المستخدمين | قرار فقهي/تشغيلي مالك + اختبار جهاز |
| تراخيص الأذان والتلاوات | LICENSE_RISKS unresolved | ترخيص / إزالة / استبدال | متجر وقانون | عقود/إذن مكتوب |
| Bundle ID `com.yousef.majlisilm` | Capacitor | إبقاء / تغيير | هوية متجر | حساب Apple + إعادة توقيع |
| حذف بيانات Supabase / purge fiqh_council | SQL جاهز في المستودع | تنفيذ / تأجيل | فقدان بيانات | نسخة احتياطية + موافقة |
| تغيير نصوص/مصادر شرعية | حوكمة محتوى | قبول مصدر / رفض | ثقة دينية | مصدر معتمد |
| سياسة النشر main vs production | تعارض وثائق | توحيد على main / تفعيل production branch | مسار الإطلاق | قرار مالك + ضبط Vercel |
| Production branch في Vercel | DEPLOYMENT.md خطوة يدوية | main / production | أي فرع ينشر الحي | لوحة Vercel |
| App Store identity / signing | TestFlight workflows | — | إصدار أصلي | شهادات مالك |
| RLS / roles / MFA | REQUIRES_EXPLICIT_APPROVAL | تفعيل إعدادات Auth | أمن | لوحة Supabase |
| إضافة analytics/tracking | قرارات معلّقة | إضافة / رفض | خصوصية | موافقة صريحة |
| Runtime schema migrations flag | محظور | يبقى مطفأ | أمن | لا تفعيل |
| PAT GitHub توسيع | موافقة | إبقاء GITHUB_TOKEN | أمن | — |
| حذف منصات مجمّدة | PLATFORMS شروط | حذف بعد snapshot+TestFlight | تقليل ضوضاء | شروط PLATFORMS |

المصادر: `docs/REQUIRES_EXPLICIT_APPROVAL.md`, `LICENSE_RISKS.md`, `DEPLOYMENT.md`, `PLATFORMS.md`, `DECISIONS_PENDING.md`, Capacitor config.
