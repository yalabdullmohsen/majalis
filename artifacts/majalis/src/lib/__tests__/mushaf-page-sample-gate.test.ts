/**
 * صفحات عينة: ٢ (البقرة) · ٣ · ٥٩٤ · ٥٩٥ — بيانات QPC + قواعد التخطيط.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-sample-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { clearDedupePool } from "../lru-cache";
import {
  loadMushafPage,
  resetMushafPageCachesForTests,
  type MushafPageLayout,
} from "../quran-data/qpc-page-data";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const publicRoot = resolve(root, "public");
const pagesDir = resolve(publicRoot, "data/quran-v2/pages");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const pageTsx = read("src/features/mushaf-madinah/MushafPage.tsx");
const reader = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");

assert.match(pageTsx, /"lead"/);
assert.match(pageTsx, /data-page-type=\{pageType\}/);
assert.match(css, /data-page-type="lead"/);
assert.match(css, /--mm-ref-text-start:\s*11\.5%/);
assert.match(css, /var\(--inset-top/);
assert.match(reader, /applyMushafThemeChrome/);

const SAMPLE = [2, 3, 594, 595] as const;

for (const n of SAMPLE) {
  assert.ok(
    existsSync(resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`)),
    `ناقصة: صفحة ${n}`,
  );
}

const origFetch = globalThis.fetch;
try {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.pathname
          : input instanceof Request
            ? new URL(input.url, "https://local.test").pathname
            : String(input);
    const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0] ?? url;
    const file = resolve(publicRoot, path.replace(/^\//, ""));
    if (!existsSync(file)) return new Response("missing", { status: 404 });
    return new Response(readFileSync(file), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  resetMushafPageCachesForTests();
  clearDedupePool();

  const layouts: MushafPageLayout[] = [];
  for (const n of SAMPLE) {
    layouts.push(await loadMushafPage(n));
  }

  const p2 = layouts.find((l) => l.pageNumber === 2)!;
  const p3 = layouts.find((l) => l.pageNumber === 3)!;
  const p594 = layouts.find((l) => l.pageNumber === 594)!;
  const p595 = layouts.find((l) => l.pageNumber === 595)!;

  assert.equal(p2.surahsStartingOnPage.length, 1, "ص٢ بداية البقرة");
  assert.equal(p2.surahsStartingOnPage[0]?.id, 2);
  const p2Header = p2.rows.find((r) => r.kind === "surah-header");
  assert.ok(p2Header && p2Header.kind === "surah-header");
  assert.equal(p2Header.surah.bismillahPre, true, "البقرة: بسملة");
  assert.ok(p2Header.basmalaSlot != null, "البقرة: خانة بسملة");

  assert.equal(p3.surahsStartingOnPage.length, 0, "ص٣ استمرار البقرة");
  assert.equal(p3.rows.filter((r) => r.kind === "line").length, 15);

  assert.ok(p594.surahsStartingOnPage.length >= 1 || p594.surahsOnPage.length >= 1, "ص٥٩٤ بها سور");
  assert.ok(p595.surahsStartingOnPage.length >= 1, "ص٥٩٥ بداية سورة");

  for (const layout of layouts) {
    const lineSlots = layout.rows
      .filter((r) => r.kind === "line")
      .map((r) => r.gridSlot);
    assert.ok(
      lineSlots.every((s) => s >= 1 && s <= 15),
      `خانات خارج ١٥ في ص${layout.pageNumber}`,
    );
    for (const row of layout.rows) {
      if (row.kind !== "surah-header") continue;
      if (row.surah.id === 9) {
        assert.equal(row.surah.bismillahPre, false, "التوبة: بلا بسملة");
        assert.equal(row.basmalaSlot, null);
      }
    }
  }
} finally {
  globalThis.fetch = origFetch;
  resetMushafPageCachesForTests();
  clearDedupePool();
}

console.log("mushaf-page-sample-gate.test.ts: ok pages=", SAMPLE.join(","));
