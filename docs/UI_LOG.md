# سجل واجهة — شريط أبيض / كروم

## المهمة ١ — شريط أبيض أسفل صفحة الصلاة (2026-08-17)

### التشخيص (قبل التعديل)

| الطبقة | العنصر | مصدر اللون الفاتح |
|---|---|---|
| الجذر | `#root` / `.app-shell` | `foundation.css` + `final-release.css`: `--mj-bg` / `#F2F4F3` |
| الكروم | `html, body, #root` في `app-chrome-scroll.css` (يستورده `NavBar`) | `--app-bg` = `--mj-bg` `#f2f4f3` — يغطي html/body بعد طبقة الإقلاع الخضراء |
| الشاشة | `.pts-screen` | زمرد صحيح (`--pts-bg-1` → `#0E2A22`)؛ `min-height: 100dvh` مع `padding-bottom` للشريط |
| زر الإغلاق | `.pts-sheet-close` | `position: sticky; bottom: 0` + تدرّج إلى `transparent` عبر `--pts-bg` **غير المعرّف** (المعرّف `--pts-bg-0`) + `padding` بـ `inset-bottom` فوق حشو الشاشة — الفجوة بين الزر والشريط تكشف `#root` |
| الشيت shadcn | `SheetContent` / `DrawerContent` / `DialogContent` | `bg-background` (قد يحلّ إلى سطح أبيض) |
| Capacitor | `StatusBar.backgroundColor` | `#F2F4F3` — **لم يُغيَّر**: `capacitor.config.ts` مسار خطر للدمج التلقائي. iOS `backgroundColor` أصلًا `#0E1A15` |

`html.pts-immersive body` كان يُطلى بـ `--em-950`، **بدون** `#root`. لذلك أي نقص في ارتفاع `.pts-screen` يظهر رماديًا/أبيضًا بين «إغلاق» والشريط السفلي.

`100vh`/`h-screen` في CSS الصفحات: صفر. بقي `min-h-screen` في صفحتين غير الصلاة (استُبدل بـ `min-h-dvh`).

`viewport-fit=cover` موجود في `index.html`.

الشريط السفلي العام يبقى أبيضًا على الصفحات الفاتحة (بوابة `bottom-nav-safe-area-green.test.ts`). صفحة الصلاة تتجاوزه بـ `html.pts-immersive .bottom-nav`.

Playwright (`tests/chrome-no-white-strip.spec.ts`): نسبة البكسل شبه الأبيض على `/prayer-times` فقط — الصفحات الفاتحة تملك شريطاً سفلياً أبيض عمداً (`bottom-nav-safe-area-green`). بقية المسارات تفحص أن الشريط ملاصق لأسفل الإطار (لا فجوة). البوابة في CI: `test:status-bar-safe-area` (ضمن `test:ci-unit`).

## المهمة ٢ — الدرج من اليمين RTL (2026-08-17)

السبب: `.drawer-panel` كان `inset-inline-end: 0` + `right: auto` — في RTL الـ inline-end هو اليسار. أُصلح إلى `inset-inline-start: 0` مع `html[dir="rtl"] { transform: translateX(100%) }` عند الإخفاء.

إيماءة الفتح من الحافة اليمنى على `/` فقط (لا تتعارض مع سحب الرجوع في الصفحات المتفرّعة). الإغلاق بسحب نحو اليمين. المدة 200ms. بلا `left`/`right` في CSS الدرج.

---

### ما عُالج (المهمة ١)

1. طلاء `#root` / `.app-shell` / `.app-main` تحت `html.pts-immersive`.
2. استثناء `.pts-immersive` من خلفية `--app-bg` في `app-chrome-scroll.css`.
3. `overscroll-behavior: none` + `min-height: 100vh` ثم `100dvh` على html/body.
4. `.pts-sheet-close`: تدفق مرن (`margin-block-start: auto`) وطلاء `--pts-bg-0` بلا sticky.
5. `bg-background` في sheet/drawer/dialog/alert-dialog → `bg-[var(--mj-surface)]`.
6. لم يُمس `capacitor.config.ts`.
