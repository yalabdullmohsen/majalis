/**
 * بوابة: أداء إطلاق — تأجيل رسم المصحف + إيقاف جداول الأذان عند إلغاء التركيب + بلا console.info إنتاج في محرك الأذان.
 * تشغيل: node --import tsx src/lib/__tests__/launch-perf-swr-cleanup-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const mushafPage = read("src/pages/quran/MushafReaderPage.tsx");
const gate = read("src/hooks/useNavigationPaintGate.ts");
const app = read("src/App.tsx");
const adhanSvc = read("src/lib/adhan-audio-service.ts");
const iosSeg = read("src/lib/adhan-ios-segments.ts");
const lastPage = read("src/lib/quran-last-page.ts");
const bookmarks = read("src/lib/local-bookmarks.ts");
const continueReading = read("src/lib/continue-reading.ts");

assert.match(gate, /useNavigationPaintGate/);
assert.match(gate, /requestAnimationFrame/);
assert.match(mushafPage, /useNavigationPaintGate/);
assert.match(mushafPage, /loadLastPageSync/);
assert.match(mushafPage, /mm-page-placeholder/);

assert.match(app, /stopAdhanScheduler/);
assert.match(app, /stopPrayerAlertScheduler/);

assert.match(adhanSvc, /import\.meta\.env\?\.DEV[\s\S]*console\.info/);
assert.match(iosSeg, /import\.meta\.env\?\.DEV[\s\S]*console\.info/);

assert.match(lastPage, /loadLastPageSync/);
assert.match(bookmarks, /listLocalBookmarks/);
assert.match(continueReading, /readLocalJson|CONTINUE_READING_LS_KEY/);

console.log("launch-perf-swr-cleanup-gate.test.ts: ok");
