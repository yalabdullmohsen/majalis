/**
 * بوابة الإقلاع: بلا دخولية/ترحيب داخل التطبيق، خلفية سطح فاتحة، إخفاء أصلي سريع.
 * تشغيل: node --import tsx src/lib/__tests__/launch-splash-unified.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
/** سطح الرئيسية — بلا خلفية خضراء دعائية */
const BG = "#F2F4F3";

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.match(indexHtml, /id="mj-silent-splash"/, "طبقة لون تقنية فقط");
assert.doesNotMatch(indexHtml, /mj-silent-splash__path/, "بلا شعار دخولية");
assert.doesNotMatch(indexHtml, /mj-silent-splash__title/, "بلا عنوان دخولية");
assert.doesNotMatch(indexHtml, /mj-silent-splash__subtitle/, "بلا سطر دخولية");
assert.doesNotMatch(indexHtml, /mj-silent-splash__progress/, "بلا مؤشر دخولية");
assert.doesNotMatch(indexHtml, /stroke-dashoffset/, "بلا dashoffset غير مركّب على الدخولية");
assert.doesNotMatch(indexHtml, /mj-ss-draw|mj-ss-glow/, "بلا رسم/توهج متأخر");
assert.match(indexHtml, /prefers-reduced-motion:\s*reduce/, "مسار بلا حركة");
assert.match(indexHtml, /__mjDismissSplash/, "دالة dismiss للطبقة التقنية");
assert.match(indexHtml, /MIN_MS\s*=\s*0/, "بلا حد أدنى حاجب");
assert.match(indexHtml, /dismiss\(true\)/, "إزالة فورية");
assert.doesNotMatch(indexHtml, /id="mj-boot-skeleton"/, "بلا هيكل تحميل كامل الشاشة");
{
  const crit = indexHtml.match(/<style id="mj-lcp-critical">([\s\S]*?)<\/style>/)?.[1] ?? "";
  assert.doesNotMatch(crit, /Aref\s+Ruqaa/, "بلا رقعة في CSS الحرج — يمنع وميض الخط");
}
assert.match(
  indexHtml,
  new RegExp(`background-color:\\s*(${BG}|var\\(--mj-splash-bg\\)|#F2F4F3)`),
  "خلفية html/body",
);
assert.match(indexHtml, new RegExp(`theme-color" content="${BG}"`), "theme-color الإقلاع مطابق");
assert.match(indexHtml, /--mj-splash-bg:\s*var\(--mj-splash-bg-light\)/, "الدخول الافتراضي فاتح");
assert.doesNotMatch(indexHtml, /apple-touch-startup-image/, "لا صور إقلاع PWA");
assert.doesNotMatch(indexHtml, /splash-boot\.css/, "لا splash-boot.css");
assert.doesNotMatch(indexHtml, /id="mj-boot-splash"/, "لا طبقة boot قديمة");
assert.doesNotMatch(indexHtml, /preload[^>]+icon-192\.webp/, "لا preload شعار للدخولية");
{
  const preconnects = [...indexHtml.matchAll(/rel="preconnect"/g)];
  assert.ok(preconnects.length <= 2, `preconnect ≤ ٢ (الفعلي: ${preconnects.length})`);
}

const splashTs = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
assert.match(splashTs, /SplashScreen\.hide/, "يخفي الإطلاق الأصلي");
assert.match(splashTs, /SPLASH_MIN_VISIBLE_MS\s*=\s*0/);
assert.match(splashTs, /SPLASH_FADE_OUT_MS\s*=\s*0/, "إخفاء بلا تلاشي حاجب");
assert.match(splashTs, /requestAnimationFrame/, "إخفاء عند أول إطار");
assert.doesNotMatch(splashTs, /MajlisLaunchScreen/);

const mainSrc = readFileSync(resolve(root, "src/main.tsx"), "utf8");
assert.match(mainSrc, /mj:app-painted/, "main يعلن أول رسم");
assert.match(mainSrc, new RegExp(BG));
assert.doesNotMatch(mainSrc, /AppSplash/, "مكوّن AppSplash محذوف");

const launch = readFileSync(
  resolve(root, "ios/App/App/Base.lproj/LaunchScreen.storyboard"),
  "utf8",
);
assert.doesNotMatch(launch, /image="LaunchMark"/, "بلا رمز نجمة في LaunchScreen");
assert.doesNotMatch(launch, /<imageView\b/, "بلا ImageView");
assert.doesNotMatch(launch, /المجلس العلمي/, "بلا عنوان دعائي");
assert.doesNotMatch(launch, /دروس شرعية/, "بلا سطر دعائي");
assert.doesNotMatch(launch, /mk-progress/, "بلا شريط تقدّم");
assert.doesNotMatch(launch, /image="Splash"/, "بلا Splash قديم");
assert.doesNotMatch(launch, /systemBackgroundColor/, "بلا خلفية نظام بيضاء");
assert.match(launch, /safeArea|Safe area/i, "يحترم safe area");
assert.match(launch, /0\.94901960784313721/, `خلفية ${BG}`);

const capTs = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
assert.match(capTs, /launchShowDuration:\s*0/, "مدة إظهار Splash = 0");
assert.match(capTs, /launchAutoHide:\s*false/, "إخفاء برمجي — لا فجوة بيضاء قبل HTML");
assert.match(capTs, /showSpinner:\s*false/, "بلا مؤشر تحميل أصلي");
assert.match(capTs, new RegExp(`backgroundColor:\\s*"${BG}"`), "لون خلفية مطابق");

const styles = readFileSync(resolve(root, "android/app/src/main/res/values/styles.xml"), "utf8");
assert.match(styles, /Theme\.SplashScreen/);
assert.match(styles, /windowSplashScreenBackground/);
assert.match(styles, /@drawable\/splash_icon/);

assert.ok(!existsSync(resolve(root, "android/app/src/main/res/drawable/splash.png")), "لا splash.png قديم");
assert.ok(existsSync(resolve(root, "android/app/src/main/res/drawable/splash.xml")), "splash لون XML");
assert.ok(existsSync(resolve(root, "android/app/src/main/res/drawable/splash_icon.xml")), "splash_icon");
const splashIconXml = readFileSync(
  resolve(root, "android/app/src/main/res/drawable/splash_icon.xml"),
  "utf8",
);
assert.doesNotMatch(splashIconXml, /#C9A227/, "بلا نجمة ذهبية");
assert.match(splashIconXml, new RegExp(BG), "خلفية الأيقونة = سطح");

const colors = readFileSync(resolve(root, "android/app/src/main/res/values/colors.xml"), "utf8");
assert.match(colors, new RegExp(`splash_background">${BG}<`));

assert.ok(!existsSync(resolve(root, "ios/App/App/Assets.xcassets/Splash.imageset")), "لا Splash.imageset");
assert.ok(!existsSync(resolve(root, "assets/splash.png")), "لا assets/splash.png");
assert.ok(!existsSync(resolve(root, "public/brand/apple-splash")), "لا apple-splash يتيمة");
assert.ok(!existsSync(resolve(root, "public/brand/splash-boot.css")), "لا splash-boot.css");
assert.ok(!existsSync(resolve(root, "src/components/BrandReveal.tsx")), "BrandReveal محذوف");
assert.ok(!existsSync(resolve(root, "src/components/MajlisLaunchScreen.tsx")), "مكوّن React محذوف");
assert.ok(!existsSync(resolve(root, "src/components/MajalisLaunchScreen.tsx")), "الاسم القديم محذوف");
assert.ok(!existsSync(resolve(root, "src/components/AppSplash.tsx")), "AppSplash محذوف");
assert.ok(!existsSync(resolve(root, "src/styles/launch-screen.css")), "CSS React محذوف");
assert.ok(!existsSync(resolve(root, "src/lib/launch-intro.ts")), "launch-intro محذوف");
assert.ok(!existsSync(resolve(root, "src/lib/launch-readiness.ts")), "launch-readiness محذوف");
assert.ok(!existsSync(resolve(root, "src/styles/components/app-start.css")), "CSS شاشة البدء محذوف");

const xcassets = resolve(root, "ios/App/App/Assets.xcassets");
for (const name of readdirSync(xcassets)) {
  if (/splash|default@|splash-2732/i.test(name)) {
    assert.fail(`أصل يتيم في xcassets: ${name}`);
  }
}

const appSrc = readFileSync(resolve(root, "src/App.tsx"), "utf8");
assert.doesNotMatch(appSrc, /MajlisLaunchScreen|isLaunching|MajalisLaunchScreen/);
assert.doesNotMatch(
  appSrc,
  /WelcomeScreen|IntroScreen|BrandReveal|AppFirstRunHost|FirstRunSetup|AppFirstLaunchScreen|AppFeatureTourGate|AppStartGate/,
  "لا بوابة ترحيب أو شاشة بدء",
);
assert.ok(!existsSync(resolve(root, "src/components/AppFirstLaunchScreen.tsx")), "AppFirstLaunchScreen.tsx محذوف");
assert.ok(!existsSync(resolve(root, "src/components/onboarding/AppStartGate.tsx")), "AppStartGate محذوف");
assert.ok(!existsSync(resolve(root, "src/components/onboarding/AppStartView.tsx")), "AppStartView محذوف");
assert.ok(!existsSync(resolve(root, "src/components/onboarding/AppFeatureTourGate.tsx")), "جولة المزايا التلقائية محذوفة");

const info = readFileSync(resolve(root, "ios/App/App/Info.plist"), "utf8");
assert.match(info, /<key>CFBundleVersion<\/key>\s*<string>41<\/string>/, "CFBundleVersion رُفع");

const manifest = JSON.parse(readFileSync(resolve(root, "public/manifest.json"), "utf8"));
assert.equal(manifest.background_color, BG);
assert.equal(manifest.theme_color, "#F2F4F3");
assert.ok(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable"));

const swJs = readFileSync(resolve(root, "public/sw.js"), "utf8");
assert.match(swJs, /majlisilm-v\$\{SW_BUILD_ID\}/, "كاش SW مربوط بالبناء");
assert.match(swJs, /SW_UPDATED_RELOAD_ONCE/, "إعادة تحميل واحدة عند التحديث");

const swClient = readFileSync(resolve(root, "src/lib/service-worker.ts"), "utf8");
assert.match(swClient, /SW_UPDATED_RELOAD_ONCE/, "العميل يستمع لإعادة التحميل الواحدة");
assert.match(swClient, /hadController/, "لا reload عند أول claim");

const brand = readFileSync(resolve(root, "src/components/BrandWordmark.tsx"), "utf8");
assert.match(brand, /MajlisWordmark|viewBox=/, "وردمارك SVG عبر MajlisWordmark");
const majlisMark = readFileSync(resolve(root, "src/components/brand/MajlisWordmark.tsx"), "utf8");
assert.match(majlisMark, /viewBox=/, "MajlisWordmark SVG");
assert.match(majlisMark, /currentColor|fill="currentColor"/, "لون يتبع الثيم");
assert.match(majlisMark, /aria-label="المجلس العلمي"/, "تسمية وصول");
assert.match(majlisMark, /WORDMARK_PATH|path d=/, "مسارات ثابتة بلا خط وقت التشغيل");

console.log("launch-splash-unified.test.ts: ok");
