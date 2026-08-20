/**
 * بوابة: شاشة الدخول الأولى الجديدة — شاشة واحدة، بلا أذونات، تُعرض
 * مرة واحدة فقط قبل تركيب التطبيق.
 * تشغيل: node --import tsx src/lib/__tests__/app-first-launch-screen.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// الدليل السريع القديم (متعدد الخطوات) محذوف بالكامل — لا يعود.
assert.equal(existsSync(resolve(root, "lib/first-run-setup.ts")), false, "first-run-setup.ts محذوف");
assert.equal(
  existsSync(resolve(root, "components/FirstRunSetup.tsx")),
  false,
  "FirstRunSetup.tsx القديم محذوف",
);
assert.equal(
  existsSync(resolve(root, "components/AppFirstRunHost.tsx")),
  false,
  "AppFirstRunHost.tsx القديم محذوف",
);
assert.equal(
  existsSync(resolve(root, "styles/pages/first-run-setup.css")),
  false,
  "CSS الدليل القديم محذوف",
);

// الشاشة الجديدة موجودة وبسيطة.
const screenPath = resolve(root, "components/AppFirstLaunchScreen.tsx");
assert.ok(existsSync(screenPath), "AppFirstLaunchScreen.tsx موجود");
const screenSrc = readFileSync(screenPath, "utf8");

assert.match(screenSrc, /المجلس العلمي/, "العنوان صحيح");
assert.match(screenSrc, /علم شرعي موثوق في مكان واحد/, "الوصف صحيح");
assert.match(screenSrc, /ابدأ الآن/, "زر البدء صحيح");
assert.match(screenSrc, /dir="rtl"/, "RTL كامل");

// بلا أذونات نظام من أي نوع داخل شاشة الدخول أو ملف حالتها.
const stateSrc = readFileSync(resolve(root, "lib/onboarding-state.ts"), "utf8");
for (const src of [screenSrc, stateSrc]) {
  assert.doesNotMatch(
    src,
    /requestPermission|Notification\s*\.|LocalNotifications|PushNotifications|Geolocation/,
    "لا طلب إذن نظام في شاشة الدخول",
  );
}

// لا سلايدر/خطوات متعددة — عنصر جذر واحد بلا حالة "خطوة حالية".
assert.doesNotMatch(screenSrc, /useState|currentStep|activeSlide|carousel/i, "شاشة واحدة بلا خطوات");

// App.tsx يبوّب إليها قبل المزوّدات، ويسجّل الرؤية مرة واحدة فقط.
const appSrc = readFileSync(resolve(root, "App.tsx"), "utf8");
assert.match(appSrc, /AppFirstLaunchScreen/, "App.tsx يستورد الشاشة الجديدة");
assert.match(appSrc, /hasSeenOnboarding/, "App.tsx يتحقق من الرؤية السابقة");
assert.match(appSrc, /markOnboardingSeen/, "App.tsx يسجّل الرؤية عند «ابدأ الآن»");

console.log("app-first-launch-screen.test.ts: ok — شاشة واحدة، بلا أذونات، بلا دليل قديم");
