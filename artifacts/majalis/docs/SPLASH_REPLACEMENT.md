# دخولية MajlisSplash

دخولية احترافية خفيفة: وردمارك SVG + عبارة «علم نافع، وعمل صالح» على سطح `#F2F4F3` / `#101614`.

## المصدر المعتمد

1. الويب: SVG مضمّن في `index.html` (`#mj-launch-splash`) مع أنماط في `<style id="mj-splash-critical">`.
2. React: `src/components/MajlisSplash.tsx` + `src/lib/majlis-splash.ts` (ثوابت التوقيت).
3. iOS: `LaunchScreen.storyboard` (لون سطح مطابق — بلا نص أصلي).
4. Android 12+: `splash_background` + `drawable/splash_icon.xml`.
5. PWA: `manifest.background_color` = `#F2F4F3`.

## التوقيت

- حد أدنى: 700ms
- حد أقصى: 1000ms (لا انتظار تحميل بيانات)
- تُخفى عند `mj:app-painted` بعد الحد الأدنى

## ممنوع

- الخلفية الخضراء الداكنة القديمة `#0E1A15` في الإقلاع
- `dismiss(true)` الفوري
- دخولية React حاجبة داخل `App.tsx`
