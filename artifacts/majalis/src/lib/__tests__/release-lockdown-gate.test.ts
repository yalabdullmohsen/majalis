/**
 * بوابة قفل إصدار الإنتاج: minify/R8، أذونات أصلية، أصول صوت مضغوطة، بلا subset لخطوط عثماني.
 * تشغيل: node --import tsx src/lib/__tests__/release-lockdown-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(appRoot, p), "utf8");

const vite = read("vite.config.ts");
assert.match(vite, /minify:\s*["']esbuild["']/, "Vite production minify عبر esbuild");
assert.match(vite, /drop:.*console/, "إسقاط console في الإنتاج");

const gradle = read("android/app/build.gradle");
assert.match(gradle, /minifyEnabled\s+true/, "R8/ProGuard مفعّل للإصدار");
assert.match(gradle, /shrinkResources\s+true/, "تقليص الموارد");
assert.match(gradle, /proguard-android-optimize/, "قواعد optimize");

const proguard = read("android/app/proguard-rules.pro");
assert.match(proguard, /com\.getcapacitor/, "إبقاء Capacitor");
assert.match(proguard, /com\.majlisilm\.app/, "إبقاء ملحقات المجلس");

const manifest = read("android/app/src/main/AndroidManifest.xml");
assert.match(manifest, /ACCESS_COARSE_LOCATION/, "موقع الصلاة");
assert.match(manifest, /ACCESS_FINE_LOCATION/, "دقة القبلة");
assert.match(manifest, /FOREGROUND_SERVICE_MEDIA_PLAYBACK/, "صوت خلفي");
assert.match(manifest, /POST_NOTIFICATIONS/, "إشعارات محلية");
assert.doesNotMatch(manifest, /READ_CONTACTS|CAMERA|READ_SMS/, "بلا أذونات غير مطلوبة");

const plist = read("ios/App/App/Info.plist");
assert.match(plist, /UIBackgroundModes/, "خلفية");
assert.match(plist, /<string>audio<\/string>/, "خلفية صوت");
assert.match(plist, /NSLocationWhenInUseUsageDescription/, "موقع الصلاة/قبلة");
assert.match(plist, /NSUserNotificationsUsageDescription/, "إشعارات");

/** أصول الأذان: m4a/mp3/caf فقط — بلا wav غير مضغوط في الحزمة العامة */
function assertNoUncompressedAudio(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      assertNoUncompressedAudio(full);
      continue;
    }
    assert.doesNotMatch(name, /\.(wav|aiff|flac)$/i, `أصل غير مضغوط مرفوض: ${full}`);
  }
}
assertNoUncompressedAudio(resolve(appRoot, "public/sounds"));
assertNoUncompressedAudio(resolve(appRoot, "public/audio"));

/** خطوط QPC لكل صفحة — لا نُخضع للـsubset الآلي (التشكيل كامل) */
assert.ok(existsSync(resolve(appRoot, "public/fonts/qpc-v2")), "خطوط QPC موجودة كما هي");

const power = read("src/lib/power-saver-engine.ts");
assert.match(power, /ensureLowPowerHints/, "تلميحات بطارية/توفير");
assert.match(power, /getBattery/, "Battery API");

const haptics = read("src/lib/haptics.ts");
assert.match(haptics, /supportsHaptics/);
assert.match(haptics, /requestAnimationFrame/);

console.log("release-lockdown-gate: OK");
