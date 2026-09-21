# دخولية سُنّة — واحدة فقط

## المسار الرسمي

1. **Native Launch Screen** — لون عاجي `#F7F3EB` فقط (بلا شعار/نص).
2. **`#mj-launch-splash`** في `index.html` — سُنّة + «رفيقك في العلم والعمل» + هندسة خفيفة.
3. **التطبيق** بعد `mj:shell-stable` (أو السقف 1400ms).

## ممنوع

- عبارة «معك في العلم والعمل»
- دخولية Capacitor ظاهرة كشاشة ثانية (تُخفى فور `armNativeSplashController`)
- `#mj-silent-splash` / LaunchMark / silent-splash PNG داكنة
- Timers تجميلية (`SPLASH_MIN_VISIBLE_MS = 0`)
- إعادة الدخولية عند Resume

## المصدر

| سطح | ملف |
|---|---|
| HTML | `index.html` + `public/mj-launch-splash-boot.js` |
| ثوابت | `src/lib/majlis-splash.ts` |
| متحكّم | `src/lib/splash-screen.ts` |
| iOS | `LaunchScreen.storyboard` (لون فقط) |
| Android | `splash_background` + `splash_icon.xml` (لون) |

## التوقيت

- `MIN = 0` · `SOFT = 480` · `MAX = 1400` · `FADE = 160`
- Capacitor: `hide(immediate)` عند التسليح
- HTML: يُخفى عند `mj:shell-stable`
