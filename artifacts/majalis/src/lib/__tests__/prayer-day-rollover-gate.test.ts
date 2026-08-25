/**
 * بوابة: عبور منتصف الليل يعيد تحميل المواقيت + backoff لصندوق المزامنة.
 * تشغيل: node --import tsx src/lib/__tests__/prayer-day-rollover-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calendarDayKeyInZone } from "../prayer-day-rollover";

const root = resolve(import.meta.dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.match(calendarDayKeyInZone("Asia/Kuwait"), /^\d{4}-\d{2}-\d{2}$/);

const hook = read("src/hooks/usePrayerCountdown.ts");
assert.match(hook, /subscribePrayerDayRollover/);
assert.match(hook, /setReloadToken/);

const compact = read("src/components/home/HomeCompactPrayer.tsx");
assert.match(compact, /subscribePrayerDayRollover/);

const outbox = read("src/lib/sync-outbox.ts");
assert.match(outbox, /nextRetryAt/);
assert.match(outbox, /computeBackoffDelayMs/);

const banner = read("src/components/OfflineBanner.tsx");
assert.match(banner, /offline-banner/);
assert.match(banner, /majalis-outbox-flushed/);

console.log("\nprayer-day-rollover-gate.test.ts: ok");
