# جرد بيانات التطبيق — مجالس العلم
# App Data Inventory — Majalis Al-Ilm

**تاريخ الجرد:** يوليو 2026  
**Inventory Date:** July 2026

---

## معرّفات التطبيق / App Identifiers

| الحقل | القيمة |
|-------|--------|
| appId | `com.majlisilm.app` |
| appName | `مجالس العلم` |
| webDir | `dist` |
| Capacitor Version | 8.x |

---

## الإذن والاستخدام / Permissions & Usage

### 1. تحديد الموقع الجغرافي (Geolocation)
- **الملف:** `src/views/QiblaPage.tsx` (سطر 139-151)
- **الاستخدام:** `navigator.geolocation.getCurrentPosition()` — مرة واحدة عند فتح صفحة القبلة لحساب اتجاه الكعبة المشرفة والمسافة إليها.
- **البديل اليدوي:** متاح — عند رفض الإذن تظهر رسالة خطأ. (مُضاف في هذه المرحلة: حقل إدخال المدينة يدوياً)
- **لا يُخزَّن** الموقع على الخادم.
- **Usage:** One-time location read on Qibla page to calculate Ka'ba bearing and distance. Not stored.

### 2. الإشعارات (Web Push / Local Notifications)
- **الملف:** `src/components/PushPrompt.tsx`، `src/lib/push-notifications.ts`، `src/lib/local-notifications.ts`، `src/lib/adhan-scheduler.ts`
- **الاستخدام:**
  - Web Push API (VAPID) — إشعارات الموقع.
  - `LocalNotifications` (Capacitor) — تذكيرات إسلامية محلية (أذكار، أوقات الصلاة).
- **الإذن:** اختياري، يطلب صراحةً من المستخدم.
- **Usage:** Optional push/local notifications for Islamic reminders and adhan. User-initiated permission.

### 3. الاهتزاز (Haptics / Vibration)
- **الملفات:** `src/hooks/useTasbeehCounter.ts` (سطر 18)، `src/views/AdhkarPage.tsx` (سطر 109)
- **الاستخدام:** `navigator.vibrate()` — نبضة خفيفة عند عد التسبيح والأذكار.
- **لا يتطلب إذناً** — Web Vibration API.
- **Usage:** Short vibration pulse on tasbih counter and adhkar counter taps. No permission required.

### 4. توجيه الجهاز (Device Orientation)
- **الملف:** `src/views/QiblaPage.tsx` (سطر 154-166)
- **الاستخدام:** `DeviceOrientationEvent` — تتبع اتجاه الجهاز لتوجيه بوصلة القبلة.
- **الإذن:** `DeviceOrientationEvent.requestPermission()` على iOS — يطلب صراحةً.
- **Usage:** Device heading for Qibla compass. Explicit permission on iOS.

---

## البيانات المُجمَّعة / Collected Data

### بيانات الحساب (Account Data)
- **البريد الإلكتروني** — مطلوب للتسجيل، يُخزَّن في Supabase Auth.
- **اسم المستخدم** — اختياري.
- **دور المستخدم** — (read_only / admin / super_admin / scientific_reviewer).
- **تاريخ التسجيل** — تلقائياً في Supabase.

### بيانات الاستخدام (Usage Data)
- **الصفحات المزارة** — مُسجَّلة في localStorage عبر `src/lib/recent-pages.ts` — بيانات محلية فقط، لا تُرفع للخادم.
- **تفضيلات المستخدم** — الوضع الليلي، حجم الخط، اللغة، إعدادات الإشعارات — localStorage فقط.
- **عداد الأذكار والتسبيح** — localStorage فقط.

### بيانات لا تُجمَّع / Data NOT Collected
- لا بطاقات ائتمان أو بيانات مالية.
- لا صور من الكاميرا.
- لا ملفات من مساحة التخزين.
- لا جهات اتصال.
- لا بيانات صحية.
- لا تتبع إعلاني (analytics SDKs of any ad network).
- الموقع الجغرافي **لا يُخزَّن** — يُستخدم آنياً فقط لحساب اتجاه القبلة.

---

## SDKs طرف ثالث / Third-Party SDKs

| الحزمة | الغرض | يجمع بيانات؟ |
|--------|--------|--------------|
| `@supabase/supabase-js` | قاعدة البيانات والمصادقة | نعم (بيانات الحساب) |
| `@capacitor/core` | تطبيق موبايل Native | لا بذاته |
| `@capacitor/splash-screen` | شاشة التحميل | لا |
| `@capacitor/status-bar` | شريط الحالة | لا |
| `@capacitor/keyboard` | لوحة المفاتيح | لا |
| `@capacitor/app` | دورة حياة التطبيق | لا |
| `@capacitor/browser` | متصفح داخلي | لا |
| `adhan` | حساب أوقات الصلاة (محلي) | لا |
| `@anthropic-ai/sdk` | مساعد علمي (API) | نعم (نصوص المحادثة تُرسَل لـ Anthropic) |
| `@upstash/redis` | معدل الطلبات (Rate limiting) | لا (بيانات مجهولة) |

---

## ملاحظة Anthropic SDK
التطبيق يستخدم `@anthropic-ai/sdk` لميزة "المساعد العلمي" (`/assistant`). النصوص التي يُدخلها المستخدم في المحادثة تُرسَل إلى Anthropic API. يجب الإفصاح عن هذا في سياسة الخصوصية.

---

## الإفصاح لـ App Store Privacy (جاهز للنسخ)

**Data Used to Contact You:**
- Email Address — Linked to user identity — Used for account management

**Data Not Linked to You:**
- Location (approximate, one-time) — Used for Qibla direction — Not stored

**Data Not Collected:**
- Financial Info, Health & Fitness, Contacts, Photos, Browsing History

**Tracking:** None
