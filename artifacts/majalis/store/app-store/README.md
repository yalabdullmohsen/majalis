# دليل نشر مجالس العلم على App Store
# Majalis Al-Ilm — App Store Readiness Guide

**الفرع:** `feat/app-store-readiness`  
**تاريخ الإعداد:** يوليو 2026

---

## 1. ملخص ما أُنجز

### المرحلة 0 — جرد البيانات
- تم فحص الكود كاملاً وتوثيق جميع الأذونات والبيانات في `store/data-inventory.md`
- **الأذونات الفعلية المستخدمة:**
  - Geolocation: صفحة القبلة فقط، آني، لا يُخزَّن
  - Device Orientation: صفحة القبلة فقط، بوصلة الاتجاه
  - Local Notifications: تذكيرات الصلاة والأذكار، اختيارية
  - Vibration API: عداد التسبيح والأذكار، بلا إذن
- **لا يوجد:** Camera، Filesystem، Contacts، Push Notifications (Capacitor)

### المرحلة 1 — إعدادات iOS
- **Info.plist**: محدَّث بـ:
  - `CFBundleDevelopmentRegion: ar`
  - `CFBundleLocalizations: [ar, en]`
  - Usage Descriptions بالعربية للموقع والاتجاه والإشعارات
  - `NSAppTransportSecurity` مقيّد (HTTPS فقط)
- **PrivacyInfo.xcprivacy**: منشأ حديثاً بـ:
  - UserDefaults (CA92.1) — Capacitor Preferences
  - Email Address — مرتبطة بالهوية — وظائف التطبيق
  - Coarse Location — غير مرتبطة — وظائف التطبيق
  - NSPrivacyTracking: false
- **scripts/generate-icons.ts**: سكربت توليد الأيقونات موثَّق
- **resources/icon.png**: placeholder من logo-calligraphy.png

### المرحلة 2 — صفحات الامتثال
جميع الصفحات المطلوبة كانت موجودة مسبقاً:
- `/privacy` ← PrivacyPage.tsx (سياسة خصوصية عربية شاملة)
- `/terms` ← TermsPage.tsx (شروط استخدام + قانون الكويت)
- `/contact` ← ContactPage.tsx (نموذج تواصل — تغني عن /support)
- `/account-deletion` ← AccountDeletionPage.tsx (حذف الحساب نهائياً)
- جميعها مضافة في App.tsx (Router) وفي SiteFooter.tsx

### المرحلة 3 — أصول المتجر
- `store/app-store/listing.md`: نصوص App Store جاهزة (ضمن حدود الأحرف)
- `store/app-store/age-rating.md`: استبيان التصنيف 4+
- `scripts/take-screenshots.ts`: سكربت Playwright لـ 18 لقطة (9 صفحات × 2 حجم iPhone)

### المرحلة 4 — ملاحظات المراجعة
- `store/app-store/review-notes.md`: باللغة الإنجليزية
  - وصف التطبيق، مصادر المحتوى الديني، الأذونات، حساب تجريبي

### المرحلة 5 — صلابة ما قبل المراجعة
- **QiblaPage.tsx**: أُضيف اختيار المدينة اليدوي (20 مدينة)
  - يظهر تلقائياً عند رفض إذن الموقع أو عدم دعم الجهاز
  - المستخدم يختار مدينته ويحسب القبلة بدون GPS
- TypeScript: صفر أخطاء ✓
- Vite build: ناجح ✓

### المرحلة 6 — التحقق
- `store/app-store/verification.md`: قائمة مفصّلة بنتائج كل فحص

---

## 2. جرد البيانات النهائي — جاهز للنسخ في App Privacy

### App Store Connect → App Privacy

**Data Used to Contact You:**
| النوع | مرتبط بالهوية | تتبع | الغرض |
|-------|--------------|------|-------|
| Email Address | نعم | لا | App Functionality |

**Data Not Linked to You:**
| النوع | مرتبط بالهوية | تتبع | الغرض |
|-------|--------------|------|-------|
| Coarse Location | لا | لا | App Functionality (Qibla direction, one-time) |

**Data Not Collected:**
- Financial Info
- Health & Fitness
- Contacts
- Photos or Videos
- Audio Data
- Browsing History (outside app)
- Sensitive Info
- User Content (stored off-device)

**Tracking:**
- NSPrivacyTracking: **false** (لا تتبع إعلاني)

---

## 3. الخطوات اليدوية المتسلسلة (بعد حساب Apple Developer)

### الخطوة 1: الأيقونة الرسمية
```bash
# استبدل resources/icon.png بملف 1024×1024 PNG رسمي
# ثم نفّذ:
cd artifacts/majalis
npx tsx scripts/generate-icons.ts
# أو مباشرةً:
npx @capacitor/assets generate \
  --ios \
  --iconBackgroundColor '#153025' \
  --splashBackgroundColor '#153025'
```

### الخطوة 2: مزامنة Capacitor
```bash
cd artifacts/majalis
pnpm build
npx cap sync ios
```

### الخطوة 3: فتح Xcode
```bash
npx cap open ios
```
- تأكد من Bundle ID: `com.majlisilm.app`
- ضبط Signing & Capabilities بحساب Apple Developer
- رفع Marketing Version و Build Number

### الخطوة 4: التقاط لقطات الشاشة
```bash
pnpm dev &
npx tsx scripts/take-screenshots.ts
# اللقطات في store-assets/screenshots/
```

### الخطوة 5: App Store Connect
1. أنشئ التطبيق: Identifier `com.majlisilm.app`
2. انسخ النصوص من `store/app-store/listing.md`
3. ارفع اللقطات من `store-assets/screenshots/`
4. أجب على استبيان التصنيف كما في `store/app-store/age-rating.md`
5. أجب على App Privacy من الجدول في القسم 2 أعلاه
6. ارفع IPA عبر Xcode أو Transporter
7. اكتب Review Notes من `store/app-store/review-notes.md`
8. أرسل للمراجعة

---

## 4. المخاطر المحتملة في المراجعة وكيف جُهّزت

| الخطر | الجهوزية |
|-------|---------|
| رفض بسبب محتوى ديني | review-notes.md يوضح أن المحتوى مراجَع بشرياً، لا AI |
| رفض بسبب إذن الموقع بلا سبب | Usage Description واضحة + بديل يدوي |
| رفض بسبب PrivacyInfo.xcprivacy | الملف منشأ ومكتمل |
| رفض بسبب ATS | NSAllowsArbitraryLoads: false، HTTPS فقط |
| رفض بسبب حذف الحساب غير متاح | /account-deletion موجود ومرتبط في Footer |
| رفض بسبب سياسة خصوصية | /privacy موجود بعنوان URL كامل |
| رفض الأيقونة (شفافية أو شعار Apple) | placeholder موجود، يُستبدل بأيقونة رسمية |
| Anthropic SDK — إفصاح غير كافٍ | موثَّق في data-inventory.md وreview-notes.md |

---

## 5. الملفات المُنشأة في هذه المرحلة

```
artifacts/majalis/
├── ios/App/App/
│   ├── Info.plist                     ← محدَّث (ar locale + usage descriptions + ATS)
│   └── PrivacyInfo.xcprivacy          ← جديد
├── resources/
│   └── icon.png                       ← placeholder (يُستبدل)
├── scripts/
│   ├── generate-icons.ts              ← جديد
│   └── take-screenshots.ts            ← جديد
├── store/
│   ├── data-inventory.md              ← جديد
│   └── app-store/
│       ├── listing.md                 ← جديد
│       ├── age-rating.md              ← جديد
│       ├── review-notes.md            ← جديد
│       ├── verification.md            ← جديد
│       └── README.md                  ← هذا الملف
└── src/views/
    └── QiblaPage.tsx                  ← محدَّث (بديل يدوي للموقع)
```
