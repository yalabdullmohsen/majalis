/**
 * بوابة: SWR محلي + تنظيف مؤقتات المصحف/الصلاة + فواصل عبر Preferences.
 * تشغيل: node --import tsx src/lib/__tests__/swr-leaks-followup-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const recent = read("src/hooks/useRecentProgress.ts");
const resume = read("src/components/home/HomeLocalResumeCard.tsx");
const engine = read("src/hooks/useQuranEngine.ts");
const reader = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const pager = read("src/features/mushaf-madinah/MushafPager.tsx");
const banner = read("src/components/prayer/PrayerCountdownBanner.tsx");
const bookmarks = read("src/lib/quran-my-bookmarks.ts");
const native = read("src/lib/native-storage.ts");
const safe = read("src/lib/safe-json.ts");

assert.match(recent, /localProgressSeed/);
assert.match(recent, /getContinueReadingEntries|loadLastPageSync/);
assert.match(resume, /FEATURE_TOUR_HYDRATED_EVENT/);
assert.match(engine, /loadLastPageSync\(\) == null/);
assert.match(reader, /clearTimeout\(hideTimer\.current\)/);
assert.match(pager, /timersRef/);
assert.match(pager, /scheduleTimer/);
assert.match(banner, /dismissTimer/);
assert.match(bookmarks, /storageSetSync/);
assert.match(bookmarks, /memPageIndex/);
assert.match(native, /"myBookmarks"/);
assert.match(safe, /writeLocalJsonAtomic/);

console.log("swr-leaks-followup-gate.test.ts: ok");
