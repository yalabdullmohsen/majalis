/**
 * بوابة الإقلاع: الدخولية الصامتة (mj-silent-splash) حُذفت عمدًا من index.html —
 * الإقلاع الآن هيكل ثابت (mj-boot-skeleton) فقط + إخفاء الإطلاق الأصلي native.
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
assert.doesNotMatch(indexHtml, /mj-silent-splash/, "الدخولية الصامتة محذوفة بالكامل");
assert.doesNotMatch(indexHtml, /__mjDismissSplash/, "لا دالة dismiss متبقية");
assert.match(indexHtml, /id="mj-boot-skeleton"/, "هيكل إقلاع فوري");
assert.match(indexHtml, new RegExp(`theme-color" content="${BG}"`), "theme-color الإقلاع مطابق للخلفية");
assert.doesNotMatch(indexHtml, /apple-touch-startup-image/, "لا صور إقلاع PWA");
assert.doesNotMatch(indexHtml, /splash-boot\.css/, "لا splash-boot.css");
assert.doesNotMatch(indexHtml, /id="mj-boot-splash"/, "لا طبقة boot قديمة");
assert.doesNotMatch(indexHtml, /preload[^>]+icon-192\.webp/, "لا preload شعار للدخولية");
{
  const preconnects = [...indexHtml.matchAll(/rel="preconnect"/g)];
  assert.ok(preconnects.length <= 2, `preconnect ≤ ٢ (الفعلي: ${preconnects.length})`);
}

assert.ok(!existsSync(resolve(root, "src/components/AppSplash.tsx")), "AppSplash.tsx محذوف");

const splashTs = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
assert.match(splashTs, /SplashScreen\.hide/, "يخفي الإطلاق الأصلي");
assert.match(splashTs, /SPLASH_FADE_OUT_MS\s*=\s*250/, "تلاشٍ 250ms");
assert.match(splashTs, /requestAnimationFrame/, "إخفاء عند أول إطار");
assert.doesNotMatch(splashTs, /MajlisLaunchScreen/);

const mainSrc = readFileSync(resolve(root, "src/main.tsx"), "utf8");
assert.match(mainSrc, /mj:app-painted/, "main يعلن أول رسم");
assert.match(mainSrc, new RegExp(BG));

const launch = readFileSync(
  resolve(root, "ios/App/App/Base.lproj/LaunchScreen.storyboard"),
  "utf8",
);
assert.match(launch, /image="LaunchMark"/, "LaunchScreen برمز واحد");
assert.match(launch, /<imageView\b/, "ImageView للرمز");
assert.doesNotMatch(launch, /image="Splash"/, "بلا Splash القديم");
assert.doesNotMatch(launch, /systemBackgroundColor/, "بلا خلفية نظام بيضاء");
assert.match(launch, /safeArea|Safe area/i, "يحترم safe area");
assert.match(launch, /0\.054901960784313725/, `خلفية ${BG}`);
assert.match(launch, /المجلس العلمي/, "عنوان على LaunchScreen");
assert.match(launch, /دروس شرعية/, "سطر تعريفي على LaunchScreen");
assert.match(launch, /mk-progress-track/, "مؤشر تقدّم على LaunchScreen");

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
assert.match(splashIconXml, /#C9A227/, "رمز ذهبي");
assert.match(splashIconXml, new RegExp(BG), "خلفية الأيقونة");

const colors = readFileSync(resolve(root, "android/app/src/main/res/values/colors.xml"), "utf8");
assert.match(colors, new RegExp(`splash_background">${BG}<`));

assert.ok(!existsSync(resolve(root, "ios/App/App/Assets.xcassets/Splash.imageset")), "لا Splash.imageset");
assert.ok(existsSync(resolve(root, "ios/App/App/Assets.xcassets/LaunchMark.imageset/LaunchMark.png")));
assert.ok(existsSync(resolve(root, "ios/App/App/Assets.xcassets/LaunchMark.imageset/LaunchMark@2x.png")));
assert.ok(existsSync(resolve(root, "ios/App/App/Assets.xcassets/LaunchMark.imageset/LaunchMark@3x.png")));
assert.ok(!existsSync(resolve(root, "assets/splash.png")), "لا assets/splash.png");
assert.ok(!existsSync(resolve(root, "public/brand/apple-splash")), "لا apple-splash يتيمة");
assert.ok(!existsSync(resolve(root, "public/brand/splash-boot.css")), "لا splash-boot.css");
assert.ok(!existsSync(resolve(root, "src/components/BrandReveal.tsx")), "BrandReveal محذوف");
assert.ok(!existsSync(resolve(root, "src/components/MajlisLaunchScreen.tsx")), "مكوّن React محذوف");
assert.ok(!existsSync(resolve(root, "src/components/MajalisLaunchScreen.tsx")), "الاسم القديم محذوف");
assert.ok(!existsSync(resolve(root, "src/styles/launch-screen.css")), "CSS React محذوف");
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
// الدليل السريع القديم (٣ شاشات: ترحيب/تفضيلات/تذكيرات) أُلغي نهائيًا —
// هذه الأسماء بالذات تبقى محظورة. شاشة الدخول الأولى الجديدة (شاشة واحدة
// فقط، بلا أذونات، AppFirstLaunchScreen) قرار مقصود منفصل — راجع
// src/components/AppFirstLaunchScreen.tsx وsrc/lib/onboarding-state.ts.
assert.doesNotMatch(
  appSrc,
  /WelcomeScreen|IntroScreen|BrandReveal|AppFirstRunHost|FirstRunSetup/,
  "لا بوابة ترحيب متعددة الخطوات قديمة في التركيب",
);

const info = readFileSync(resolve(root, "ios/App/App/Info.plist"), "utf8");
assert.match(info, /<key>CFBundleVersion<\/key>\s*<string>40<\/string>/, "CFBundleVersion رُفع");

const manifest = JSON.parse(readFileSync(resolve(root, "public/manifest.json"), "utf8"));
assert.equal(manifest.background_color, BG);
assert.equal(manifest.theme_color, "#F2F4F3");
assert.ok(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable"));

assert.ok(existsSync(resolve(root, "public/brand/silent-splash-390x844.png")), "لقطة 390×844");
assert.ok(existsSync(resolve(root, "public/brand/silent-splash-390x844-dark.png")), "لقطة الوضع الثاني");

const swJs = readFileSync(resolve(root, "public/sw.js"), "utf8");
assert.match(swJs, /majlisilm-v\$\{SW_BUILD_ID\}/, "كاش SW مربوط بالبناء");
assert.match(swJs, /SW_UPDATED_RELOAD_ONCE/, "إعادة تحميل واحدة عند التحديث");

const swClient = readFileSync(resolve(root, "src/lib/service-worker.ts"), "utf8");
assert.match(swClient, /SW_UPDATED_RELOAD_ONCE/, "العميل يستمع لإعادة التحميل الواحدة");
assert.match(swClient, /hadController/, "لا reload عند أول claim");

console.log("launch-splash-unified.test.ts: ok");
