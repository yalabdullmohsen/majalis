/**
 * بوابة إقلاع: لا يُحجب createRoot على Preferences/كاش.
 * التشغيل: node --import tsx src/lib/__tests__/boot-mount-order-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const main = readFileSync(resolve(root, "main.tsx"), "utf8");

assert.match(main, /createRoot\(/);
assert.match(main, /hydrateNativeStorage/);
assert.match(main, /purgeNativeWebRuntimeCaches/);

// بعد الإصلاح: لا await hydrate/purge قبل createRoot
const createIdx = main.indexOf("createRoot(");
assert.ok(createIdx > 0, "createRoot موجود");

const beforeCreate = main.slice(0, createIdx);
assert.doesNotMatch(
  beforeCreate,
  /await\s+hydrateNativeStorage\s*\(/,
  "لا يُنتظر hydrateNativeStorage قبل createRoot",
);
assert.doesNotMatch(
  beforeCreate,
  /await\s+purgeNativeWebRuntimeCaches\s*\(/,
  "لا يُنتظر purgeNativeWebRuntimeCaches قبل createRoot",
);

// خلفية الإقلاع = سطح الرئيسية (يمنع وميض أخضر قديم / شاشة دعائية)
assert.match(main, /#F2F4F3/);
assert.match(
  main,
  /setProperty\(\s*["']--app-status-bg["']\s*,\s*["']#F2F4F3["']/,
  "خلفية الإقلاع الأصلي تطابق سطح التطبيق",
);

console.log("boot-mount-order-gate.test.ts: ok");
