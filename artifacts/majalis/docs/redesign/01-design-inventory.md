# Checkpoint 1 — Audit + Design Inventory

**فرع:** `redesign/islamic-geometric-system`  
**تاريخ الجرد:** 2026-08-04  
**المنتج:** المجلس العلمي (Majlisilm) — `artifacts/majalis`

---

## 1) نوع المشروع

| الطبقة | الواقع |
|--------|--------|
| Web | **Vite + React 19 + TypeScript** (`wouter` للتوجيه) |
| Native | **Capacitor 8** (`com.yousef.majlisilm`) — iOS/Android؛ WebView على `https://majlisilm.com` |
| Backend | **Supabase** مباشرة من المتصفح (`VITE_SUPABASE_*`) + `/api/*` على Vercel للمساعد/الإعدادات العامة |
| Monorepo | pnpm workspace؛ الجذر الصحيح للـgit: مسار المستودع الحالي |

---

## 2) خريطة المجلدات ذات الصلة بالتصميم

| المسار | الدور |
|--------|------|
| `src/views/` (~205 صفحة) | الصفحات/المسارات |
| `src/components/` | كروم التطبيق + ودجات الرئيسية |
| `src/components/ui/` | shadcn/radix primitives (غالباً غير مستخدمة في صفحات المحتوى) |
| `src/components/home/` | أقسام الصفحة الرئيسية |
| `src/styles/brand-v4.css` | مصدر الرموز الحالي (يُحمَّل أولاً) |
| `src/styles/index.css` + `elite-2026.css` + `design-system.css` + `final-release.css` + … | طبقات CSS متراكمة (~650KB مصدر؛ ميزانية الحرج **505KB** مُبني) |
| `src/styles/pages/*.css` | أنماط صفحات مؤجّلة جزئياً |
| `src/lib/navigation.ts`, `sidebar-nav.ts`, `immersive-chrome.ts` | مصادر التنقل |
| `src/App.tsx` | ~304 Route (~70 Redirect) |

---

## 3) التنقل الحالي (مصادر متعددة)

### BottomNav (5)
| التسمية | المسار |
|---------|--------|
| الرئيسية | `/` |
| القرآن | `/mushaf` |
| الصلاة | `/prayer-times` |
| حسابي | `/my-learning` |
| المزيد | ورقة `MoreBottomSheet` (ليست route) |

### TopSectionBar (9 تبويبات أفقية)
`/mushaf`, `/quran-knowledge`, `/hadith`, `/fiqh`, `/memorization`, `/occasions-lessons`, `/islamic-directory`, `/prayer-times`, `/my-learning`

### MORE_SHEET
`/quran-knowledge`, `/hadith`, `/fiqh`, `/memorization`, `/occasions-lessons`, `/islamic-directory`, `/settings`

### Immersive chrome (يُخفى NavBar / TopSection / BottomNav)
`/prayer-times`, `/mushaf`, `/quran-hub`, `/quran/recitation-test-ai`

---

## 4) الصفحات المستهدفة بإعادة التصميم (موجات)

### موجة A — هيكل المنتج (Checkpoints 2–5)
- Shell: `NavBar`, `TopSectionBar`, `BottomNavBar`, `MoreBottomSheet`, `SideNavDrawer`, `SiteFooter`, `PwaInstallBanner`
- Home: `HomePage` + `components/home/*` + `styles/pages/home.css`

### موجة B — نواة المحتوى (Checkpoint 6)
| الصفحة | المسار الفعلي | ملاحظة |
|--------|---------------|--------|
| القرآن / المصحف | `/mushaf` (+ redirects من `/quran`) | immersive |
| الصلاة | `/prayer-times` | immersive — لا تغيّر منطق الحساب |
| التعلم / الدروس | `/lessons`, `/learn`, `/my-learning` | بيانات Supabase + seed |
| اختبارات | `/quiz` | لا تكسر منطق التقييم |
| أقسام علمية | hubs: `/hadith`, `/fiqh`, `/quran-knowledge`, `/memorization`, `/occasions-lessons`, `/islamic-directory` | `MergedSectionHubPage` |
| المزيد / إعدادات | sheet + `/settings` | إعادة تنظيم IA |

### موجة C — حالات وتوحيد (Checkpoint 7–8)
- `AsyncDataView`, skeletons, empty/error
- Dark mode (`html[data-theme]`)
- RTL logical props
- تنظيف طبقات CSS القديمة تدريجياً ضمن ميزانية 505KB

---

## 5) المكوّنات/الأنماط القديمة التي ستُستبدل بصرياً

| قديم | اتجاه الاستبدال |
|------|-----------------|
| خليط بطاقات `.hp-*` / `.ui-card` / `.ds-card` / `.quran-hub-card` | `igds` Card |
| أزرار متناثرة + shadcn Button غير موحّد في المحتوى | `igds` Button |
| `NavBar` متعدد الصفوف + `TopSectionBar` + BottomNav | AppShell + DesktopNav + BottomNav جديد |
| `PageShell` / عناوين صفحات متباينة | `PageHeader` / `SectionHeader` |
| Loading عشوائي / skeleton-base | `LoadingState` / `Skeleton` |
| Empty/Error غير موحّدة | `EmptyState` / `ErrorState` |
| طبقات `elite-2026` / `majalis-v2` / `modern-2026` كعقد بصري | تُهمَّش لصالح نظام هندسي واحد؛ الإزالة التدريجية للحفاظ على الميزانية |

---

## 6) Dark Mode

- مفعّل: `ThemePreferenceProvider` → `data-theme="light|dark"` + class `dark`
- التخزين: `localStorage` `majalis-theme`
- يجب أن يدعم نظام IGDS الوضعين من اليوم الأول (tokens مزدوجة)

---

## 7) مصادر البيانات (لا تُمس منطقياً)

- Supabase client: `lib/supabase*.ts` — دروس، مصادقة، تفضيلات
- مواقيت الصلاة: `lib/prayer-times.ts`
- محتوى يومي / يوميات: `lib/daily-content.ts`, `daily-context`
- عدّادات المحتوى: `data/content-counts.json`
- Seed محلي عند غياب الشبكة/المفاتيح (موجود مسبقاً)

---

## 8) المخاطر

| خطر | التخفيف |
|-----|---------|
| ميزانية CSS الحرج 505KB | نظام tokens جديد رفيع؛ تأجيل CSS الصفحات؛ إزالة/عزل elite تدريجياً |
| ~304 مسار + ~70 redirect | **لا تغيير routes** إلا بضرورة موثّقة؛ الـIA عبر التسميات/الترتيب فقط |
| Immersive mushaf/prayer | احترام `isImmersiveChromePath`؛ شريط داخلي خاص بكل صفحة |
| Capacitor / Bundle ID / Signing | **ممنوع تغييرها** |
| Env / RLS / DB | **ممنوع** |
| تعدد مصادر التنقل | توحيد عبر خريطة Mapping في Checkpoint 4 |
| محتوى شرعي | لا تعديل نصوص؛ إعادة تصميم الحاويات فقط |
| shadcn في `components/ui` | لا تعتمد عليها للمحتوى؛ IGDS منفصل خفيف |

---

## 9) خطة الحفاظ على الوظائف

1. Routes تبقى كما هي في `App.tsx`.
2. استدعاءات Supabase/hooks دون تغيير العقود.
3. منطق الصلاة/الأذان/الاختبارات دون تغيير الخوارزميات.
4. إعادة التصميم عبر: tokens → primitives → shell → صفحات (غلاف بصري + هيكل IA).
5. كل Checkpoint = commit مستقل قابل للرجوع.
6. **لا push إلى `main` ولا نشر إنتاج** في هذه المهمة.

---

## 10) Navigation Mapping المقترح (مسودة — تُثبَّت في CP4)

| القسم الحالي | Route | المكان الجديد | تغيّر الاسم؟ | تغيّر Route؟ | السبب |
|--------------|-------|---------------|--------------|--------------|-------|
| الرئيسية | `/` | Bottom + Desktop primary | لا | لا | — |
| القرآن | `/mushaf` | Bottom + Deep immersive | لا | لا | — |
| الصلاة | `/prayer-times` | Bottom + Deep immersive | لا | لا | — |
| حسابي | `/my-learning` | يُنقل إلى «المزيد» / حساب | يبقى متاحاً | لا | Bottom يصبح **التعلم** |
| التعلم (جديد في الشريط) | `/lessons` أو `/learn` | Bottom slot 4 | تسمية ظاهرة «التعلم» | لا | يطابق طلب المنتج؛ route موجود |
| المزيد | sheet | Bottom | لا | لا | مركز إعدادات وخدمات |
| أقسام علمية | hubs أعلاه | Desktop nav + More + اختياري chips | لا | لا | إزالة TopSectionBar المزدحم على الجوال |

---

## 11) Definition للمرحلة التالية

Checkpoint 2 ينشئ **Islamic Geometric Design System** كملف tokens رسمي (`igds`) مع جاهزية Light/Dark وRTL، دون كسر البناء، وبدون لمس مسارات أو Supabase.
