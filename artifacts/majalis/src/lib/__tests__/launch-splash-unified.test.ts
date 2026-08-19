/**
 * بوابة الدخولية الموحّدة: أصلي فقط — لا طبقة ويب تحجب المحتوى.
 * تشغيل: node --import tsx src/lib/__tests__/launch-splash-unified.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const BG = "#0E1A15";

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.doesNotMatch(indexHtml, /id="mj-silent-splash"/, "لا طبقة دخولية ويب");
assert.doesNotMatch(indexHtml, /#mj-silent-splash/, "لا CSS دخولية ويب");
assert.doesNotMatch(indexHtml, /__mjDismissSplash/, "لا dismiss ويب");
assert.match(indexHtml, /html\.capacitor-native/, "خلفية أصلية فقط في HTML");

assert.match(indexHtml, new RegExp(`theme-color" content="${BG}"`), "theme-color الإقلاع");
assert.doesNotMatch(indexHtml, /apple-touch-startup-image/, "لا صور إقلاع PWA");
assert.doesNotMatch(indexHtml, /splash-boot\.css/, "لا splash-boot.css");
assert.doesNotMatch(indexHtml, /id="mj-boot-splash"/, "لا طبقة boot قديمة");

const splashTs = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
assert.match(splashTs, /SplashScreen\.hide/, "يخفي الإطلاق الأصلي");
assert.match(splashTs, /SPLASH_MIN_VISIBLE_MS\s*=\s*900/, "حد أدنى 900ms");
assert.match(splashTs, /SPLASH_MAX_VISIBLE_MS\s*=\s*1500/, "حد أقصى 1500ms");
assert.match(splashTs, /SPLASH_FADE_OUT_MS\s*=\s*250/, "تلاشٍ 250ms");
assert.match(splashTs, /app:first-paint/, "يستمع لـ app:first-paint");
assert.match(splashTs, /mj\.native-splash\.session/, "جلسة: لا تظهر مرتين");
assert.doesNotMatch(splashTs, /MajlisLaunchScreen/);

const mainSrc = readFileSync(resolve(root, "src/main.tsx"), "utf8");
assert.match(mainSrc, /app:first-paint/, "main يعلن app:first-paint");
assert.match(mainSrc, /armNativeSplashController/, "main يفعّل متحكّم الدخولية");
assert.doesNotMatch(mainSrc, /AppSplash/, "لا AppSplash React");

const launch = readFileSync(
  resolve(root, "ios/App/App/Base.lproj/LaunchScreen.storyboard"),
  "utf8",
);
assert.match(launch, /image="LaunchMark"/, "LaunchScreen برمز");
assert.match(launch, /المجلس العلمي/, "عنوان على LaunchScreen");
assert.match(launch, /دروس شرعية/, "سطر تعريفي على LaunchScreen");
assert.match(launch, /mk-progress-track/, "مؤشر تقدّم على LaunchScreen");
assert.match(launch, /safeArea|Safe area/i, "يحترم safe area");
assert.match(launch, /0\.054901960784313725/, `خلفية ${BG}`);

const capTs = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
assert.match(capTs, /launchShowDuration:\s*0/, "مدة إظهار Splash = 0");
assert.match(capTs, /launchAutoHide:\s*false/, "إخفاء برمجي فقط");
assert.match(capTs, /showSpinner:\s*false/, "بلا spinner");
assert.match(capTs, new RegExp(`backgroundColor:\\s*"${BG}"`), "لون خلفية مطابق");

const styles = readFileSync(resolve(root, "android/app/src/main/res/values/styles.xml"), "utf8");
assert.match(styles, /Theme\.SplashScreen/);
assert.match(styles, /windowSplashScreenBackground/);
assert.match(styles, /@drawable\/splash_icon/);

assert.ok(!existsSync(resolve(root, "src/components/AppSplash.tsx")), "AppSplash محذوف");
assert.ok(!existsSync(resolve(root, "src/components/MajlisLaunchScreen.tsx")), "مكوّن React محذوف");
assert.ok(!existsSync(resolve(root, "src/lib/launch-intro.ts")), "launch-intro محذوف");

const appSrc = readFileSync(resolve(root, "src/App.tsx"), "utf8");
assert.doesNotMatch(appSrc, /MajlisLaunchScreen|isLaunching|MajalisLaunchScreen/);
assert.doesNotMatch(appSrc, /Onboarding|WelcomeScreen|IntroScreen|BrandReveal|AppFirstRunHost|FirstRunSetup/);

const swJs = readFileSync(resolve(root, "public/sw.js"), "utf8");
assert.match(swJs, /majlisilm-v\$\{SW_BUILD_ID\}/, "كاش SW مربوط بالبناء");
assert.match(swJs, /SW_UPDATED_RELOAD_ONCE/, "إعادة تحميل واحدة عند التحديث");

console.log("launch-splash-unified.test.ts: ok");
