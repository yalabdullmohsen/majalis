/**
 * بوابة استقرار الإقلاع — لا خطأ كاذب، لا تبديل خط، لا قفزات هيكل، لا تحديث فوق شاشة ناقصة.
 * تشغيل: npx tsx src/lib/__tests__/startup-shell-stability-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const html = read("index.html");
const critical = read("src/styles/critical-first-paint.css");
const shell = read("src/lib/app-shell-stability.ts");
const pageGuard = read("src/components/PageLoadingGuard.tsx");
const asyncHook = read("src/hooks/use-async-data.ts");
const asyncView = read("src/components/AsyncDataView.tsx");
const versionHook = read("src/hooks/useVersionCheck.ts");
const updateBanner = read("src/components/UpdateAvailableBanner.tsx");
const home = read("src/pages/account/ui/HomeView.tsx");
const sw = read("public/sw.js");
const safeLoad = read("src/lib/safe-load.ts");
const main = read("src/main.tsx");
const vitals = read("src/lib/boot-vitals-snapshot.ts");

assert.match(html, /mj-theme-boot/, "سكربت ثيم قبل React");
assert.match(html, /app-booting/, "app-booting من أول إطار");
assert.ok(html.includes(["font", "-family: \"Amiri\""].join("")), "خط الواجهة في critical");
assert.match(html, /button,\s*input,\s*textarea,\s*select/, "عناصر النموذج ترث الخط");
assert.match(html, /min-height:\s*100(?:dvh|svh)/, "ارتفاع viewport ثابت لـ iOS");
assert.ok(html.includes("#101614") || html.includes("#101614"), "خلفية ليلي قبل React");
assert.match(html, /v13-startup-shell-stable|v14-release-fresh-2026-09/, "نسخة تصميم تُبطل الكاش القديم");
assert.match(html, /font-display:\s*optional/, "font-display optional بلا قفزة");

assert.match(critical, /html\.app-booting[\s\S]*\.app-top-chrome/, "قفل هيدر أثناء الإقلاع");
assert.match(critical, /html\.app-booting[\s\S]*bottom-nav/, "قفل الشريط السفلي");
assert.ok(critical.includes("hus-field") && critical.includes("52px"), "قفل البحث");

assert.match(shell, /shouldSuppressBootErrors/, "بوابة كبح أخطاء الإقلاع");
assert.match(main, /boot-vitals-snapshot/, "لقطة Web Vitals بعد الإقلاع");
assert.match(pageGuard, /shouldSuppressBootErrors/, "PageLoadingGuard يحترم كبح الإقلاع");
assert.match(pageGuard, /timedOut && loading && !suppressBootError/, "لا Error قبل انتهاء كبح الإقلاع");
assert.match(asyncHook, /retrying/, "حالة retrying صريحة");
assert.match(asyncView, /retrying/, "لا Error أثناء retrying");
assert.match(asyncView, /offline/, "حالة offline منفصلة");
assert.match(safeLoad, /silentRetry/, "إعادة محاولة صامتة في safe-load");

assert.match(versionHook, /BOOT_QUIET_MS/, "نافذة هدوء إقلاع");
assert.doesNotMatch(versionHook, /silentBootPurgeThenReload/, "لا مسار reload صامت عند الإقلاع");
assert.match(versionHook, /pendingUpdateRef/, "تأجيل شيت التحديث");
assert.match(versionHook, /whenAppShellStable/, "انتظار استقرار الهيكل");
assert.match(updateBanner, /updateAvailable && shellReady/, "لا شيت تحديث قبل shellReady");
assert.match(updateBanner, /\belevated\b/, "شيت التحديث elevated فوق الطبقات");
assert.match(updateBanner, /data-testid="update-available-apply"/, "زر تحديث قابل للضغط");

assert.match(home, /whenAppShellStable/, "الترحيب بعد استقرار الهيكل");
assert.match(home, /showIntro \?/, "Intro شرطي كـ overlay");
assert.doesNotMatch(home, /if \(showIntro\) \{\s*return/, "لا استبدال كامل للصفحة بالترحيب");

assert.match(sw, /لا تُخدم\/تُخزَّن صفحة الخطأ|native-load-error/, "SW لا يخزّن error shell");
assert.match(sw, /skipWaiting/, "skipWaiting لتحديث غير معلّق");
assert.match(sw, /clients\.claim/, "clients.claim بعد التفعيل");

assert.match(
  critical,
  /html\.app-booting[\s\S]*\.app-top-chrome[\s\S]*min-height:\s*var\(--app-top-chrome-h/,
  "ارتفاع الهيدر محجوز أثناء الإقلاع",
);
assert.match(
  critical,
  /html\.app-booting[\s\S]*bottom-nav[\s\S]*min-height:\s*var\(--bottom-nav-height/,
  "ارتفاع الشريط السفلي محجوز",
);

assert.match(vitals, /CLS_TARGET\s*=\s*0\.03/, "عتبة CLS");
assert.match(vitals, /TBT_TARGET\s*=\s*100/, "عتبة TBT");
assert.match(vitals, /scheduleBootVitalsSnapshot/, "جدولة لقطة بعد الاستقرار");

console.log("startup-shell-stability-gate.test.ts: ok");
