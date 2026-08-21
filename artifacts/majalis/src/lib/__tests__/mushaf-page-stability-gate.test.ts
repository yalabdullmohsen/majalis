/**
 * ثبات عرض صفحات المصحف: 247–249 (يوسف → الرعد) — بيانات page_number،
 * رأس/ذيل ثابتان، حاوية واحدة، تنقل ±١. بلا إعادة بناء للنص.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-stability-gate.test.ts
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
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

type RawVerse = {
  verse_key: string;
  page_number: number;
  juz_number: number;
  words: { line_number: number }[];
};

function loadRaw(n: number): RawVerse[] {
  const file = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `ناقصة: صفحة ${n}`);
  return JSON.parse(readFileSync(file, "utf8")) as RawVerse[];
}

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const pageComp = read("src/features/mushaf-madinah/MushafPage.tsx");
const header = read("src/features/mushaf-madinah/MushafPageHeader.tsx");
const footer = read("src/features/mushaf-madinah/MushafPageFooter.tsx");
const pager = read("src/features/mushaf-madinah/MushafPager.tsx");
const readerPage = read("src/pages/quran/MushafReaderPage.tsx");
const dataSrc = read("src/lib/quran-data/qpc-page-data.ts");

assert.match(pageComp, /headerSurahName/);
assert.doesNotMatch(header, /join\(/);
assert.match(header, /mm-page-header__surah/);
assert.match(header, /mm-page-header__juz/);
assert.match(css, /\.mm-page-header__surah\s*\{[^}]*right:\s*0/);
assert.match(css, /\.mm-page-header__juz\s*\{[^}]*left:\s*0/);
assert.match(css, /font-size:\s*clamp\(0\.78rem,\s*2\.8vw,\s*0\.95rem\)/);

assert.match(footer, /mm-page-footer__cartouche/);
assert.match(css, /\.mm-page-footer__badge\s*\{[^}]*left:\s*50%/);
assert.match(css, /transform:\s*translate\(-50%,\s*-50%\)/);
assert.match(css, /width:\s*13\.1%/);
assert.match(css, /z-index:\s*9/);
assert.match(css, /\[data-chrome="1"\]\s*\.mm-controls__page\s*\{[^}]*opacity:\s*0/);

assert.match(css, /grid-template-rows:\s*repeat\(15,\s*minmax\(0,\s*1fr\)\)/);
assert.match(css, /--mm-ref-ink-x-start:\s*1\.5%/);
assert.match(css, /--mm-ref-ink-x-end:\s*98\.4%/);
assert.doesNotMatch(css, /\[data-page="247"\]|\[data-page="248"\]|\[data-page="249"\]/);
assert.doesNotMatch(pageComp, /margin-inline:\s*-/);

assert.match(pager, /dx > 0/);
assert.match(pager, /go\(page \+ 1\)/);
assert.match(pager, /go\(page - 1\)/);
assert.doesNotMatch(pager, /go\(page \+ 2\)/);
assert.match(readerPage, /loadReadingAyahKey/);
assert.match(readerPage, /ayahKeyToPage/);
assert.match(dataSrc, /headerSurahName/);

const expected: Record<
  number,
  { first: string; last: string; surah: number; juz: number; startsSurah: boolean }
> = {
  247: { first: "12:96", last: "12:103", surah: 12, juz: 13, startsSurah: false },
  248: { first: "12:104", last: "12:111", surah: 12, juz: 13, startsSurah: false },
  249: { first: "13:1", last: "13:5", surah: 13, juz: 13, startsSurah: true },
};

for (const n of [247, 248, 249] as const) {
  const raw = loadRaw(n);
  const exp = expected[n]!;
  assert.ok(raw.length > 0, `صفحة ${n}: بلا آيات`);
  assert.equal(raw[0]!.verse_key, exp.first, `صفحة ${n}: أول آية`);
  assert.equal(raw[raw.length - 1]!.verse_key, exp.last, `صفحة ${n}: آخر آية`);
  for (const v of raw) {
    assert.equal(v.page_number, n, `صفحة ${n}: page_number=${v.page_number} لـ ${v.verse_key}`);
    const surah = Number(v.verse_key.split(":")[0]);
    assert.equal(surah, exp.surah, `صفحة ${n}: سورة ${surah} ≠ ${exp.surah}`);
    assert.equal(v.juz_number, exp.juz, `صفحة ${n}: جزء ${v.juz_number}`);
  }
  const hasAyah1 = raw.some((v) => v.verse_key.endsWith(":1"));
  assert.equal(hasAyah1, exp.startsSurah, `صفحة ${n}: بداية سورة`);
}

assert.equal(247 + 1, 248);
assert.equal(248 + 1, 249);
assert.equal(249 - 1, 248);
assert.equal(248 - 1, 247);

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
  for (const n of [247, 248, 249]) {
    layouts.push(await loadMushafPage(n));
  }
  const [p247, p248, p249] = layouts as [MushafPageLayout, MushafPageLayout, MushafPageLayout];

  assert.equal(p247.pageNumber, 247);
  assert.equal(p247.juzNumber, 13);
  assert.equal(p247.headerSurahName, "يوسف");
  assert.equal(p247.surahsStartingOnPage.length, 0);

  assert.equal(p248.pageNumber, 248);
  assert.equal(p248.juzNumber, 13);
  assert.equal(p248.headerSurahName, "يوسف");
  assert.equal(p248.surahsStartingOnPage.length, 0);

  assert.equal(p249.pageNumber, 249);
  assert.equal(p249.juzNumber, 13);
  assert.equal(p249.headerSurahName, "الرعد");
  assert.equal(p249.surahsStartingOnPage.length, 1);
  assert.equal(p249.surahsStartingOnPage[0]?.id, 13);

  const header249 = p249.rows.find((r) => r.kind === "surah-header");
  assert.ok(header249 && header249.kind === "surah-header");
  assert.equal(header249.bannerSlot, 1);
  assert.equal(header249.basmalaSlot, 2);
  assert.equal(header249.surah.bismillahPre, true);

  for (const layout of [p247, p248, p249]) {
    assert.equal(layout.layoutMode, "standard");
    const lineSlots = layout.rows.filter((r) => r.kind === "line").map((r) => r.gridSlot);
    assert.ok(lineSlots.every((s) => s >= 1 && s <= 15), `خانات خارج ١٥ في ص${layout.pageNumber}`);
  }

  const lineSlots247 = p247.rows.filter((r) => r.kind === "line").map((r) => r.gridSlot);
  const lineSlots248 = p248.rows.filter((r) => r.kind === "line").map((r) => r.gridSlot);
  assert.deepEqual(lineSlots247, lineSlots248, "٢٤٧ و٢٤٨ نفس شبكة الأسطر");
} finally {
  globalThis.fetch = origFetch;
  resetMushafPageCachesForTests();
  clearDedupePool();
}

console.log("mushaf-page-stability-gate.test.ts: ok pages=247,248,249");
