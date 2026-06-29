# Phase 1B — Information Architecture & Premium Islamic UI

**Branch:** `cursor/ia-premium-ui-92e6`  
**Date:** 2026-06-26

---

## 1. الصفحات التي أُعيد ترتيبها

| الصفحة | التغيير |
|--------|---------|
| **الرئيسية** | إعادة بناء كاملة — 15+ قسمًا بالترتيب المطلوب |
| **القائمة الجانبية** | 5 مجموعات IA بدل 5 مجموعات متداخلة/مكررة |
| **Footer** | 4 أعمدة متوافقة مع IA |
| **شريط التنقل** | 8 عناصر أساسية (بدون ازدحام) |

---

## 2. الأقسام التي نُقلت

| من | إلى (مجموعة IA) |
|----|-----------------|
| محتوى + قرآن (مكرر) | **القرآن الكريم** (مجموعة مستقلة) |
| دروس، فتاوى، QA، أبحاث | **العلوم الشرعية** |
| مسارات، دورات، تقويم | **التعلّم** |
| أذكار، صلاة، تسبيح | **العبادة اليومية** |
| باحث علمي، مساعد، تواصل | **الخدمات** |

---

## 3. المسميات التي صُححت

| قبل | بعد |
|-----|-----|
| الأسئلة (غامض) | **فتاوى وأسئلة** (أرشيف) vs **سؤال وجواب** (لعبة) |
| الاستماع | **الإذاعة** |
| الحلقات القرآنية والعلمية (تكرار) | **الحلقات** / **المتون والحلقات** |
| المكتبة العلمية | **المكتبة** |
| الباحث العلمي | ثابت في الخدمات مع وصف |

---

## 4. الألوان الجديدة

| Token | قبل | بعد |
|-------|-----|-----|
| `--ds-parchment` | `#faf7f0` | `#f0e9dc` |
| `--ds-parchment-deep` | `#f0ebe0` | `#e4dac8` |
| `--ds-emerald` | `#1a6b52` | `#18634c` |
| `--ds-emerald-deep` | `#134a3a` | `#0f3f31` |
| `--ds-ink-soft` | `#5c564c` | `#4f483c` |
| `--ds-line-color` | `#e4ddd0` | `#d4c9b6` |
| `--majalis-panel` | `#FFFFFF` | `#F7F2E8` |

النتيجة: خلفيات أغمق قليلًا، تباين أعلى، قراءة أكثر راحة — دون dark mode قاتم.

---

## 5. الزخارف الإسلامية المضافة

- `IslamicGeometricPattern` — نمط SVG هندسي في Hero
- `IslamicDivider` — فاصل زخرفي (Footer + العناوين)
- `IslamicHeadingOrnament` — زخرفة تحت العناوين الرئيسية
- `IslamicCornerBorder` — إطار زاوي (جاهز للبطاقات)
- `ui-card--ornate` — شريط زمردي/ذهبي على البطاقات

---

## 6. الملفات المعدلة

**جديد:**
- `src/components/islamic/IslamicOrnament.tsx`
- `src/styles/islamic-ui.css`
- `src/components/home/HomeResearchSection.tsx`
- `src/components/home/HomeCirclesSection.tsx`
- `src/components/home/HomeSheikhsSection.tsx`
- `src/components/home/HomePlatformStats.tsx`
- `scripts/verify-ia-premium-ui.mjs`

**محدّث:**
- `src/lib/navigation.ts`
- `src/views/HomePage.tsx`
- `src/components/SiteFooter.tsx`
- `src/components/SideNavDrawer.tsx`
- `src/components/home/HomeFeatureCards.tsx`
- `src/components/home/HomeFeaturedLibrary.tsx`
- `src/components/home/HomeMoreSections.tsx`
- `src/styles/design-system.css`
- `src/index.css`
- `src/main.tsx`

---

## 7. نتائج الأداء

- **لا مكتبات جديدة** — SVG inline + CSS فقط
- **Lazy loading** — جميع المسارات كما هي
- **Code splitting** — build ناجح، chunks منفصلة للصفحة الرئيسية

---

## 8. نتائج الاختبارات

| الاختبار | النتيجة |
|----------|---------|
| `verify:ia-premium-ui` | ✅ |
| `typecheck` | ✅ |
| `build` | ✅ |
| `lint` | ✅ (warnings pre-existing) |
| Routes | ✅ — لا تغيير على المسارات |

---

## 9. قبل / بعد (وصف)

**قبل:** صفحة رئيسية v3 minimal (8 أقسام)، تنقل متفرق مع تكرار (حلقات في 3 أماكن)، ألوان فاتحة جدًا، emoji في المكتبة.

**بعد:** 15+ قسمًا مرتبًا، 5 مجموعات IA واضحة، Hero بزخرفة إسلامية، بطاقات موحّدة Lucide، ألوان parchment أغمق وأكثر فخامة، Footer منظّم.

---

## Routes — لم تتغير

جميع hrefs السابقة تعمل — التغييرات في التنظيم والعرض فقط.
