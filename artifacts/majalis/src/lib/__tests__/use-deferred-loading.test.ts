/**
 * useDeferredLoading — تأخير 80ms وحد أدنى 160ms.
 * تشغيل: node --import tsx src/lib/__tests__/use-deferred-loading.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const src = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../hooks/useDeferredLoading.ts"),
  "utf8",
);
assert.match(src, /SHOW_AFTER_MS\s*=\s*80/);
assert.match(src, /MIN_VISIBLE_MS\s*=\s*160/);
assert.match(src, /export function useDeferredLoading/);

console.log("use-deferred-loading.test.ts: ok");
