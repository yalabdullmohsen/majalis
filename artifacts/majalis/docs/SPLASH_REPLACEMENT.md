# الدخولية الصامتة

دخولية واحدة في المشروع: رمز هندسي ذهبي على خلفية `#0E1A15`، بلا نص.

## المصدر المعتمد

1. الويب: SVG مضمّن في `index.html` (`#mj-silent-splash`) مع أنماط في `<style id="mj-splash-critical">`. ليست مكوّن React.
2. iOS: `LaunchScreen.storyboard` (لون خلفية واحد + `LaunchMark` @1x/2x/3x). القصة ثابتة نظامياً.
3. Android 12+: `splash_background` + `drawable/splash_icon.xml`.
4. PWA: `manifest.background_color` = `#0E1A15`.

## توليد أصول الرمز

```bash
python3 scripts/generate-silent-splash-assets.py
```

لا تستخدم `@capacitor/assets generate` لشاشة الإقلاع — يعيد `Splash.imageset` و`splash-2732`. سكربت `assets:generate` يحذف تلك المخرجات بعد التشغيل ويعيد `LaunchMark`.

`pnpm run assets:splash` مقفل عمداً.

بعد أي تعديل أصلي ارفع `CFBundleVersion` (حالياً 40).
