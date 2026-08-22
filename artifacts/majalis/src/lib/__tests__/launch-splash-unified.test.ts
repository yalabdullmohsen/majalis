/**
 * بوابة الإقلاع: دخولية MajlisSplash موحّدة — ويب + أصلي.
 * تشغيل: node --import tsx src/lib/__tests__/launch-splash-unified.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const BG = "#F2F4F3";

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.match(indexHtml, /id="mj-launch-splash"/, "دخولية MajlisSplash في HTML الحرج");
assert.match(indexHtml, /mj-launch-splash__(wordmark|title)/, "عنوان الدخولية");
assert.match(indexHtml, /mj-launch-splash__tagline/, "عبارة الدخولية");
assert.match(indexHtml, /علم نافع، وعمل صالح/);
assert.doesNotMatch(indexHtml, /id="mj-silent-splash"/, "لا دخولية صامتة قديمة");
assert.doesNotMatch(indexHtml, /id="mj-boot-splash"/, "لا طبقة boot قديمة");
assert.doesNotMatch(indexHtml, /#0E1A15/, "لا خلفية خضراء داكنة قديمة في الإقلاع");
assert.match(indexHtml, /prefers-reduced-motion:\s*reduce/, "مسار بلا حركة");
assert.match(indexHtml, /__mjDismissSplash/, "دالة dismiss للدخولية");
assert.match(indexHtml, /MIN_MS\s*=\s*700/, "حد أدنى 700ms");
assert.match(indexHtml, /MAX_MS\s*=\s*1000/, "حد أقصى 1000ms");
assert.match(indexHtml, /splash_timing=1/, "معامل قياس توقيت الدخولية");
assert.match(indexHtml, /127\.0\.0\.1/, "مسار سريع لمعاينة CI المحلية");
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
assert.doesNotMatch(indexHtml, /preload[^>]+icon-192\.webp/, "لا preload شعار للدخولية");
{
  const preconnects = [...indexHtml.matchAll(/rel="preconnect"/g)];
  assert.ok(preconnects.length <= 2, `preconnect ≤ ٢ (الفعلي: ${preconnects.length})`);
}

const splashTs = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
assert.match(splashTs, /SplashScreen\.hide/, "يخفي الإطلاق الأصلي");
assert.match(splashTs, /SPLASH_MIN_VISIBLE_MS/);
assert.match(splashTs, /SPLASH_MAX_VISIBLE_MS/);
assert.match(splashTs, /requestAnimationFrame/, "إخفاء عند أول إطار");

const majlisSplash = readFileSync(resolve(root, "src/lib/majlis-splash.ts"), "utf8");
assert.match(majlisSplash, /SPLASH_MIN_VISIBLE_MS\s*=\s*700/);
assert.match(majlisSplash, /SPLASH_MAX_VISIBLE_MS\s*=\s*1000/);

const mainSrc = readFileSync(resolve(root, "src/main.tsx"), "utf8");
assert.match(mainSrc, /mj:app-painted/, "main يعلن أول رسم");
assert.match(mainSrc, /armNativeSplashController/);
assert.doesNotMatch(mainSrc, /__mjDismissSplash\?\.\(true\)/, "لا إزالة فورية للدخولية");

assert.ok(existsSync(resolve(root, "src/components/MajlisSplash.tsx")), "مكوّن MajlisSplash");

const launch = readFileSync(
  resolve(root, "ios/App/App/Base.lproj/LaunchScreen.storyboard"),
  "utf8",
);
assert.doesNotMatch(launch, /image="LaunchMark"/, "بلا رمز نجمة في LaunchScreen");
assert.doesNotMatch(launch, /<imageView\b/, "بلا ImageView");
assert.doesNotMatch(launch, /المجلس العلمي/, "بلا عنوان دعائي أصلي");
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
assert.ok(!existsSync(resolve(root, "src/components/MajlisLaunchScreen.tsx")), "مكوّن React قديم محذوف");
assert.ok(!existsSync(resolve(root, "src/styles/launch-screen.css")), "CSS React قديم محذوف");
assert.ok(!existsSync(resolve(root, "src/lib/launch-intro.ts")), "launch-intro محذوف");
assert.ok(!existsSync(resolve(root, "src/lib/launch-readiness.ts")), "launch-readiness محذوف");

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

const manifest = JSON.parse(readFileSync(resolve(root, "public/manifest.json"), "utf8"));
assert.equal(manifest.background_color, BG);
assert.equal(manifest.theme_color, "#F2F4F3");

const brand = readFileSync(resolve(root, "src/components/brand/MajlisWordmark.tsx"), "utf8");
assert.match(brand, /MAJLIS_WORDMARK_PATH/);
const majlisMark = readFileSync(resolve(root, "src/components/MajlisSplash.tsx"), "utf8");
assert.match(majlisMark, /MajlisSplashWordmark/);
assert.match(majlisMark, /SPLASH_TAGLINE/);

console.log("launch-splash-unified.test.ts: ok");
