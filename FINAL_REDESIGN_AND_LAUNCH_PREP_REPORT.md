# Final Redesign and Launch Prep Report

## Scope

تجهيز `artifacts/majalis` و`artifacts/mushafi` لاختبار داخلي/تجريبي، مع مصحف وتسميع جديدين أصليين، دون نشر أو دمج أو TestFlight، ودون نسخ تطبيق آية أو أصوله.

## React Site Improvements

- هوية بصرية حديثة (أخضر `#12362A`، كريمي، خطوط عربية) من جولة redesign سابقة + تلميع هذه الجولة
- هيرو الرئيسية: المجلس العلمي + وصف + أزرار تصفح/بحث
- بطاقات أهم الأقسام عبر `FEATURED` (قرآن، علومه، حديث، فقه، حفظ، مناسبات، دليل، صلاة، حسابي)
- هيدر جوال متعدد الصفوف (بحث مستقل + تبويبات قابلة للتمرير)
- قائمة جانبية منظّمة بلا أقسام محذوفة
- بحث: placeholder ونصوص فارغ/خطأ موحّدة
- Bottom nav: الرئيسية · القرآن · الصلاة · حسابي · المزيد

## Flutter App Improvements

- `HomeShell` ببطاقات واضحة للمصحف الجديد والتسميع الجديد ومتابعة القراءة والإعدادات
- هوية مصحف كريمي/برونزي عبر `mushaf_design_tokens.dart`
- شبكة `MushafHomeScreen` تضم: فتح، بحث قرآن، تسميع، ختمة، مفضلة، علامات، ملاحظات، إعدادات، مراجعة، صوت
- مركز `MushafSettingsScreen` + مسار `/mushaf-settings`
- تأمين ASR: رفع الصوت وWebSocket وPCM معطّلة افتراضياً حتى يفعّلها المستخدم

## Old Mushaf Removed

- معزول تحت `lib/deprecated/legacy_mushaf/` و`legacy_shell/`
- غير مستورد في التنقل الفعال
- `/old-mushaf` يعيد التوجيه إلى `/mushaf-home`

## New Mushaf Created / Improved

- تحسين التوكنات والصفحة الرئيسية وربط التسميع/الإعدادات
- القراءة عبر `MushafScreen` + `MushafAyahActionsSheet` (تفسير، استماع، تسميع، نسخ، مشاركة صورة، مفضلة، ملاحظة، علامة، مراجعة)
- البحث والختمة والمفضلة والعلامات موجودة مسبقاً وحُسِّنت الوصول إليها من الشبكة

## Old Tasmee3 Removed

- لا يظهر في الواجهة
- aliases → `/tasmee3` فقط

## New Tasmee3 Improved

- شارات واضحة
- لا يبدأ الميكروفون تلقائياً
- عند القدوم من المصحف: «النطاق محدد من المصحف…»
- نصوص نتائج آمنة منهجياً
- إعدادات الشبكة الصوتية opt-in فقط

## Sidebar Redesign

- majalis: مجموعات وصول سريع / علم / خدمات / حساب — بلا من نحن/مكتبة/فتاوى/مستجدات

## Header Redesign

- majalis: صفوف منفصلة على الجوال (أدوات · بحث · تبويبات · تيكّر)

## Home Redesign

- majalis: هيرو + أهم الأقسام
- mushafi: HomeShell محدّث

## Search Improvements

- majalis: «ابحث في المحتوى…» / لا نتائج / تعذر البحث
- mushafi: `MushafSearchScreen` منفصل عن بحث الموقع

## Card Improvements

- بطاقات المصحف والتسميع بهوية برونزية هادئة
- بطاقات FEATURED في الموقع بـ surface-polish

## Arabic Copy Review

- تصحيحات واجهة سابقة (القرآن، السنة، ابحث، …)
- لم يُمسّ نص القرآن ولا التخريج

## RTL and Overflow Fixes

- CSS عام يمنع overflow-x في majalis
- HomeShell/Mushaf يستخدم SafeArea وبطاقات مرنة للنص الطويل

## Accessibility Fixes

- aria-labels للهيدر/القائمة/البحث في React
- Semantics/tooltips للشارات في HomeShell

## Safety and Privacy Checks

- `allowServerAudioUpload` افتراضي `false` دائماً من prefs
- Live WebSocket وPCM افتراضياً `false`
- API key في Secure Storage
- لا توليد قرآن بالذكاء الاصطناعي

## Files Changed

### mushafi
- `lib/features/mushaf/presentation/mushaf_design_tokens.dart`
- `lib/features/mushaf/presentation/mushaf_home_screen.dart`
- `lib/features/mushaf/presentation/mushaf_settings_screen.dart` (جديد)
- `lib/features/quran/presentation/screens/home_shell.dart`
- `lib/features/tasmee3/data/local_tasmee3_asr_settings_repository.dart`
- `lib/features/tasmee3/application/tasmee3_runtime_config.dart`
- `lib/app.dart`

### majalis
- `src/components/home/HomeExplorePlatform.tsx`

### docs
- `PROJECT_FINAL_REDESIGN_REPORT.md`
- `FINAL_REDESIGN_AND_LAUNCH_PREP_REPORT.md`
- `FINAL_LAUNCH_CHECKLIST.md`

## Commands Run

```bash
pnpm --filter @workspace/majalis run lint
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
cd artifacts/mushafi && flutter pub get && flutter analyze && flutter test
dart run scripts/check_quran_asset.dart
```

## Results

تُحدَّث بعد تشغيل الأوامر في الجلسة.

## Remaining Manual QA

- فتح المصحف الجديد من HomeShell ومتابعة القراءة
- الضغط على آية وفتح التفسير/التسميع دون تشغيل ميكروفون تلقائي
- التحقق أن `/old-mushaf` و`/ai-recitation` يعيدان التوجيه
- مراجعة الرئيسية والهيدر والقائمة على جوال React
- التأكد من عدم ظهور أقسام محذوفة أو إيموجي في الشريط
