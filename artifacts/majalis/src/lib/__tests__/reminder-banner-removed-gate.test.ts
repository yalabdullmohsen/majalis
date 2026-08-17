/**
 * بوابة: صفر إشارات لبطاقة التذكير الهجري (HijriSacredMonthBanner).
 * Run: node --import tsx src/lib/__tests__/reminder-banner-removed-gate.test.ts
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const patterns = [
  "HijriSacredMonthBanner",
  "hijri-sacred-month.css",
  "hmb-wrap",
  "hmb-period--",
];

for (const pat of patterns) {
  const out = execSync(`rg -l "${pat}" src --glob '!**/__tests__/reminder-banner-removed-gate.test.ts' || true`, {
    cwd: appRoot,
    encoding: "utf8",
  }).trim();
  assert.equal(out, "", `يجب ألا يبقى "${pat}" في src — وُجد في:\n${out || "(none)"}`);
}

const calendarPage = readFileSync(resolve(appRoot, "src/views/CalendarPage.tsx"), "utf8");
assert.equal(/HijriSacredMonthBanner|hmb-/.test(calendarPage), false);

console.log("reminder-banner-removed-gate.test.ts: ok");
