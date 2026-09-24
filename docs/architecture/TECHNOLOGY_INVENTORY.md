# Technology Inventory — سُنّة (PR-0)

**Program:** SUNNAH WORLD-CLASS PRODUCT ENGINEERING UPGRADE  
**Stage:** PR-0 — Audit only (**لا تثبيت Dependency · لا إصلاح منتج**)  
**Base:** `origin/main` @ `07d580b0afdfc65ce9142129a73c6201f1e47854`  
**Branch:** `cursor/world-class-engineering-pr0-inventory`  
**Measured at:** `2026-09-24T22:00:00Z` (جرد كود محلي)  
**Product root:** `artifacts/majalis`

لا إعلان `SUNNAH_WORLD_CLASS_ENGINEERING_COMPLETE` في هذا الـPR.  
قرارات KEEP/UPGRADE/… التفصيلية: `DEPENDENCY_DECISIONS.md` · الهدف: `TARGET_ARCHITECTURE.md`.

مرجع قديم مرتبط (لا يُستبدل): `docs/architecture/SYSTEM_ARCHITECTURE.md` (2026-07-29).

---

## 1) ملخص المكدس الحالي

| المجال | الواقع على `main` |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Native wrapper | Capacitor 8 (iOS/Android داخل `artifacts/majalis`) · Expo في `majalis-mobile` **مستبعد** من typecheck/build |
| Router | `wouter` |
| State (UI/prefs) | React state/context + localStorage/Preferences · **لا** Zustand/Redux |
| Server state | `@tanstack/react-query` (استخدام محدود: Auth/entities/adhkar) + fetch مباشر شائع |
| Forms | `react-hook-form` + `@hookform/resolvers` (استخدام ضيق) |
| Validation | `zod` (catalog) + `lib/api-zod` مولَّد |
| Styling | Tailwind 4 + طبقات CSS متعددة (tokens/brand/m2030/SVL) |
| Design tokens | عدة ملفات tokens متراكبة — يحتاج توحيد (PR-2) |
| Icons | `lucide-react` |
| Animation | CSS / native-feel · **ممنوع** framer-motion في المنتج (بوابة) |
| Audio | `core/audio/AudioEngine` + `hls.js` + Capacitor plugins |
| Storage | `localStorage` · Capacitor Preferences · `dexie` (IndexedDB) |
| Database | Hosted Supabase (Postgres) · Drizzle في `lib/db` placeholder |
| Auth | Supabase Auth (`@supabase/supabase-js`) + `AuthProvider` |
| Search | فهرس مولَّد + `features/search` محلي |
| Offline / SW | Service Worker مخصص + كاش مواقيت/محتوى |
| Error monitoring | **لا Sentry** · `error-report` محلي + ErrorBoundary |
| Analytics / RUM | `rum-telemetry` + موافقة cookies · `POST /api/rum` |
| Feature flags | وحدات محلية (`quran-journey/flags`, `lessons-guide/flags`, …) |
| Logging | `console` متفرق + تقارير خطأ · **لا** Logger موحّد |
| Unit / gates | مئات بوابات `node --import tsx` تحت `src/lib/__tests__` |
| E2E | Playwright (`@playwright/test`) |
| Visual | visual-snapshot في CI + بوابات لقطات |
| A11y | `eslint-plugin-jsx-a11y` + contrast gates + يدوي |
| Performance | LHCI / budgets / RUM / mushaf-measure |
| Security | CSP gates · secret scanning جزئي · Upstash ratelimit على API |
| CI/CD | `.github/workflows/ci.yml` + auto-merge + Vercel |
| App Store | Capacitor iOS · workflows `ios-*` / TestFlight |

---

## 2) جرد المجالات (تفصيلي مختصر)

### Framework / Build
- **React + Vite + `@vitejs/plugin-react`** — KEEP  
- **TypeScript:** `strict: false` مع `strictNullChecks: true` في majalis — UPGRADE تدريجي (PR-1)  
- **Catalog / pnpm workspace** — KEEP  

### Native
- **Capacitor 8** (+ App, Browser, Haptics, Keyboard, Local/Push Notifications, Preferences, Splash, StatusBar) — KEEP  
- **Expo (`majalis-mobile`)** — KEEP خارج المسار الحرج / لا دمج قسري  

### Router
- **wouter** — KEEP (خفيف، متوافق RTL)  

### State
- Context/hooks محلية + repositories (مصحف، صلاة، إعدادات) — KEEP كأساس  
- **TanStack Query** — KEEP مع تضييق النطاق (لا استبدال بـfetch عشوائي جديد دون عقد)  
- **Zustand / Redux / Jotai** — REJECT (لا حاجة مثبتة)  

### Forms / Validation
- RHF + Zod — KEEP حيث توجد نماذج معقّدة  
- نماذج بسيطة: Controlled inputs — KEEP  

### Styling / DS
- Tailwind + CSS variables + `components/design-system/*` — KEEP كمصدر، UPGRADE لتنظيف التراكب  
- ملفات tokens متعددة (`tokens.css`, `sunnah-foundation-tokens`, `visual-redesign-v2-tokens`, …) — UPGRADE → مصدر دلالي واحد (PR-2)  
- **Storybook** — REJECT في PR-0 (تكرار مع visual gates + تكلفة صيانة؛ يُعاد التقييم بعد PR-2)  

### Icons / Motion
- Lucide — KEEP  
- framer-motion — REJECT للمنتج (موجود في lock عبر حزم أخرى؛ لا إضافة مباشرة)  

### Audio
- AudioEngine موحّد جزئيًا — UPGRADE (PR لاحق للصوت)  
- hls.js — KEEP للبث عند الحاجة  

### Data / Auth
- Supabase JS — KEEP  
- RLS + migrations يدوية — UPGRADE حوكمة (خارج تثبيت libs)  

### Search / Offline
- فهرس مولَّد + بوابات سلامة — UPGRADE سلامة الروابط (برنامج منفصل/PR-7)  
- SW مخصص — UPGRADE Atomic update (برنامج Zero Flicker / PR-3 هنا)  

### Observability
- RUM محلي — KEEP كخط أساس  
- **Sentry** — REJECT حتى اعتماد خصوصية + قرار مالك (PR-5) · لا تثبيت في PR-0  
- Session Replay — REJECT افتراضيًا  

### Feature flags
- Flags محلية typed جزئيًا — UPGRADE سياسة انتهاء/مالك (لا LaunchDarkly)  

### Analytics
- Cookie consent + أحداث محدودة — KEEP مسار واحد · لا منتج Analytics ثانٍ  

### Testing
- Unit gates — KEEP  
- Playwright — KEEP / UPGRADE تغطية المسارات الحرجة (PR-8)  
- XCUITest — UPGRADE عند الحاجة الأصلية فقط  

### CI / Release
- Path-lane + verify:ci + auto-merge — KEEP / UPGRADE وضوح الفشل الجذري (PR-12)  
- Vercel production على `main` — KEEP  

---

## 3) هيكل المجلدات الحالي (مقابل المقترح)

موجود فعلًا تحت `artifacts/majalis/src`:  
`app/` · `features/` · `entities/` · `shared/` · `components/` · `core/` · `lib/` · `pages/` · `views/` · `admin-v3/` · `tests/`

**قرار PR-0:** عدم إعادة تسمية جذرية. الهدف = حدود import أوضح فوق الهيكل الحالي (PR-1)، لا migration مجلدات شاملة في PR واحد.

---

## 4) فجوات عالية القيمة (للاعتماد قبل PR-1+)

| فجوة | دليل | PR مقترح |
|---|---|---|
| لا Error Monitoring مرتبط بـrelease/commit | لا `@sentry` | PR-5 بعد اعتماد مالك |
| لا Logger موحّد · console في مسارات | كود متفرق | PR-4 |
| Tokens متراكبة · Hex في أماكن | عدة ملفات CSS | PR-2 |
| TS `strict: false` | tsconfig | PR-1 تدريجي |
| شاشة «تحديث العرض» + FOUC | تقارير startup/zero-flicker | PR-3 |
| next-themes غير مستخدم | 0 imports | REMOVE مرشّح بعد بوابة |
| Radix/shadcn كثيف مع استعمال جزئي | package.json | مراجعة إزالة تدريجية لاحقًا |
| Storybook غائب | — | REJECT الآن |

---

## 5) Bundle / CSS (خط أساس مرجعي — لا قياس جديد في PR-0)

من `docs/performance/SUNNAH_WORLD_CLASS_BASELINE.md` (جلسة سابقة):

| | gzip KiB | Budget |
|---|---:|---|
| Entry JS | ~114.7 | ≤120 |
| Main CSS | ~59.3 | ≤100 |
| Critical CSS gzip (محلي حديث) | **~64.3** يتجاوز 60KiB | بوابة critical — صنف B على main |

**PR-0:** لا تغيير Bundle. أي Dependency جديدة تتطلب صف قرار + قياس قبل/بعد.

---

## 6) قبول PR-0

- [x] جرد المجالات المطلوبة  
- [x] قرارات KEEP/UPGRADE/REPLACE/REMOVE/REJECT في DEPENDENCY_DECISIONS  
- [x] Target architecture موثّق  
- [x] **صفر** dependencies جديدة  
- [ ] اعتماد مالك للجرد قبل PR-1  

**الحالة:** PARTIAL (بانتظار اعتماد المالك)

---

## 7) ملاحظة verify:ci محلي (صنف B)

`critical-css-gzip-gate` يفشل محليًا على `origin/main` (`gzip=65812 > 61440`) — غير ناتج عن هذا الـPR (وثائق + بوابة جرد فقط). Follow-up ضغط Critical CSS؛ لا تخفيف بوابة هنا.
