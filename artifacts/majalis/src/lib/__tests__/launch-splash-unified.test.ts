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
const BG = "#F7F3EB";

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.match(indexHtml, /id="mj-launch-splash"/, "دخولية MajlisSplash في HTML الحرج");
assert.match(indexHtml, /mj-launch-splash__tagline/, "عبارة قصيرة تحت الاسم");
assert.match(indexHtml, /رفيقك في العلم والعمل/, "عبارة الدخولية");
assert.match(indexHtml, /mj-launch-splash__title/, "عنوان الهوية سُنّة");
assert.match(indexHtml, /mj-launch-splash__progress/, "خط تقدّم أنيق");
assert.doesNotMatch(indexHtml, /mj-launch-splash__pulse/, "بلا نبض دوّار قديم");
assert.doesNotMatch(indexHtml, /علم نافع، وعمل صالح/, "بلا عبارة قديمة");
assert.doesNotMatch(indexHtml, /معك في العلم والعمل/, "بلا عبارة الدخولية السابقة");
assert.doesNotMatch(indexHtml, /id="mj-silent-splash"/, "لا دخولية صامتة قديمة");
assert.doesNotMatch(indexHtml, /id="mj-boot-splash"/, "لا طبقة boot قديمة");
assert.doesNotMatch(indexHtml, /#0E1A15/, "لا خلفية خضراء داكنة قديمة في الإقلاع");
assert.match(indexHtml, /prefers-reduced-motion:\s*reduce/, "مسار بلا حركة");
assert.match(indexHtml, /src="\/mj-launch-splash-boot\.js"/, "دخولية الإطلاق من ملف خارجي (CSP self)");
const bootJs = readFileSync(resolve(root, "public/mj-launch-splash-boot.js"), "utf8");
assert.match(bootJs, /__mjDismissSplash/, "دالة dismiss للدخولية");
assert.match(bootJs, /MIN_MS\s*=\s*0/, "بلا تأخير اصطناعي عند الجاهزية");
assert.match(bootJs, /SOFT_MAX_MS\s*=\s*480/, "هدف LCP ليّن 480ms");
assert.match(bootJs, /MAX_MS\s*=\s*1400/, "سقف صلب لخطوط الواجهة");
assert.match(bootJs, /EXIT_MS\s*=\s*160/, "تلاشي خروج 160ms");
assert.match(bootJs, /session\.v4/, "مفتاح جلسة الدخولية v4");
assert.match(bootJs, /splash_timing=1/, "معامل قياس توقيت الدخولية");
assert.match(bootJs, /127\.0\.0\.1/, "مسار سريع لمعاينة CI المحلية");
assert.match(indexHtml, /transition:opacity \.16s/, "تلاشي CSS 160ms");
assert.doesNotMatch(indexHtml, /id="mj-boot-skeleton"/, "بلا هيكل تحميل كامل الشاشة");
{
  const crit = indexHtml.match(/<style id="mj-lcp-critical">([\s\S]*?)<\/style>/)?.[1] ?? "";
  assert.doesNotMatch(crit, /Aref\s+Ruqaa/, "بلا رقعة في CSS الحرج — يمنع وميض الخط");
}
assert.match(
  indexHtml,
  new RegExp(`background-color:\\s*(${BG}|var\\(--mj-splash-bg\\)|#F7F3EB)`),
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
assert.match(splashTs, /mj:shell-stable/, "إخفاء HTML بعد استقرار الهيكل");
assert.match(splashTs, /hideCapacitorSplash\(true\)/, "إخفاء Capacitor فور التسليح");
assert.match(splashTs, /dismissHtmlLaunchSplash/, "HTML مستقل عن Capacitor");
assert.doesNotMatch(splashTs, /SplashScreen\.show\s*\(/, "ممنوع إعادة إظهار Splash على Resume");
assert.doesNotMatch(
  splashTs,
  /addEventListener\(\s*["']mj:boot-ready["']/,
  "لا إخفاء HTML مبكر على boot-ready",
);
assert.doesNotMatch(
  splashTs,
  /addEventListener\(\s*["']mj:app-painted["']/,
  "لا إخفاء HTML مبكر على app-painted",
);

const majlisSplash = readFileSync(resolve(root, "src/lib/majlis-splash.ts"), "utf8");
assert.match(majlisSplash, /SPLASH_MIN_VISIBLE_MS\s*=\s*0/);
assert.match(majlisSplash, /SPLASH_LCP_SOFT_MS\s*=\s*480/);
assert.match(majlisSplash, /SPLASH_MAX_VISIBLE_MS\s*=\s*1_?400|SPLASH_MAX_VISIBLE_MS\s*=\s*1400/);
assert.match(majlisSplash, /SPLASH_FADE_OUT_MS\s*=\s*160/);
assert.match(majlisSplash, /رفيقك في العلم والعمل/);
assert.match(majlisSplash, /session\.v4/);

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
assert.doesNotMatch(launch, /سُنّة/, "بلا عنوان دعائي أصلي");
assert.doesNotMatch(launch, /mk-progress/, "بلا شريط تقدّم");
assert.doesNotMatch(launch, /image="Splash"/, "بلا Splash قديم");
assert.doesNotMatch(launch, /systemBackgroundColor/, "بلا خلفية نظام بيضاء");
assert.match(launch, /safeArea|Safe area/i, "يحترم safe area");
assert.match(launch, /name="LaunchBackground"/, "خلفية LaunchScreen من أصل لوني فاتح/داكن");
assert.doesNotMatch(launch, /<label\b/i, "بلا نصوص تحميل أصلية");
assert.doesNotMatch(launch, /UIActivityIndicator|progressView|mk-progress/i, "بلا Progress أصلي");
assert.doesNotMatch(launch, /0\.94901960784313721/, "بلا خلفية #F2F4F3 القديمة");

const launchColorset = readFileSync(
  resolve(root, "ios/App/App/Assets.xcassets/LaunchBackground.colorset/Contents.json"),
  "utf8",
);
assert.match(launchColorset, /"luminosity"[\s\S]*"dark"/, "لون ليلي لـ LaunchBackground");
assert.match(launchColorset, /0\.969|0\.968/, "مكوّن أحمر ≈ #F7F3EB");

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
assert.ok(!existsSync(resolve(root, "ios/App/App/Assets.xcassets/LaunchMark.imageset")), "لا LaunchMark قديم");
assert.ok(!existsSync(resolve(root, "public/brand/silent-splash-390x844.png")), "لا silent-splash أخضر");
assert.ok(!existsSync(resolve(root, "public/brand/silent-splash-390x844-dark.png")), "لا silent-splash dark");
assert.ok(!existsSync(resolve(root, "public/brand/silent-splash-mark-512.png")), "لا silent-splash mark");
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
  if (/splash|LaunchMark|default@|splash-2732/i.test(name)) {
    assert.fail(`أصل يتيم في xcassets: ${name}`);
  }
}

const appSrc = readFileSync(resolve(root, "src/App.tsx"), "utf8") + "\n" + readFileSync(resolve(root, "src/AppRoutes.tsx"), "utf8");
assert.doesNotMatch(appSrc, /MajlisLaunchScreen|isLaunching|MajalisLaunchScreen/);
assert.doesNotMatch(
  appSrc,
  /WelcomeScreen|IntroScreen|BrandReveal|AppFirstRunHost|FirstRunSetup|AppFirstLaunchScreen|AppFeatureTourGate|AppStartGate/,
  "لا بوابة ترحيب أو شاشة بدء",
);

const manifest = JSON.parse(readFileSync(resolve(root, "public/manifest.json"), "utf8"));
assert.equal(manifest.background_color, BG);
assert.equal(manifest.theme_color, "#F7F3EB");

const brand = readFileSync(resolve(root, "src/components/brand/MajlisWordmark.tsx"), "utf8");
assert.match(brand, /سُنّة/, "وردمارك يعرض سُنّة");
assert.doesNotMatch(brand, /MAJLIS_WORDMARK_PATH/, "بلا مسار SVG للاسم القديم");
const majlisMark = readFileSync(resolve(root, "src/components/MajlisSplash.tsx"), "utf8");
assert.match(majlisMark, /MajlisSplashWordmark/);
assert.match(majlisMark, /MajlisWordmark/);

console.log("launch-splash-unified.test.ts: ok");
