# فحوصات التحقق — مجالس العلم
# Verification Checklist — Majalis Al-Ilm

**تاريخ التنفيذ:** يوليو 2026  
**الفرع:** feat/app-store-readiness

---

## فحوصات الملفات

- [x] **PrivacyInfo.xcprivacy موجود وصالح XML**
  - المسار: `ios/App/App/PrivacyInfo.xcprivacy`
  - يحتوي: NSPrivacyAccessedAPITypes (UserDefaults)، NSPrivacyCollectedDataTypes (Email + CoarseLocation)، NSPrivacyTracking: false
  - ✓ صالح

- [x] **Info.plist محدَّث**
  - CFBundleDevelopmentRegion: `ar` (كان `en`)
  - CFBundleLocalizations: [ar, en]
  - NSLocationWhenInUseUsageDescription: بالعربية
  - NSMotionUsageDescription: بالعربية
  - NSUserNotificationsUsageDescription: بالعربية
  - NSAppTransportSecurity: NSAllowsArbitraryLoads: false (HTTPS فقط)
  - ✓ محدَّث

---

## فحوصات الكود

- [x] **كل Usage Description مربوطة بموضع استخدام في الكود**
  | الإذن | الملف | السطر |
  |-------|-------|-------|
  | NSLocationWhenInUseUsageDescription | `src/views/QiblaPage.tsx` | 185 |
  | NSMotionUsageDescription | `src/views/QiblaPage.tsx` | 202 |
  | NSUserNotificationsUsageDescription | `src/lib/local-notifications.ts` | — |

- [x] **رفض الموقع الجغرافي له بديل يدوي**
  - `src/views/QiblaPage.tsx`: عند رفض إذن الموقع (`manualMode=true`)، تظهر قائمة اختيار المدينة (20 مدينة رئيسية)
  - ✓ مُضاف في هذه المرحلة

---

## فحوصات صفحات الامتثال

- [x] **صفحة `/privacy` موجودة ومضافة للـ Router والـ Footer**
  - `src/views/PrivacyPage.tsx` ✓
  - `src/App.tsx` Route path="/privacy" ✓
  - `src/components/SiteFooter.tsx` رابط /privacy ✓

- [x] **صفحة `/terms` موجودة ومضافة للـ Router والـ Footer**
  - `src/views/TermsPage.tsx` ✓
  - `src/App.tsx` Route path="/terms" ✓
  - `src/components/SiteFooter.tsx` رابط /terms ✓

- [x] **صفحة `/contact` موجودة ومضافة للـ Router والـ Footer**
  - `src/views/ContactPage.tsx` ✓
  - `src/App.tsx` Route path="/contact" ✓
  - `src/components/SiteFooter.tsx` رابط /contact ✓
  - (تغني عن /support المطلوبة — تحتوي نموذج تواصل)

- [x] **صفحة `/account-deletion` موجودة**
  - `src/views/AccountDeletionPage.tsx` ✓
  - `src/App.tsx` Route path="/account-deletion" ✓
  - `src/components/SiteFooter.tsx` رابط /account-deletion ✓

---

## فحوصات نصوص المتجر

- [x] **اسم التطبيق (≤30 حرف):** "مجالس العلم" = 11 حرف ✓
- [x] **العنوان الفرعي (≤30 حرف):** "القرآن والأذكار ودروس العلم" = 29 حرف ✓
- [x] **الوصف الكامل (≤4000 حرف):** ~1650 حرف ✓
- [x] **الكلمات المفتاحية (≤100 حرف):** 72 حرف ✓
- [x] **Promotional Text (≤170 حرف):** 110 حرف ✓

---

## فحوصات البناء

- [x] **TypeScript: صفر أخطاء**
  ```
  cd artifacts/majalis && npx tsc --noEmit
  # (لا مخرجات = ناجح)
  ```

- [x] **Vite Build: ناجح**
  ```
  ✓ built in 4.28s
  ✓ post-build-seo: دُمج 372 ملف prerender → dist/
  ✓ Pre-rendered 202 routes (34 skipped)
  ```

---

## فحوصات المحتوى الديني

- [x] **لا محتوى ديني مُولَّد بالذكاء الاصطناعي**
  - نصوص القرآن: من المصحف الشريف (لا تعديل)
  - الأحاديث: مُصنَّفة من مصادر معتمدة، حقل `is_approved` مراجَع بشرياً
  - ميزة المساعد (/assistant): تستخدم Anthropic API للمحادثة فقط — لا تُدرَج في قاعدة المحتوى الديني

- [x] **Anthropic SDK مُوثَّق في سياسة الخصوصية** (مُضاف في data-inventory.md)

---

## الخطوات اليدوية المتبقية

- [ ] استبدال `resources/icon.png` بأيقونة رسمية 1024×1024 (حالياً: نسخة من logo-calligraphy.png)
- [ ] تشغيل `npx @capacitor/assets generate --ios` بعد إعداد الأيقونة
- [ ] تشغيل `npx cap sync ios` على Mac مع Xcode
- [ ] إنشاء حساب Apple Developer ورفع التطبيق عبر Xcode/Transporter
- [ ] إضافة حساب مراجعة تجريبي في App Store Connect (Majlisilm.app@gmail.com)
- [ ] التقاط لقطات الشاشة باستخدام `scripts/take-screenshots.ts`
