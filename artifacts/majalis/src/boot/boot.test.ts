/**
 * بوابة وحدة الإقلاع src/boot/
 * node --import tsx src/boot/boot.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BG = "#0E1A15";

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
const bootIndex = readFileSync(resolve(root, "src/boot/index.ts"), "utf8");
const bootIos = readFileSync(resolve(root, "src/boot/platform/ios.ts"), "utf8");
const mainSrc = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const capTs = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");

assert.match(indexHtml, /id="mj-boot-layer"/, "نقطة تثبيت واحدة");
assert.match(indexHtml, /id="mj-boot-critical"/, "CSS حرج مُضمّن");
assert.doesNotMatch(indexHtml, /mj-boot-skeleton|mj-silent-splash|mj-sk-/, "لا طبقات قديمة");
assert.match(indexHtml, /mj-boot-native__title/, "عنوان على دخولية الأصل");
assert.match(indexHtml, /mj-boot-native__subtitle/, "سطر على دخولية الأصل");
assert.match(indexHtml, /mj-boot-native__progress/, "مؤشر على دخولية الأصل");
assert.match(indexHtml, /mj-boot-sk-start/, "هيكل ويب بلا نص");
assert.match(indexHtml, /__mjBootDismiss/, "دالة dismiss للطبقة");
assert.match(indexHtml, /MIN_MS\s*=\s*900/);
assert.match(indexHtml, /MAX_MS\s*=\s*1500/);
assert.match(indexHtml, /EXIT_MS\s*=\s*250/);
assert.match(indexHtml, /mj\.boot\.session/, "مفتاح جلسة جديد");
assert.match(indexHtml, /Capacitor\.isNativePlatform/, "الدخولية على الأصل فقط");
assert.doesNotMatch(indexHtml, /if \(!native\) \{\s*dismiss\(true\)/, "الويب لا يُزال الهيكل فوراً");

{
  const webPanel = indexHtml.match(/<div class="mj-boot-web"[\s\S]*?<\/div>\s*<\/div>\s*<div class="mj-boot-native"/);
  assert.ok(webPanel, "panel الويب قابل للعزل");
  assert.doesNotMatch(webPanel[0], /<(h1|h2|p)\b/, "هيكل الويب بلا نص ينافس LCP");
}

assert.match(bootIndex, /mountBoot/);
assert.match(bootIndex, /dismissBoot/);
assert.match(bootIndex, /BOOT_LAYER_ENABLED/);
assert.match(bootIos, /SplashScreen\.hide/);
assert.match(bootIos, /BOOT_MAX_VISIBLE_MS/);
assert.match(mainSrc, /mountBoot\(\)/, "استدعاء واحد من main");
assert.doesNotMatch(mainSrc, /AppSplash|armNativeSplashController|splash-screen/);

assert.match(capTs, /launchAutoHide:\s*false/);

const launch = readFileSync(
  resolve(root, "ios/App/App/Base.lproj/LaunchScreen.storyboard"),
  "utf8",
);
assert.match(launch, /image="LaunchMark"/);
assert.match(launch, /المجلس العلمي/);
assert.match(launch, /mk-progress-track/);

const swJs = readFileSync(resolve(root, "public/sw.js"), "utf8");
assert.match(swJs, /majlisilm-v\$\{SW_BUILD_ID\}/);

assert.ok(existsSync(resolve(root, "src/boot/boot.css")));
assert.ok(existsSync(resolve(root, "src/boot/boot-state.ts")));
assert.ok(existsSync(resolve(root, "src/boot/boot-layer.ts")));
assert.ok(existsSync(resolve(root, "src/boot/platform/web.ts")));
assert.ok(existsSync(resolve(root, "src/boot/platform/android.ts")));
assert.ok(!existsSync(resolve(root, "src/components/AppSplash.tsx")));
assert.ok(!existsSync(resolve(root, "src/lib/splash-screen.ts")));

for (const name of ["index.ts", "boot-layer.ts", "boot-state.ts", "boot.css", "boot.test.ts"]) {
  assert.ok(existsSync(resolve(root, "src/boot", name)), `src/boot/${name}`);
}

console.log("boot.test.ts: ok");
