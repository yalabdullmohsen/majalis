/**
 * بوابة: إقلاع أصلي بلون صامت فقط — بلا صورة Splash ولا طبقة ويب.
 * تشغيل: node --import tsx src/lib/__tests__/launch-splash-unified.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.doesNotMatch(indexHtml, /id="mj-boot-splash"/, "لا شاشة ويب وسيطة");
assert.doesNotMatch(indexHtml, /mj-boot-splash__logo/, "لا شعار ويب مكرر");
assert.doesNotMatch(indexHtml, /apple-touch-startup-image/, "لا صور إقلاع PWA");
assert.doesNotMatch(indexHtml, /splash-boot\.css/, "لا اعتماد على splash-boot.css");
assert.match(indexHtml, /background-color:\s*#002b21/, "خلفية WebView خضراء داكنة");
assert.match(indexHtml, /html,\s*body,\s*#root/, "خلفية inline على html/body/#root");

const splashTs = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
assert.doesNotMatch(splashTs, /mj-boot-splash/, "splash-screen لا يمس طبقة ويب");
assert.match(splashTs, /SplashScreen\.hide/, "يخفي الإطلاق الأصلي فقط");
assert.match(splashTs, /fadeOutDuration:\s*0/, "بلا تأخير/تلاشٍ مصطنع");

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
assert.ok(
  existsSync(
    resolve(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"),
  ),
);
const icon1024 = readFileSync(resolve(root, "public/brand/icon-1024.png"));
// PNG signature + IHDR: RGB بلا ألفا (color type 2)
assert.equal(icon1024[25], 2, "icon-1024 color type = RGB (بلا شفافية)");

// لا مكوّن React Onboarding/Welcome كبوابة إقلاع
const appSrc = readFileSync(resolve(root, "src/App.tsx"), "utf8");
assert.doesNotMatch(appSrc, /Onboarding|WelcomeScreen|IntroScreen/, "لا بوابة ترحيب React");

console.log("launch-splash-unified.test.ts: ok");
