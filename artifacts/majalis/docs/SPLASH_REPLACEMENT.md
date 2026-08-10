# استبدال صورة شاشة الإقلاع (iOS)

شاشة الإطلاق الأصلية في iOS لا تُلغى بالكامل؛ الحد الأقصى خلفية لونية صامتة. عند الحاجة لصورة مجدّدًا:

## ثلاث خطوات

1. ضع الصورة الجديدة في الموضع الوحيد المعتمد:
   `artifacts/majalis/assets/splash.png`
   بمقاس **2732×2732** بكسل (مربع، جاهز لـ Capacitor Assets).

2. من مجلد `artifacts/majalis` شغّل:
   ```bash
   npx @capacitor/assets generate --ios
   ```

3. راجع `ios/App/App/Assets.xcassets/Splash.imageset` و`LaunchScreen.storyboard` (إن أعاد التوليد صورة)، ثم `npx cap sync ios` وارفع `CFBundleVersion`.

لا تضع صورة الإقلاع في مواضع أخرى يدويًا — هذا المسار هو المصدر الوحيد للتوليد.
