# تحويل المجلس العلمي إلى تطبيق

الموقع مُهيّأ الآن كتطبيق ويب تقدّمي (PWA) قابل للتثبيت مباشرةً، ويمكن تغليفه
لمتاجر التطبيقات بخطوات قليلة. هذا المستند يوضّح المسارات الثلاثة.

## 1) PWA قابل للتثبيت (جاهز الآن)

جاهز دون أي عمل إضافي:

- `public/site.webmanifest` (و`manifest.webmanifest` نسخة مطابقة): يحوي
  `id`, `name`, `display: standalone`, `theme_color`, أيقونات (SVG قابلة
  للتحجيم + 256 + 512 + أيقونة maskable)، و`shortcuts` لأربعة أقسام
  (الدروس، أوقات الصلاة، الأذكار، الأسئلة).
- `public/sw.js`: خدمة عامل (service worker) — شبكة-أولاً لقشرة التطبيق،
  وذاكرة-أولاً لبيانات القرآن والدروس، مع صفحة `offline.html`.
- `index.html`: وسوم iOS (`apple-mobile-web-app-capable`,
  `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style`)
  و`theme-color` و`apple-touch-icon`.

**التثبيت:** يفتح المستخدم الموقع في المتصفح ثم «إضافة إلى الشاشة الرئيسية».

## 2) تطبيق أصلي عبر Capacitor (iOS + Android)

لبناء تطبيق أصلي يُرفع إلى App Store وGoogle Play مع الاحتفاظ بنفس شيفرة الويب:

```bash
# داخل artifacts/majalis
pnpm add -D @capacitor/cli
pnpm add @capacitor/core @capacitor/ios @capacitor/android
npx cap init "المجلس العلمي" com.majlisilm.app --web-dir=dist
pnpm run build          # يولّد dist/
npx cap add ios
npx cap add android
npx cap sync
npx cap open android    # أو ios (يتطلب macOS + Xcode)
```

- `--web-dir=dist` يوجّه Capacitor إلى ناتج `vite build`.
- بعد كل تحديث ويب: `pnpm run build && npx cap sync`.
- الأيقونات والشاشات الافتتاحية تُولّد بأداة `@capacitor/assets` من `logo.png`.

## 3) Android TWA (نشاط ويب موثوق)

لأندرويد فقط، بأقل مجهود، عبر Bubblewrap يُغلَّف الـ PWA كتطبيق أندرويد يعتمد
على المتصفح مباشرةً:

```bash
npx @bubblewrap/cli init --manifest https://majlisilm.com/site.webmanifest
npx @bubblewrap/cli build
```

يتطلب ملف `assetlinks.json` على النطاق لإثبات الملكية وإخفاء شريط المتصفح.

## ملاحظات

- كل المسارات الثلاثة تشترك في نفس شيفرة الويب وناتج `pnpm run build`.
- PWA وTWA يعكسان تحديثات الموقع فوراً؛ Capacitor يتطلب `cap sync` وإعادة نشر.
- لا يلزم تعديل منطق التطبيق أو المصادقة لأيٍّ من هذه المسارات.
