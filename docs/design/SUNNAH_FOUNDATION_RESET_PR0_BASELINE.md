# SUNNAH FOUNDATION RESET — PR-0 Baseline + Dependency Map

**تاريخ:** 2026-09-22  
**أساس:** `origin/main` @ `23381f643` (يشمل Mushaf dual appearance)  
**نطاق هذا الـPR:** جرد + تصنيف + لقطات Baseline فقط — بلا إعادة تصميم سطحية.

> لا تعتمد على أسماء V2/V3 أو تقارير اكتمال سابقة إذا خالفت الكود أو اللقطات هنا.

---

## 1) Root Causes المؤكدة (من الكود + اللقطات)

| # | عيب ظاهر | السبب الجذري (كود) | تصنيف |
|---|---|---|---|
| R1 | أنظمة بصرية متعددة على نفس الصفحة | `main.tsx` يحمّل متزامنًا ثم مؤجّلًا: `theme.css` → `brand-v4` → `tokens` → `design-tokens` → `visual-redesign-v2-tokens` → `sunnah-identity-reset` → `index` → `modern-section-shell` → `theme-aliases` → `semantic-layer` → `visual-identity-unify` → `sections-calm-polish` → … ثم idle: `green-surface-system` · `soft-cards` · `design-system` · `final-release` · `m2030/*` · `sunnah-visual-language` · `visual-refresh-v1` مع إعادة استيراد `visual-identity-unify` و`dark-mode-recovery` بعد `final-release` | Cascade حربي |
| R2 | خلفية أخضر باهت واسعة | `green-surface-system.css` (مؤجّل) + `section-cards-theme` + هويات `--mj-brand` مشتقة خضراء على سطوح صفحات كاملة | CONSOLIDATE |
| R3 | بطاقات ضخمة / فراغات ثابتة | `min-height` واسعة في طبقات soft-cards / hub-card / modern-section-shell؛ `space-between` على حاويات محتوى قليل؛ بطاقات متعددة الطبقات (HadithCard / HubCard / SectionCard / FeatureCard / ContentCard / InternalLinkCard…) | CONSOLIDATE |
| R4 | إطار متقطع «استكشف أيضًا» | `ExploreAlsoNav` → `.fg-related--footer` في `fiqh-guide.css` بـ`border: 1px dashed` + `hub-card-grid` | REMOVE/PORT |
| R5 | عناصر عائمة متراكمة | `App.tsx`: `ScrollToTop` + `FloatingBackButton` + `QuranMiniPlayerBar` + BottomNav — بلا `FloatingLayerManager`؛ insets مشتتة (`--bottom-nav-height` / audio dock) | CONSOLIDATE |
| R6 | Internal IDs ظاهرة | `HadithCard` يعرض `#{h.hadith_number}` بما فيه قيم مثل `sutr-01` من بيانات التعبئة | REMOVE من الواجهة |
| R7 | ص١≠ص٢ وزن بصري | `reader-page-chrome.css`: opening يفرض `--mushaf-ayah-mark-size: 1.22em` و`font-size: var(--mushaf-ayah-mark-number-size, 0.7em)` على الحاوية بينما العادي `--mushaf-ayah-mark-font-size: 0.62em` + glyph `1.16em` — معنيان لنفس اسم التوكن | CONSOLIDATE (PR-10) |
| R8 | رقم الآية / زخرفة | مقاس الصندوق مقفول `1.15em`؛ وضوح الرقم عبر glyph فقط؛ opening يكسر العقد بإعادة تعريف `number-size` كـfont-size للحاوية | PORT (PR-9) |
| R9 | **GOLD في الإعدادات «لا يغيّر العلامات» (بلاغ مستخدم)** | العقد البرمجي يعمل عند وجود `data-mushaf-accent="gold"` على `.nm-root` (إثبات حي أدناه). الفشل المرجّح = مسار UI/حالة/خصوصية ليلية — لا غياب التوكنات | **PR-8** |

### R9 — إثبات حي (2026-09-22)

| تهيئة | `data-mushaf-accent` | `backgroundColor` للعلامة |
|---|---|---|
| storage `EMERALD` · ص١ | `emerald` | `rgb(14, 122, 107)` = `#0E7A6B` |
| storage `GOLD` · ص١ | `gold` | `rgb(201, 168, 46)` = `#C9A82E` |
| storage `GOLD` · ص٣ | `gold` | `rgb(201, 168, 46)` |

لقطات Baseline ص١ emerald vs gold تختلف في بكسلات العلامة (عيّنات مطابقة للجدول).

**فرضيات فشل مسار الاختيار (للتحقق في PR-8 — لا إصلاح هنا):**

1. ازدواج أسطح الإعدادات: `MushafControlsLayer` (مسار `/mushaf`) و`MushafSettingsSheet` (Madinah) — احتمال تحديث `aria-checked` دون مزامنة DOM في أحد المسارين.
2. `html.dark .nm-root` / `html[data-theme="dark"] .nm-root` (خصوصية أعلى من `.nm-root[data-mushaf-accent="gold"]`) يعيد تعيين `--mushaf-marker-*` من `--mushaf-verse-marker-dark-*`؛ إن لم تُحدَّث dark-tokens مع الاختيار يظهر زمردي ليلي.
3. توقيت: اختيار UI يحدّث React state بينما طبقة offscreen/transform تحتفظ بلون قديم حتى تقليب صفحة.
4. التباس بصري: أسطح metadata العاجية تبقى دافئة بينما العلامة ذهبية — يُحسب «لم يتغيّر».

---

## 2) Dependency Map — من يحدّد ماذا؟

### 2.1 لون / سطح / تباين

| المعنى | المصدر الحالي | يغلبه | حكم |
|---|---|---|---|
| لوحة العلامة `--mj-*` | `app/styles/theme.css` | `brand-v4` / aliases | KEEP نواة |
| جسر `--ss-*` | `ssunnah-theme-api.css` | — | KEEP جسر |
| Brand v4 | `brand-v4.css` + components/contrast | تُعاد بعد design-system | KEEP → PORT لاحقًا |
| Tokens أزواج | `tokens.css` · `design-tokens.css` | | KEEP |
| V2 Dashboard | `visual-redesign-v2-tokens.css` | | CONSOLIDATE |
| Identity Reset | `sunnah-identity-reset.css` + chrome-nav | | KEEP مرحلي |
| توحيد بصري | `visual-identity-unify.css` | يُعاد بعد final-release | CONSOLIDATE |
| أخضر أسطح | `green-surface-system.css` | مؤجّل idle | CONSOLIDATE/REMOVE صفحي |
| Soft cards | `soft-cards.css` | مؤجّل | CONSOLIDATE |
| DS كلاسيكي | `design-system.css` | | KEEP → PORT |
| Final release | `final-release.css` | كثافة `!important` عالية (~211) | CONSOLIDATE |
| m2030 | `m2030/{foundation,navigation,pages,interactions,home}.css` | | KEEP → PORT |
| SVL | `sunnah-visual-language.css` | | KEEP |
| Visual refresh v1 | `visual-refresh-v1.css` | | CONSOLIDATE |
| Dark stacks | `dark-mode-*` · `premium-dark-refine` · `luxury-night-v2` | تُحمَّل متزامنة إن boot dark | CONSOLIDATE |
| مصحف Accent | `mushaf-reader.css` + `reader-page-chrome.css` | dark remap على `.nm-root` | KEEP عقد · إصلاح PR-8/10 |

### 2.2 خط / كثافة / تباعد

| المعنى | ملف | حكم |
|---|---|---|
| خطوط UI | `fonts-ui.css` (+ bold مؤجّل) | KEEP |
| مقياس طباعة | `typography-scale.css` · `typography-app.css` | CONSOLIDATE → Foundation |
| كثافة/هندسة | `sunnah-geometry-system.css` · `breakpoints.css` | CONSOLIDATE |
| Reading prose | `reading-prose-system.css` · `content-reading-shell.css` | PORT إلى Reading density |

### 2.3 ارتفاع الصفحة / insets / z-index

| المعنى | ملف / مكوّن | حكم |
|---|---|---|
| Bottom nav height | m2030/navigation · final-release · App shell | CONSOLIDATE inset مركزي |
| Scroll-to-top | `ScrollToTop.tsx` + final-release / calm-polish | يدخل FloatingLayerManager |
| Floating back | `FloatingBackButton.tsx` | يدخل FloatingLayerManager أو يُحذف إن بلا وظيفة |
| Mini player | `QuranMiniPlayerBar` | inset مشترك |
| مصحف audio dock | `mushaf-reader.css` `--audio-player-height` | داخل طبقة المصحف فقط |

### 2.4 قواعد `!important` (أعلى الملفات)

`premium-dark-refine` 213 · `final-release` 211 · `sections-calm-polish` 200 · `visual-identity-unify` 167 · `dark-mode-surfaces` 161 · …  
أي `!important` جديد في Foundation = مرفوض إلا بند موثّق.

### 2.5 ترتيب Cascade الفعلي (مبسط)

```
fonts-ui → theme(--mj) → ssunnah-api → brand-v4 → tokens → design-tokens
→ visual-redesign-v2 → identity-reset → typography → index → modern-section-shell
→ theme-aliases → semantic-layer → visual-identity-unify → calm-polish → section-cards
→ ssunnah-ux-polish → interaction-states → dark-recovery
—— idle / load ——
green-surface → soft-cards → semantic-tokens → card-unify → modern-ui-refresh
→ ds-canonical → m2030 → brand-v4-contrast → design-system → final-release
→ (reload) visual-identity-unify → dark-recovery → strip-cleanup
→ SVL → geometry → visual-refresh-v1 → native-feel → m2030 pages
```

**الفائز العملي:** آخر طبقة مؤجّلة ذات خصوصية/`!important` (غالبًا final-release + dark-recovery + unify المعاد).

---

## 3) تصنيف الأنظمة (KEEP / CONSOLIDATE / PORT / REMOVE / BLOCKED)

| نظام | حكم PR-0 | ملاحظة |
|---|---|---|
| `theme.css` / `--mj-*` | KEEP | نواة مرشّحة لـ SunnahFoundation |
| `ssunnah-theme-api` / `--ss-*` | KEEP | جسر استهلاك |
| Identity Reset + chrome-nav | KEEP | إلى أن تُستبدل بـAppHeader موحّد (PR-2) |
| brand-v4 + m2030 + final-release | CONSOLIDATE | لا حذف جملة في PR-0 |
| green-surface-system | CONSOLIDATE | إزالة الاستخدام الصفحي الواسع لاحقًا |
| soft-cards + hub-card الضخمة | CONSOLIDATE | FeatureCard / ContentRow |
| ExploreAlso dashed footer | REMOVE نمط الإطار | استبدال CompactNavigationRow (PR-4/7) |
| Hadith `#sutr-*` في UI | REMOVE عرض | Disclosure / إخفاء (PR-6) |
| FloatingBack الدائم بلا سياق | CONSOLIDATE/REMOVE | PR-3 |
| ScrollToTop الدائم | CONSOLIDATE | يظهر بعد تمرير فقط (PR-3) |
| MushafAppearanceTheme EMERALD\|GOLD | KEEP | إصلاح مسار UI + dark cascade في PR-8 |
| Opening marker size split | CONSOLIDATE | MushafOpeningSpreadLayout PR-10 |
| QPC / page mapping / نص القرآن | **BLOCKED** | ممنوع المساس |

---

## 4) مكوّنات مكررة (عيّنة)

**Cards:** FeatureCard · ContentCard · SectionCard · HubCard · HadithCard · HadithEntryCard · HadithListCard · LessonCard · SurahInfoCard · InternalLinkCard · InformationCard · ReadingSectionCard · …  
**Heroes:** PageHero · PageHeroIntegratedBack · SectionHero · HomeHeroLcp  
**Headers:** App chrome · MushafPageHeader · page-specific headers  

هدف لاحق: AppHeader · PageHeader · FeatureCard · ContentRow · ReadingSection فقط للأسطح العامة.

---

## 5) مصحف — عقد حالي (بعد #2231)

| بند | حالة |
|---|---|
| `MushafAppearanceTheme` | موجود: `EMERALD` \| `GOLD` |
| تخزين | `ssunnah-mushaf-accent-theme-v1` |
| تطبيق | `data-mushaf-accent` على `.nm-root` + `html` |
| علامة واحدة | `.nm-ayah-mark` عبر توكنات — لا Green/Gold components |
| Flag | `QURAN_EXPERIENCE_NEXT.dualAppearanceThemes: true` |
| Opening لم يعد يفرض فيروزيًا منفصلًا للون | ✅ ألوان من Accent |
| Opening ما زال يكسر مقاس/font-size العلامة | ❌ PR-10 |
| GOLD عبر storage/DOM | ✅ مثبت حيًا |
| مسار «اختيار من اللوحة» بلاغ مستخدم | ⚠ PR-8 |

---

## 6) Baseline Screenshots

المجلد: `docs/design/foundation-reset-baseline/`

| ملف | محتوى |
|---|---|
| `01-home.png` | الرئيسية 390×844 |
| `02-quran-hub.png` | مركز القرآن |
| `03-hadith.png` | الحديث |
| `04-mushaf-p1-emerald.png` | مصحف ص١ زمردي |
| `05-mushaf-p1-gold.png` | مصحف ص١ ذهبي |
| `06-mushaf-p2-emerald.png` | مصحف ص٢ زمردي |
| `07-mushaf-p3-gold.png` | مصحف ص٣ ذهبي |

---

## 7) خطة PRs (مرجعية — لا تنفيذ متوازٍ)

| PR | موضوع |
|---|---|
| **0** | هذا المستند + اللقطات + بوابة وجود الخريطة |
| 1 | SunnahFoundation tokens + typography + density |
| 2 | Header + nav + safe insets |
| 3 | FloatingLayerManager |
| 4 | Cards / rows / reading sections |
| 5 | Reading pages علمية |
| 6 | Hadith + search/filters + إخفاء IDs |
| 7 | Quran Hub + Surah info |
| 8 | إصلاح مسار GOLD + dark cascade |
| 9 | رقم الآية a11y |
| 10 | Opening spread balance |
| 11 | Dark Mode polish |
| 12 | Responsive / a11y / visual regression |
| 13 | Legacy CSS removal بعد نجاح الترحيل |

كل PR من أحدث `main`؛ لا تُبدأ التالية قبل دمج السابقة.

---

## 8) ما لن يفعله PR-0

- لا حذف CSS تشغيلي.
- لا تغيير مصحف/Geometry/نص.
- لا Foundation tokens جديدة بعد.
- لا إعلان `SUNNAH_FOUNDATION_REBUILD_COMPLETE`.
