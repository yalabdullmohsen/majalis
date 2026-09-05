/**
 * بوابة: شيت «تتوفر نسخة جديدة» — زر تحديث يعمل، لاحقًا يغلق، بلا طبقة تسرق اللمس.
 * تشغيل: npx tsx src/lib/__tests__/update-available-prompt-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const banner = read("src/components/UpdateAvailableBanner.tsx");
const hook = read("src/hooks/useVersionCheck.ts");
const sheetCss = read("src/styles/components/app-bottom-sheet.css");
const safeReload = read("src/lib/safe-reload.ts");

assert.match(banner, /data-testid="update-available-apply"/, "زر تحديث قابل للاستهداف");
assert.match(banner, /onClick=\{onUpdate\}/, "زر تحديث مربوط بـ onClick");
assert.match(banner, /onPointerUp/, "pointerUp لموثوقية اللمس على iOS");
assert.match(banner, /onLater|dismissUpdate/, "لاحقًا يغلق النافذة");
assert.match(banner, /\belevated\b/, "الشيت elevated فوق الشريط السفلي");
assert.match(banner, /updateAvailable && shellReady/, "لا شيت فوق شاشة غير مستقرة");
assert.match(banner, /تعذر التحديث تلقائيًا/, "رسالة فشل عند تعليق التحديث");
assert.match(banner, /APPLY_WATCHDOG_MS/, "watchdog يعيد تفعيل الزر");
assert.match(banner, /disabled=\{busy\}/, "الزر يُعطَّل بعد تسجيل الضغط فقط");
assert.match(banner, /clearUserRefreshFlag/, "إزالة علم التحديث عند الفشل/لاحقًا");
assert.match(banner, /applyingRef/, "حارس يمنع ضغطًا مزدوجًا دون تعطيل قبل التسجيل");

assert.match(hook, /performUserRequestedUpdate/, "مسار مستخدم منفصل عن حارس الإقلاع");
assert.match(hook, /safeLocationReload\(\{\s*force:\s*true\s*\}\)/, "reload بـ force يتجاوز حارس 12s");
assert.match(hook, /SKIP_WAITING/, "skipWaiting لـ Service Worker");
assert.match(hook, /searchParams\.set\(["']v["']/, "fallback ?v=timestamp لـ iOS");
assert.match(hook, /isAppShellStable|app-booting/, "لا شيت فوق شاشة إقلاع");
assert.match(hook, /PURGE_BUDGET_MS/, "مهلة لمسح الكاش حتى لا يعلق");
assert.match(hook, /clearUserRefreshFlag/, "مسار تنظيف علم التحديث");

// مسار زر التحديث يجب ألا يخرج مبكرًا بسبب alreadyDidBootReload
{
  const start = hook.indexOf("export async function performUserRequestedUpdate");
  assert.ok(start >= 0, "performUserRequestedUpdate موجود");
  const slice = hook.slice(start, start + 600);
  assert.doesNotMatch(slice, /alreadyDidBootReload\(\)/, "مسار زر تحديث لا يُلغى بسبب alreadyDidBootReload");
}

assert.match(sheetCss, /z-index:\s*20100/, "z-index أعلى من bottom-nav وnavbar");
assert.match(
  sheetCss,
  /body\.app-sheet-open[\s\S]*?\.bottom-nav[\s\S]*?pointer-events:\s*none/,
  "الشريط السفلي بلا لمس أثناء الشيت",
);
assert.match(
  sheetCss,
  /app-sheet-overlay--elevated\)[\s\S]*?#root[\s\S]*?pointer-events:\s*none/,
  "لا طبقة #root تسرق اللمس فوق شيت التحديث",
);
assert.match(
  sheetCss,
  /\.update-available-sheet__update-btn[\s\S]*?pointer-events:\s*auto/,
  "أزرار التحديث تستقبل اللمس",
);

assert.match(safeReload, /force\?:\s*boolean/, "safeLocationReload يدعم force");

console.log("update-available-prompt-gate.test.ts: ok");
