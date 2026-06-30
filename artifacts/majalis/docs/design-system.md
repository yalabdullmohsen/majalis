# نظام التصميم — المجلس العلمي
**Design System v2 | مجالس المنصة العلمية**

---

## لوحة الألوان

| المتغيّر | القيمة | الاستخدام |
|---|---|---|
| `--majalis-emerald` | `#1F6E54` | اللون الأساسي — الأزرار والروابط |
| `--majalis-emerald-deep` | `#164E3C` | العناوين والتأكيد |
| `--majalis-brass` | `#B08D2E` | اللون الثانوي — الذهبي |
| `--majalis-brass-deep` | `#8A6D1E` | الذهبي الداكن |
| `--majalis-parchment` | `#FAF5EA` | خلفية الصفحة (كريمي) |
| `--majalis-parchment-deep` | `#F0E8D6` | خلفية ثانوية |
| `--majalis-panel` | `#FFFFFF` | خلفية البطاقات |
| `--majalis-sage` | `#CFE0D3` | أخضر فاتح للخلفيات الثانوية |
| `--majalis-line` | `#E0D7C4` | لون الحدود |
| `--majalis-ink` | `#241F18` | النص الأساسي |
| `--majalis-ink-soft` | `#5B5446` | النص الثانوي |

### تدرجات جاهزة
```css
--ds-gold-grad:    linear-gradient(135deg, #d6b84e 0%, #b08d2e 55%, #c9a43e 100%)
--ds-emerald-grad: linear-gradient(135deg, #268a68 0%, #1f6e54 55%, #164e3c 100%)
--ds-hero-grad:    linear-gradient(155deg, #0a2b22 0%, #164e3c 42%, #1f6e54 72%, #0d3526 100%)
```

---

## نظام الطباعة

**الخط الأساسي:** Cairo → Tajawal → system-ui  
**خط القراءة (القرآن/المتون):** Noto Naskh Arabic  
**خط الرقعة:** Aref Ruqaa

| المستوى | الحجم | الوزن | الاستخدام |
|---|---|---|---|
| H1 | `clamp(2.2rem, 7vw, 4rem)` | 800 | عنوان الهيرو |
| H2 | `clamp(1.05rem, 2.4vw, 1.35rem)` | 700 | عناوين الأقسام |
| H3 | `1rem–1.2rem` | 700 | عناوين البطاقات |
| Body | `0.9rem–1rem` | 600 | المحتوى |
| Small | `0.75rem–0.85rem` | 600 | الميتا والعلامات |

---

## نظام التباعد

```css
--ds-1: 0.25rem  /* 4px  */
--ds-2: 0.5rem   /* 8px  */
--ds-3: 0.75rem  /* 12px */
--ds-4: 1rem     /* 16px */
--ds-5: 1.25rem  /* 20px */
--ds-6: 1.5rem   /* 24px */
--ds-8: 2rem     /* 32px */
--ds-10: 2.5rem  /* 40px */
--ds-12: 3rem    /* 48px */
--ds-16: 4rem    /* 64px */
```

---

## نظام الحواف الدائرية

```css
--ds-r-xs:   0.375rem   /* أزرار صغيرة، بيدجات */
--ds-r-sm:   0.625rem   /* حقول الإدخال        */
--ds-r-md:   0.875rem   /* أزرار قياسية         */
--ds-r-lg:   1.25rem    /* بطاقات المحتوى       */
--ds-r-xl:   1.75rem    /* بطاقات كبيرة/هيرو   */
--ds-r-2xl:  2.5rem     /* عناصر بارزة          */
--ds-r-full: 999px      /* حبوب وشارات          */
```

---

## نظام الظلال

```css
--ds-shadow-xs: 0 1px 4px rgba(36,31,24,.05)   /* رفع خفيف     */
--ds-shadow-sm: 0 4px 14px rgba(36,31,24,.07)   /* بطاقة هادئة  */
--ds-shadow-md: 0 10px 30px rgba(36,31,24,.10)  /* بطاقة عند hover */
--ds-shadow-lg: 0 20px 52px rgba(36,31,24,.13)  /* مودال/درج    */
--ds-shadow-xl: 0 32px 72px rgba(36,31,24,.16)  /* هيرو/بارز    */
```

---

## المكوّنات الأساسية

### الزر — `.ds-btn`

```html
<!-- الأنواع -->
<button class="ds-btn ds-btn-primary">أساسي أخضر</button>
<button class="ds-btn ds-btn-gold">ذهبي</button>
<button class="ds-btn ds-btn-ghost">شفاف</button>

<!-- الأحجام -->
<button class="ds-btn ds-btn-primary ds-btn-sm">صغير</button>
<button class="ds-btn ds-btn-primary ds-btn-lg">كبير</button>
<button class="ds-btn ds-btn-primary ds-btn-pill">مستدير</button>
```

### البطاقة — `.ds-card`

```html
<div class="ds-card" style="padding: 1.25rem;">
  محتوى البطاقة
</div>
```

### حقل الإدخال — `.ds-input`

```html
<input class="ds-input" type="text" placeholder="أدخل نصاً..." />
```

### رأس القسم — `.ds-section__head`

```html
<section class="ds-section">
  <div class="ds-section__head">
    <h2 class="ds-section__title">عنوان القسم</h2>
    <a href="/more" class="ds-section__link">عرض الكل</a>
  </div>
  <!-- محتوى القسم -->
</section>
```

---

## العناصر الزخرفية الإسلامية

### الفاصل بين الأقسام — `<IslamicDivider />`

```tsx
import { IslamicDivider } from "@/components/design/IslamicDivider";

// بين كل قسمين في الصفحة الرئيسية
<IslamicDivider />

// بحجم مخصص
<IslamicDivider size={24} />
```

### شريط الزخرفة — `<IslamicOrnament />`

```tsx
import { IslamicOrnament } from "@/components/design/IslamicOrnament";

// عند نهاية الهيرو أو بداية الفوتر
<IslamicOrnament
  className="islamic-ornament-strip"
  style={{ color: "rgba(176, 141, 46, 0.55)" }}
/>
```

---

## نقاط الانكسار

| الاسم | النطاق | السلوك |
|---|---|---|
| Mobile | `≤ 680px` | عمود واحد، padding أصغر |
| Tablet | `681–879px` | شبكة 2 أعمدة |
| Desktop | `880–1180px` | شبكة كاملة |
| Wide | `> 1180px` | `max-width: 1180px` مع margin: auto |

---

## الوضع الليلي (Dark Mode)

يُفعَّل بإضافة `data-theme="dark"` على عنصر `<html>`.  
جميع الألوان تتغير تلقائياً عبر CSS variables.

---

*آخر تحديث: يوليو 2026 — Design System v2*
