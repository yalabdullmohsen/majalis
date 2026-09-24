# Target Architecture — سُنّة (PR-0)

**Program:** SUNNAH WORLD-CLASS PRODUCT ENGINEERING UPGRADE  
**Stage:** PR-0 — Design target only (**لا تنفيذ حدود/إعادة هيكلة هنا**)  
**Base commit:** `07d580b0afdfc65ce9142129a73c6201f1e47854`

المبدأ: **تطوير الهيكل الحالي** (`app` / `features` / `entities` / `shared` / `components` / `lib` / `core`) لا استبداله بمجلدات فارغة موازية.

---

## 1) الطبقات المستهدفة

```
artifacts/majalis/src/
  app/           # إقلاع، Router shell، providers، startup
  features/      # ميزات منتج (مصحف، بحث، صلاة، …) — API عام لكل ميزة
  entities/      # كيانات بيانات مشتركة + hooks استعلام
  shared/        # أدوات عامة بلا منطق ميزة
  components/    # UI مشتركة → تتقارب مع design-system
  design-system/ # (هدف PR-2) tokens + primitives العامة فقط
  core/          # محركات منخفضة المستوى (audio, …)
  services/      # (هدف) عملاء شبكة/جسور أصلية مفصولة عن UI
  pages|views/   # مسارات رقيقة تستورد features
  native/        # جسور Capacitor / وثائق أصلية مرتبطة
  tests/         # مساعدات اختبار مشتركة
```

### قواعد الحدود (تُفعَّل تدريجيًا في PR-1)

| من → إلى | مسموح؟ |
|---|---|
| `pages/views` → `features/*/public` | نعم |
| `features` → `entities` / `shared` / `design-system` | نعم |
| `features` → `features` أخرى | عبر public API فقط |
| `shared` → `features` | ممنوع |
| Route/UI → Supabase/SQL مباشر | ممنوع (عبر services/entities) |
| Component واحد = Fetch + Presentation + Persistence | ممنوع |

---

## 2) حالة التطبيق

| نوع الحالة | مكانها المستهدف | ملاحظة |
|---|---|---|
| UI ephemeral | React local state | لا store عالمي |
| Server/cache | TanStack Query (نطاق محدود) + كاش مجال | لا إضافة SWR |
| Preferences | storage versioned + validate-on-read | migrations مرقّمة |
| Session حسّاسة | Supabase session · تفضيل مخزن آمن على native | لا توسيع localStorage للـtokens |
| Feature | stores صغيرة لكل مجال | لا God-store |

**ممنوع:** `key={theme}` على Root/Router/AppShell.

---

## 3) Design System المستهدف

مصدر واحد دلالي (بعد تنظيف التراكب):

- Color semantic · Typography · Spacing · Radius · Border · Elevation  
- Motion · Z-index · Safe-area · Breakpoints · Density · Touch · Focus  
- Light / Dark / System / Increase Contrast  

مكونات أساسية مستهدفة (إعادة استخدام الموجود أولًا):  
AppPage · PageHeader · SectionHeader · Button · IconButton · Link · Card · ContentRow · Chip · Tabs · SearchField · FilterSheet · TextField · SelectField · Checkbox · RadioGroup · Switch · Dialog · BottomSheet · Toast · Skeleton · EmptyState · ErrorState · OfflineState · AudioPlayer · BottomNavigation  

**Storybook:** غير مستهدف في المرحلة الحالية — الاعتماد على visual-snapshot + بوابات مكوّنات. إعادة تقييم بعد اكتمال PR-2.

---

## 4) إقلاع وتحديث (محاذاة برنامج Zero Flicker)

`AppStartupController` موجود — يُشدَّد ليكون المالك الوحيد للجاهزية:

`NATIVE_LAUNCH → BOOTSTRAPPING → MINIMUM_READY → INTERACTIVE` (+ BACKGROUND_REFRESH / ERROR)

يُضاف لاحقًا `AppUpdateManager` منفصل عن شاشة ErrorBoundary «تحديث العرض».

لا تُعرض App Shell قبل: Critical CSS · Theme محلي · RTL · خط UI · هندسة Header/BottomNav.

---

## 5) Observability المستهدف

| طبقة | هدف |
|---|---|
| Logger موحّد | debug/info/warn/error/fatal + حقول آمنة |
| RUM | الإبقاء على المسار الحالي كمقاييس ويب |
| Error monitoring | قرار مالك: Sentry **أو** تعزيز المسار المحلي — ليس الاثنين |
| Analytics | مسار واحد بعد موافقة · Event Catalog |
| Replay | OFF افتراضيًا |

---

## 6) اختبارات مستهدفة (هرم)

| طبقة | أداة حالية | هدف |
|---|---|---|
| Unit | node/tsx gates | KEEP + تنظيم |
| Integration | gates + fake-indexeddb | توسيع stores/contracts |
| E2E | Playwright | مسارات حرجة PR-8 |
| Visual | CI visual-snapshot | KEEP |
| Native | XCTest عند الحاجة | إطلاق/صوت/deeplink |
| A11y | jsx-a11y + contrast + يدوي | مصفوفة مهام |

---

## 7) خريطة PRs (لا تنفيذ هنا)

| PR | هدف |
|---|---|
| 0 | هذا الجرد + الهدف + قرارات التبعيات |
| 1 | حدود import + TS/lint تدريجي |
| 2 | Tokens + مكونات أساسية |
| 3 | Startup + Atomic update + recovery |
| 4 | Error boundaries + structured logging |
| 5 | Observability + release tracking |
| 6 | State/contracts/validation |
| 7 | Search/index integrity |
| 8 | Test architecture + E2E |
| 9 | Accessibility + touch |
| 10 | Performance/bundle |
| 11 | Security/privacy |
| 12 | CI/CD release automation |
| 13 | Content governance |
| 14 | Device matrix + TestFlight RC |

---

## 8) قبول الهدف

- [x] طبقات واضحة فوق الهيكل الحالي  
- [x] لا فرض Storybook/Zustand/Sentry قبل قرار موثّق  
- [x] محاذاة مع Zero Flicker / Design System الحالي  
- [ ] اعتماد مالك قبل PR-1  

**الحالة:** PARTIAL
