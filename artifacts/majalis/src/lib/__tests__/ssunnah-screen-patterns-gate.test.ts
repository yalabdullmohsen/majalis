/**
 * بوابة أنماط الشاشات: تعريف + ربط دفعة 1 + لا قيم حرفية في CSS الأنماط.
 * node --import tsx src/lib/__tests__/ssunnah-screen-patterns-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SS_SCREEN_PATTERNS,
  SS_SCREEN_ROUTE_PATTERN,
  SS_SCREEN_PATTERN_META,
} from "../ssunnah-screen-patterns";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.equal(SS_SCREEN_PATTERNS.length, 8, "ثمانية أنماط");
for (const p of SS_SCREEN_PATTERNS) {
  assert.ok(SS_SCREEN_PATTERN_META[p]?.labelAr, `meta للنمط ${p}`);
}

const patternsSrc = read("src/components/design-system/screens/patterns.tsx");
for (const name of [
  "GridScreen",
  "ListScreen",
  "ReaderScreen",
  "ScriptureScreen",
  "PlayerScreen",
  "DetailScreen",
  "DashboardScreen",
  "UtilityScreen",
]) {
  assert.match(patternsSrc, new RegExp(`export function ${name}`), name);
}

const shell = read("src/components/design-system/screens/ScreenShell.tsx");
assert.match(shell, /data-ss-screen-pattern/);
assert.match(shell, /EmptyState/);
assert.match(shell, /loading|empty|error/);

const css = read("src/styles/ssunnah-screen-patterns.css");
assert.doesNotMatch(css, /#[0-9A-Fa-f]{3,8}\b/, "CSS الأنماط بلا هكس");
assert.match(css, /--ss-space-|--spacing-mj-/);
assert.match(css, /ss-screen-grid--2/);

const main = read("src/main.tsx");
assert.match(main, /ssunnah-screen-patterns\.css/);

const dsIndex = read("src/components/design-system/index.ts");
assert.match(dsIndex, /GridScreen|DashboardScreen/);
assert.match(dsIndex, /SS_SCREEN_ROUTE_PATTERN/);

const doc = read("docs/SSUNNAH_SCREEN_PATTERNS.md");
assert.match(doc, /الثوابت/);
assert.match(doc, /GridScreen/);
assert.match(doc, /ScriptureScreen/);
assert.match(doc, /ممنوع/);

const batch1 = SS_SCREEN_ROUTE_PATTERN.filter((r) => r.batch === 1);
assert.ok(batch1.length >= 10, "دفعة 1 تغطي الشاشات الأساسية");

const expectImport: Record<string, string> = {
  dashboard: "DashboardScreen",
  grid: "GridScreen",
  list: "ListScreen",
  reader: "ReaderScreen",
  scripture: "ScriptureScreen",
  detail: "DetailScreen",
  utility: "UtilityScreen",
  player: "PlayerScreen",
};

for (const row of batch1) {
  assert.ok(existsSync(resolve(root, row.source)), `مصدر مفقود: ${row.source}`);
  const src = read(row.source);
  const comp = expectImport[row.pattern];
  assert.match(src, new RegExp(comp), `${row.id} يستورد ${comp}`);
  assert.match(src, /compose=["']mark["']|compose=["']layout["']/, `${row.id} يحدّد compose`);
  assert.doesNotMatch(src, /fontSize:\s*["'][0-9]+px/, `${row.id}: بلا fontSize px جديد`);
}

assert.match(read("src/pages/quran/MushafReaderPage.tsx"), /ScriptureScreen/);
assert.match(read("src/pages/quran/MushafReaderPage.tsx"), /MushafViewport|NewMushafReader/);

console.log(
  `ssunnah-screen-patterns-gate.test.ts: ok · أنماط=${SS_SCREEN_PATTERNS.length} · دفعة1=${batch1.length}`,
);
