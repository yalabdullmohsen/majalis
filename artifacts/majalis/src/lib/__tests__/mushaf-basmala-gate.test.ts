/**
 * بوابة البسملة — صفحات الفاتحة/البقرة/التوبة/الكهف/مريم.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-basmala-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pagesDir = resolve(root, "public/data/quran-v2/pages");
const chapters = JSON.parse(
  readFileSync(resolve(root, "public/data/quran-v2/chapters.json"), "utf8"),
) as Array<{
  id: number;
  name_arabic: string;
  bismillah_pre: boolean;
  pages: [number, number];
}>;
const pageSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPage.tsx"), "utf8");
const dataSrc = readFileSync(resolve(root, "src/lib/quran-data/qpc-page-data.ts"), "utf8");

assert.match(pageSrc, /needsVisualBasmala/);
assert.match(pageSrc, /bismillahPre === true/);
assert.match(pageSrc, /BASMALA/);
assert.match(dataSrc, /basmalaSlot/);

function chapter(id: number) {
  const c = chapters.find((x) => x.id === id);
  assert.ok(c, `سورة ${id}`);
  return c!;
}

const CASES = [
  { id: 1, page: 1, label: "الفاتحة", expectBismillahPre: false, note: "البسملة آية 1" },
  { id: 2, page: 2, label: "بداية البقرة", expectBismillahPre: true },
  { id: 9, page: 187, label: "بداية التوبة", expectBismillahPre: false },
  { id: 18, page: 293, label: "بداية الكهف", expectBismillahPre: true },
  { id: 19, page: 305, label: "بداية مريم", expectBismillahPre: true },
] as const;

for (const c of CASES) {
  const ch = chapter(c.id);
  assert.equal(ch.bismillah_pre, c.expectBismillahPre, `${c.label}: bismillah_pre`);
  assert.equal(ch.pages[0], c.page, `${c.label}: صفحة البداية`);
  const file = resolve(pagesDir, `page-${String(c.page).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `${c.label}: ملف الصفحة ${c.page}`);
}

console.log("mushaf-basmala-gate.test.ts: ok");
