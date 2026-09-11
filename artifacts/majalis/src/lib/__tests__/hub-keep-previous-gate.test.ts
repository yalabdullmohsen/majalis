/**
 * بوابة: المستجدات والتقويم يبقيان المحتوى أثناء إعادة الجلب.
 * node --import tsx src/lib/__tests__/hub-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const updates = readFileSync(resolve(root, "src/views/UpdatesPage.tsx"), "utf8");
assert.match(updates, /loading\s*&&\s*items\.length\s*===\s*0/, "Updates: هيكل فقط بلا عناصر سابقة");
assert.match(updates, /aria-busy=\{loading\}/, "Updates: aria-busy أثناء التحديث");
assert.doesNotMatch(
  updates,
  /\.catch\(\(\)\s*=>\s*\{\s*setItems\(\[\]\)/,
  "Updates: لا تفرّغ القائمة عند فشل إعادة الجلب",
);

const calendar = readFileSync(resolve(root, "src/views/CalendarPage.tsx"), "utf8");
assert.match(calendar, /loading\s*&&\s*events\.length\s*===\s*0/, "Calendar: هيكل فقط بلا أحداث سابقة");
assert.match(calendar, /aria-busy=\{loading\}/, "Calendar: aria-busy أثناء التحديث");
assert.doesNotMatch(
  calendar,
  /\.catch\(\(\)\s*=>\s*\{\s*setEvents\(\[\]\)/,
  "Calendar: لا تفرّغ الأحداث عند فشل إعادة الجلب",
);

console.log("hub-keep-previous-gate.test.ts: ok");
