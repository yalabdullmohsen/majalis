/**
 * بوابة: إقلاع أصلي بلون صامت + دخولية ويب واحدة (MajalisLaunchScreen) بلا تكرار.
 * تشغيل: node --import tsx src/lib/__tests__/launch-splash-unified.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.doesNotMatch(indexHtml, /id="mj-boot-splash"/, "لا شاشة ويب وسيطة في HTML");
assert.doesNotMatch(indexHtml, /mj-boot-splash__logo/, "لا شعار ويب مكرر في HTML");
assert.doesNotMatch(indexHtml, /apple-touch-startup-image/, "لا صور إقلاع PWA");
assert.doesNotMatch(indexHtml, /splash-boot\.css/, "لا اعتماد على splash-boot.css");
assert.match(indexHtml, /background-color:\s*#002b21/, "خلفية WebView خضراء داكنة");
assert.match(indexHtml, /html,\s*body,\s*#root/, "خلفية inline على html/body/#root");
assert.match(indexHtml, /preload[^>]+icon-192\.png/, "preload لشعار الدخولية");

const splashTs = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
assert.doesNotMatch(splashTs, /mj-boot-splash/, "splash-screen لا يمس طبقة ويب قديمة");
assert.match(splashTs, /SplashScreen\.hide/, "يخفي الإطلاق الأصلي فقط");
assert.match(splashTs, /fadeOutDuration:\s*0/, "بلا تأخير/تلاشٍ مصطنع على الأصلي");
assert.match(splashTs, /requestAnimationFrame/, "إخفاء عند أول إطار");

const launch = readFileSync(
  resolve(root, "ios/App/App/Base.lproj/LaunchScreen.storyboard"),
  "utf8",
);
assert.doesNotMatch(launch, /image="Splash"/, "LaunchScreen بلا صورة Splash");
assert.doesNotMatch(launch, /<imageView\b/, "LaunchScreen بلا ImageView");
assert.doesNotMatch(launch, /systemBackgroundColor/, "بلا خلفية نظام بيضاء");
assert.match(launch, /safeArea|Safe area/i, "يحترم safe area في القصة");
assert.match(launch, /0\.16862745098039217/, "خلفية #002b21");

const capTs = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
assert.match(capTs, /launchShowDuration:\s*0/, "مدة إظهار Splash = 0");
assert.match(capTs, /launchAutoHide:\s*true/, "إخفاء تلقائي");
assert.match(capTs, /showSpinner:\s*false/, "بلا مؤشر تحميل");
assert.match(capTs, /backgroundColor:\s*"#002b21"/, "لون خلفية مطابق للتطبيق");

const styles = readFileSync(
  resolve(root, "android/app/src/main/res/values/styles.xml"),
  "utf8",
);
assert.match(styles, /Theme\.SplashScreen/);
assert.match(styles, /windowSplashScreenBackground/);
assert.match(styles, /@drawable\/splash_icon/);

assert.ok(!existsSync(resolve(root, "android/app/src/main/res/drawable/splash.png")), "لا splash.png قديم");
assert.ok(!existsSync(resolve(root, "android/app/src/main/res/drawable/splash_icon.png")), "لا splash_icon.png قديم");
assert.ok(existsSync(resolve(root, "android/app/src/main/res/drawable/splash.xml")), "splash لون XML");
assert.ok(existsSync(resolve(root, "android/app/src/main/res/drawable/splash_icon.xml")), "splash_icon لون XML");
const splashXml = readFileSync(resolve(root, "android/app/src/main/res/drawable/splash.xml"), "utf8");
assert.match(splashXml, /splash_background/, "splash.xml يستخدم لون الخلفية");
const splashIconXml = readFileSync(
  resolve(root, "android/app/src/main/res/drawable/splash_icon.xml"),
  "utf8",
);
assert.match(splashIconXml, /#002b21/, "أيقونة الإطلاق بلون صامت");
assert.ok(
  !existsSync(resolve(root, "android/app/src/main/res/drawable-port-xxxhdpi/splash.png")),
  "لا كثافات splash.png قديمة",
);
const main = readFileSync(
  resolve(root, "android/app/src/main/java/com/majlisilm/app/MainActivity.java"),
  "utf8",
);
assert.match(main, /SplashScreen\.installSplashScreen/);

const colors = readFileSync(
  resolve(root, "android/app/src/main/res/values/colors.xml"),
  "utf8",
);
assert.match(colors, /splash_background">#002b21</);

assert.ok(!existsSync(resolve(root, "ios/App/App/Assets.xcassets/Splash.imageset")), "لا Splash.imageset");
assert.ok(!existsSync(resolve(root, "assets/splash.png")), "لا assets/splash.png");
assert.ok(!existsSync(resolve(root, "public/brand/apple-splash")), "لا apple-splash يتيمة");
assert.ok(!existsSync(resolve(root, "public/brand/splash-boot.css")), "لا splash-boot.css");
assert.ok(!existsSync(resolve(root, "src/components/BrandReveal.tsx")), "BrandReveal محذوف");
assert.ok(!existsSync(resolve(root, "src/styles/components/brand-reveal.css")), "brand-reveal.css محذوف");

assert.ok(
  existsSync(resolve(root, "src/components/MajalisLaunchScreen.tsx")),
  "دخولية ويب واحدة: MajalisLaunchScreen",
);
assert.ok(
  existsSync(resolve(root, "src/styles/components/majalis-launch-screen.css")),
  "أنماط الدخولية موجودة",
);
assert.ok(existsSync(resolve(root, "src/lib/launch-intro.ts")), "منطق جلسة الدخولية");

const launchIntro = readFileSync(resolve(root, "src/lib/launch-intro.ts"), "utf8");
assert.match(launchIntro, /LAUNCH_INTRO_MIN_MS\s*=\s*900/);
assert.match(launchIntro, /LAUNCH_INTRO_MAX_MS\s*=\s*1400/);
assert.match(launchIntro, /sessionStorage/);

const launchCss = readFileSync(
  resolve(root, "src/styles/components/majalis-launch-screen.css"),
  "utf8",
);
assert.match(launchCss, /prefers-reduced-motion/);
assert.match(launchCss, /--mj-launch-from/);
assert.match(launchCss, /--inset-(top|bottom)/);

const launchComp = readFileSync(resolve(root, "src/components/MajalisLaunchScreen.tsx"), "utf8");
assert.match(launchComp, /hideAppSplash/);
assert.match(launchComp, /علم نافع، وتجربة مرتبة/);
assert.match(launchComp, /icon-192\.png/);
assert.doesNotMatch(launchComp, /framer-motion|gsap|lottie/i, "بلا مكتبات حركة");
assert.doesNotMatch(launchComp, /supabase|fetch\(|QueryClient/i, "لا انتظار بيانات خارجية");

assert.ok(
  existsSync(
    resolve(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"),
  ),
);
const icon1024 = readFileSync(resolve(root, "public/brand/icon-1024.png"));
assert.equal(icon1024[25], 2, "icon-1024 color type = RGB (بلا شفافية)");

const appSrc = readFileSync(resolve(root, "src/App.tsx"), "utf8");
assert.match(appSrc, /MajalisLaunchScreen/, "App يركّب الدخولية الواحدة");
assert.doesNotMatch(
  appSrc,
  /Onboarding|WelcomeScreen|IntroScreen|BrandReveal|AppFirstRunHost|FirstRunSetup/,
  "لا بوابة ترحيب/دليل سريع قديمة",
);

console.log("launch-splash-unified.test.ts: ok");
