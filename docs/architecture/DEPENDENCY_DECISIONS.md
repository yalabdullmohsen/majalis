# Dependency Decisions — سُنّة (PR-0)

**Program:** SUNNAH WORLD-CLASS PRODUCT ENGINEERING UPGRADE  
**Stage:** PR-0 — Decisions only · **صفر تثبيت في هذا الـPR**  
**Base:** `07d580b0afdfc65ce9142129a73c6201f1e47854`  
**Owner (افتراضي للاعتماد):** مالك المنتج · تنفيذ هندسي: وكيل/فريق سُنّة  

أسطورة القرار: **KEEP** · **UPGRADE** · **REPLACE** · **REMOVE** · **REJECT**

أثر Bundle/أداء/خصوصية: نوعي ما لم يُقَس — أي إضافة لاحقة تتطلب قياس قبل/بعد ضد الميزانيات الحالية.

---

## أ) مكتبات حالية — قرارات

| الأداة | الوظيفة | لماذا؟ | قرار | Bundle | أداء | خصوصية | صيانة | Migration | Rollback | اختبارات |
|---|---|---|---|---|---|---|---|---|---|---|
| React 19 | UI | أساس المنتج | KEEP | — | — | n/a | عالية | — | — | typecheck/lint |
| Vite | bundler | بناء سريع | KEEP | — | جيد | n/a | عالية | — | — | build gates |
| TypeScript | أنواع | جودة | UPGRADE (`strict` تدريجي) | n/a | n/a | n/a | متوسطة | flags تدريجية + baseline أخطاء | إرجاع flag | typecheck gate |
| wouter | توجيه | خفيف RTL | KEEP | صغير | جيد | n/a | منخفضة | — | — | route gates |
| @tanstack/react-query | server cache | مستخدم فعليًا | KEEP | متوسط | جيد عند النطاق المحدود | لا PII تلقائي | متوسطة | توسيع عقد لا استبدال | إبقاء النسخة | entity hooks tests |
| react-hook-form + resolvers | نماذج | موجود | KEEP | صغير | جيد | لا تسريب افتراضي | منخفضة | لا توسيع بلا حاجة | — | form gates عند التعديل |
| zod + lib/api-zod | عقود | حدود نظام | KEEP / UPGRADE تغطية | صغير–متوسط | جيد | يقلل trust الأعمى | متوسطة | توسيع parse عند الحدود | إبقاء | contract tests |
| Tailwind 4 | utility CSS | أسلوب الفريق | KEEP | CSS budget | OK | n/a | متوسطة | لا v5 قسريًا | — | CSS budget |
| lucide-react | أيقونات | معيار المشروع | KEEP | chunk icons | OK | n/a | منخفضة | لا استبدال مكتبة أيقونات | — | icons budget |
| @supabase/supabase-js | auth/data | مصدر حقيقة | KEEP | متوسط | شبكة | RLS+keys | عالية | لا Firebase | — | auth gates |
| Capacitor 8 + plugins | native shell | iOS/Android | KEEP | native | أصلي | تفضيلات محلية | عالية | لا Cordova رجوع | pin نسخة | ios gates |
| dexie | IDB | كاش محلي | KEEP | صغير | جيد offline | بيانات محلية | متوسطة | — | — | fake-indexeddb tests |
| hls.js | بث | تلاوة/وسائط | KEEP | متوسط كسول | عند الحاجة | n/a | متوسطة | lazy only | — | audio gates |
| adhan | مواقيت | حساب فلكي | KEEP | صغير | محلي | لا GPS إجباري في اللب | منخفضة | — | — | prayer-engine |
| Playwright | E2E | مسارات | KEEP / UPGRADE تغطية | dev | CI وقت | بيانات اختبار معزولة | متوسطة | توسيع suites | — | e2e |
| eslint + jsx-a11y + ts-eslint | جودة | بوابة | KEEP / UPGRADE boundaries | n/a | n/a | n/a | متوسطة | plugins حدود | إبطال قاعدة | lint |
| @radix-ui/* (مجموعة) | primitives | shadcn جزئي | UPGRADE→تقليم غير المستخدم | متوسط | parse كلفة | n/a | عالية إن بقيت كلها | حذف غير المستورد بعد جرد استعمال | إعادة الحزمة | import/dead-code |
| next-themes | ثيم | **غير مستورد** | REMOVE (مرشّح PR لاحق بعد بوابة unused) | يزيل | — | n/a | يقلل | حذف من package.json بعد إثبات 0 usage | إعادة التثبيت | grep+build |
| @replit/vite-plugin-* | dev UX | بيئة Replit | KEEP بيئة dev / راقب أثر prod | dev | — | n/a | منخفضة | — | — | build |
| tw-animate-css | motion CSS | حالي | KEEP بحذر | CSS | خفيف | n/a | منخفضة | لا Framer | — | native-feel gate |
| vaul | drawer | sheets | KEEP إن مستخدم | صغير | OK | n/a | منخفضة | — | — | UI gates |
| embla-carousel-react | carousel | Home/أقسام | KEEP | صغير | OK | n/a | منخفضة | — | — | — |
| leaflet | خرائط | معالم | KEEP كسول | كبير كسول | عند المسار | موقع اختياري | متوسطة | — | — | map gates |
| @upstash/ratelimit+redis | API limit | حماية | KEEP خادم | server | — | مفاتيح خادم | متوسطة | — | — | api tests |
| express (majalis) | محلي/معاينة | خدمتان | KEEP محدود | server | — | — | — | — | — | — |
| compression | خادم | — | KEEP | — | — | — | — | — | — | — |
| rollup-plugin-visualizer | تحليل حزمة | ميزانيات | KEEP dev | n/a | n/a | n/a | منخفضة | — | — | budget scripts |
| sharp | أصول | بناء | KEEP | build | — | n/a | — | — | — | — |
| cmdk | command palette | إن مستخدم | KEEP/تقليم | صغير | — | — | — | — | — | — |
| date-fns | تواريخ | — | KEEP | صغير | — | — | — | — | — | — |
| html-to-image / qrcode | تصدير/QR | ميزات محدودة | KEEP كسول | كسول | — | — | — | — | — | — |
| @anthropic-ai/sdk | مساعد | خادم | KEEP خادم فقط | لا للمتصفح | — | لا تسريب مفاتيح | عالية | لا مفتاح VITE | — | assistant api |
| pg | SQL خادم | — | KEEP خادم | — | — | أسرار | — | — | — | — |
| class-variance-authority / clsx / tailwind-merge | class utils | DS | KEEP | صغير | — | — | — | — | — | — |
| fake-indexeddb | اختبار | — | KEEP | test | — | — | — | — | — | unit |
| input-otp | OTP UI | — | KEEP إن مستخدم | صغير | — | — | — | — | — | — |
| react-day-picker | تقويم | — | KEEP | متوسط | — | — | — | — | — | — |
| react-dropzone | رفع | Admin | KEEP نطاق admin | — | — | ملفات | — | — | — | — |
| dotenv / tsx / globals | أدوات | — | KEEP | — | — | — | — | — | — | — |

---

## ب) مقترحات شائعة — قرارات PR-0 (بلا تثبيت)

| المقترح | الوظيفة | المقابل الحالي | قرار | سبب | Bundle | خصوصية | متى يُعاد الفتح |
|---|---|---|---|---|---|---|---|
| Sentry | أخطاء/أداء/release | error-report + RUM + ErrorBoundary | **REJECT** مؤقتًا | يحتاج اعتماد خصوصية + sampling + لا Replay افتراضي | متوسط+ | مرتفع إن أُسيء الضبط | PR-5 بعد Owner Action |
| PostHog / GA / ثانية Analytics | تحليلات | rum + consent | **REJECT** | مسار Analytics واحد فقط | متوسط | مرتفع | لا |
| Zustand / Redux / Jotai | state | Context + Query + repos | **REJECT** | لا فجوة مثبتة | متوسط | n/a | إن ظهر God-store |
| SWR | server cache | TanStack Query | **REJECT** | تكرار وظيفة | — | — | لا |
| Formik | نماذج | RHF | **REJECT** | تكرار | — | — | لا |
| Yup / Valibot | تحقق | Zod | **REJECT** | تكرار | — | — | لا إلا قياس أصغر لاحقًا |
| Framer Motion | حركة | CSS/native-feel | **REJECT** | بوابة تمنع · صيانة | كبير | n/a | لا |
| Storybook | كتالوج UI | visual-snapshot + DS components | **REJECT** الآن | تكرار صيانة بلا فجوة مثبتة | كبير CI | n/a | بعد PR-2 إن عجزت البيئة الحالية |
| styled-components / Emotion | CSS-in-JS | Tailwind+CSS | **REJECT** | تكرار نموذج أسلوب | — | — | لا |
| LaunchDarkly / Unleash | flags | flags محلية | **REJECT** | لا اعتماد شبكة لـApp Shell | — | بيانات تقييم | إن تجاوزت flags المحلية الحوكمة |
| Axios | HTTP | fetch | **REJECT** | لا حاجة | — | — | لا |
| Moment.js | تواريخ | date-fns / Intl | **REJECT** | ثقيل | كبير | — | لا |
| MUI / Chakra / Ant | UI kit | DS الحالي | **REJECT** | DS واحدة فقط | كبير | — | لا |
| Cordova | native | Capacitor | **REJECT** | — | — | — | لا |
| Firebase | BaaS | Supabase | **REJECT** | — | — | — | لا |

---

## ج) ملخص تنفيذي

| القرار | العدد التقريبي |
|---|---|
| KEEP | أغلب المكدس التشغيلي |
| UPGRADE | TS strict · tokens · SW/startup · flags policy · Query نطاق · E2E · Radix تقليم |
| REMOVE (مرشّح لاحق) | `next-themes` غير المستخدم · حزم Radix غير المستوردة بعد جرد |
| REPLACE | لا شيء في PR-0 |
| REJECT | Sentry (حتى اعتماد) · Storybook الآن · state/analytics/UI kits المكررة · Framer |

**Dependencies المضافة في هذا الـPR:** لا شيء.  
**Dependencies المحذوفة في هذا الـPR:** لا شيء (الحذف بعد بوابة unused في PR لاحق).

---

## د) سياسة إضافة تبعية (ملزمة بعد اعتماد الجرد)

1. صف قرار في هذا الملف (أو ADR لاحق).  
2. إثبات فجوة لا يغطيها KEEP.  
3. قياس Bundle/CSS قبل/بعد ضد الميزانية.  
4. مراجعة خصوصية إن كانت الأداة ترسل بيانات.  
5. خطة Migration + Rollback + مالك + اختبارات.  
6. PR منفصل عن ميزات المنتج.

---

## هـ) Owner Actions (لا ينفّذها الوكيل)

1. اعتماد هذا الجرد رسميًا قبل السماح بـPR-1.  
2. قرار نعم/لا لـ**Sentry** (مع سياسة redact وبدون Replay افتراضي).  
3. قرار الإبقاء أو حذف **Expo mobile** طويل الأمد.  
4. أولوية تقليم **Radix غير المستخدم** مقابل ضغط Critical CSS (صنف B على main).

**الحالة:** PARTIAL — بانتظار اعتماد المالك.
