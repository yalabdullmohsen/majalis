# خريطة بيانات الخصوصية — سُنّة (جرد كود 2026-08-08)

لتعبئة بطاقات App Store / Play Data safety **بدون تخمين**.  
آلية الحذف في التطبيق: `/account-deletion` → `POST /api/account/delete` → `auth.admin.deleteUser` (يعتمد `ON DELETE CASCADE` على الجداول المرتبطة بـ `auth.users`).

**Sentry / تحليلات طرف ثالث:** غير موجود حالياً في الحزمة.

## سحابة (Supabase)

| الفئة | التخزين | الغرض | عند حذف الحساب |
|---|---|---|---|
| هوية | `auth.users` | بريد/جلسة | نعم |
| ملف شخصي | `profiles` | اسم/دور | نعم (CASCADE متوقع) |
| إشارات | `bookmarks` | مفضلات | نعم |
| تقييمات | `content_ratings` | نجوم | نعم |
| تكرار متباعد | `flashcard_reviews` / `sr_*` | بطاقات حفظ | نعم |
| تقدّم قراءة | `reading_resume` / `reading_progress` | استئناف | نعم |
| إنجازات | `achievements` | شارات | نعم |
| تفضيلات رئيسية | `user_homepage_prefs` | تخطيط | نعم |
| مسارات تعلم | `path_enrollments`, `lp_*` | تقدّم مسارات | نعم |
| اختبارات | `assessment_attempts`, `quiz_attempts` | نتائج | نعم |
| جلسات دراسة | `study_sessions` | وقت الدراسة | نعم |
| خطط كتب | `book_reading_plans` | خطط | نعم |
| تسميع AI (ويب) | `recitation_*` | إعدادات/جلسات اختبار | نعم |
| اقتباسات/باحث | `user_citations`, `researcher_profiles`, … | أدوات بحث | نعم / راجع FK |
| أحداث سلوك/توصيات | `user_behavior_events`, … | توصيات | نعم (CASCADE) |
| اشتراكات دفع | `push_subscriptions` | Web/Capacitor push | **غير مؤكد** (غالباً بلا `user_id`) |
| سجلات أخطاء/عرض | `client_error_logs`, `content_views`, … | تشخيص/إحصاء | **غير مؤكد** (`SET NULL` محتمل) |
| طلبات دعوة | `dawah_contact_requests` | تواصل | **غير مؤكد** |

## محلي (الجهاز / المتصفح)

| الفئة | مفتاح / موضع | الغرض | عند حذف الحساب |
|---|---|---|---|
| موافقة كوكيز | `majalis-cookie-consent-v1` | ضروري/تفضيلات/تحليلات | محلي فقط |
| إعدادات مستخدم | `majalis-user-settings-v1` | إشعارات/اهتزاز | يُمسح في مسار الحذف |
| ثيم/خط/مصحف | `majalis-theme`, تفضيلات مصحف، … | واجهة | محلي — مسح جزئي |
| قرآن شخصي | إشارات/ملاحظات/ختمة محلية | قراءة | مسح جزئي في الحذف |
| تقدّم/سلسلة | `majalis-*-progress*`, streak | محلي | محلي |
| موقع صلاة | محافظة/أذان | مواقيت | محلي |
| تفضيلات الأذان | `majalis-adhan-prefs-v1` | مؤذن/صيغة/صوت/اهتزاز لكل صلاة | يُمسح مع `majalis-*` عند الحذف |
| سلسلة مقاطع iOS (جلسة) | `sessionStorage` (`majalis-adhan-ios-chain-v1` / resume) | جدولة/إلغاء مقاطع الإشعار | جلسة فقط |
| تنزيل أذان كامل (اختياري) | Cache API `majalis-adhan-full-v1` + `majalis-adhan-full-meta-v1` | نسخ كاملة دون اتصال؛ سقف ≈ 80 ميغابايت | `clearAdhanFullDownloads` عند حذف الحساب |
| رمز APNs | `majalis_apns_device_token_v1` | دفع | محلي |
| تلاوات دون اتصال | IndexedDB `majalis-quran-audio` (Blob MP3) | استماع دون شبكة | تُمسح عبر `clearAllOfflineAudioDownloads` عند حذف الحساب / مسح البيانات |
| استئناف التلاوة | `majalis-quran-audio-resume` (+ مفتاح LS) | موضع التشغيل | يُمسح مع الحذف |
| تفضيل القارئ/السرعة | مفاتيح `majalis-*` / تفضيلات صوت | واجهة تشغيل | تُمسح مع `clearUserLocalData` |
| تفسير مختصر دون اتصال | IndexedDB `tafseer_cache` + `majalis-offline-tafsir-pack-v1` + `sessionStorage` (`mj-mushaf-tafsir-sess:*`) | نص تفسير منقول حرفياً من Quran.com/QUL لصفحة المصحف الحالية والمجاورتين | يُمسح مع حذف الحساب / `clearUserLocalData` (البادئة `majalis-` / `mj-`) |
| استئناف تفسير صوتي | `majalis-tafsir-audio-resume-v1` + `mj-tafsir-playback-rate-v1` | موضع/سرعة بث التفسير الصوتي | يُمسح مع `majalis-*` / `mj-*` عند حذف الحساب |

### صوت وتلاوات (بث فقط)

| بند | التخزين | ملاحظة |
|---|---|---|
| بث آية بآية | everyayah (CDN) — لا يُعاد استضافته على خوادمنا | Kill-switch: `public/data/quran-audio-remote.json` |
| بث سورة كاملة | mp3quran — لا يُعاد استضافته | نفسه |
| تفسير صوتي | بث فقط من كتالوج موثّق (فارغ حالياً) | Kill-switch: `public/data/tafsir-audio-remote.json`؛ سقف تنزيل اختياري ≈ 80 ميغابايت |
| تنزيل اختياري | جهاز المستخدم فقط، سقف ≈ 1.5 GiB | إدارة من واجهة التنزيلات |

## دخول اجتماعي

- Google OAuth: الكود موجود لكن `GOOGLE_OAUTH_ENABLED = false` (الزر مخفي).
- Sign in with Apple: الكود جاهز خلف `APPLE_OAUTH_ENABLED = false` — **يُفعَّل مع أي دخول اجتماعي** (Guideline 4.8) بعد إعداد Supabase Apple provider.

## تسميع 1.1 (تسجيل مبكر — لا يُشحن في 1.0.0)

| بند | قرار مطلوب |
|---|---|
| `NSMicrophoneUsageDescription` | نص عربي يبرّر التسجيل للتسميع فقط |
| ملفات الصوت | بيانات مستخدم → تدخل حذف الحساب وبطاقات الخصوصية |
| مكان التخزين | جهاز فقط (مفضّل لأول إصدار تسميع) أو Supabase Storage — يُحسم قبل 1.1 |

## فجوات قبل المتجر

1. مسح أوسع لمفاتيح `localStorage` عند الحذف.  
2. حذف/فصل صريح لـ `push_subscriptions` المرتبطة بالجهاز.  
3. مراجعة كل جدول بلا CASCADE / بـ `SET NULL`.  
4. سياسة خصوصية عامة URL ثابتة (موجودة `/privacy`) مع مطابقة هذا الجرد.
