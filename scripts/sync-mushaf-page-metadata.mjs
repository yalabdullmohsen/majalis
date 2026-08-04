#!/usr/bin/env node
/**
 * مزامنة حدود صفحات المصحف (604) من موقع majalis إلى تطبيق mushafi.
 *
 * المصدر (لا نص قرآن — حدود صفحات فقط):
 *   artifacts/majalis/public/data/quran/pages-manifest.json
 *   artifacts/majalis/public/data/quran/page-juz-index.json
 *
 * الهدف:
 *   artifacts/mushafi/assets/quran/quran_page_metadata.json
 *
 * تشغيل من جذر المستودع:
 *   node scripts/sync-mushaf-page-metadata.mjs
 *   node scripts/sync-mushaf-page-metadata.mjs --check
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(
  ROOT,
  "artifacts/majalis/public/data/quran/pages-manifest.json",
);
const PAGE_JUZ = path.join(
  ROOT,
  "artifacts/majalis/public/data/quran/page-juz-index.json",
);
const OUT = path.join(
  ROOT,
  "artifacts/mushafi/assets/quran/quran_page_metadata.json",
);

const EXPECTED = 604;
const checkOnly = process.argv.includes("--check");

function ayahInSeg(seg, surah, ayah) {
  return (
    Number(seg.surah) === surah &&
    ayah >= Number(seg.ayahFrom) &&
    ayah <= Number(seg.ayahTo)
  );
}

function findUnit(map, surah, ayah) {
  for (const [key, segs] of Object.entries(map)) {
    for (const seg of segs) {
      if (ayahInSeg(seg, surah, ayah)) return Number(key);
    }
  }
  return 0;
}

function juzForPage(juzList, page) {
  let current = 1;
  for (const entry of juzList) {
    if (page >= Number(entry.firstPage)) current = Number(entry.juz);
  }
  return current;
}

async function build() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const index = JSON.parse(await readFile(PAGE_JUZ, "utf8"));
  const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
  if (pages.length !== EXPECTED) {
    throw new Error(`Expected ${EXPECTED} pages, got ${pages.length}`);
  }

  const out = pages.map((page) => {
    const pageNumber = Number(page.page);
    const ranges = Array.isArray(page.ranges) ? page.ranges : [];
    if (!ranges.length) {
      throw new Error(`Page ${pageNumber} has no ranges`);
    }
    const first = ranges[0];
    const last = ranges[ranges.length - 1];
    const fromSurah = Number(first.surah);
    const fromAyah = Number(first.from);
    const toSurah = Number(last.surah);
    const toAyah = Number(last.to);
    return {
      pageNumber,
      juz: juzForPage(manifest.juz || [], pageNumber),
      hizb: findUnit(index.byHizb || {}, fromSurah, fromAyah),
      rub: findUnit(index.byRub || {}, fromSurah, fromAyah),
      fromSurah,
      fromAyah,
      toSurah,
      toAyah,
    };
  });

  return `${JSON.stringify(out, null, 2)}\n`;
}

async function main() {
  const next = await build();
  if (checkOnly) {
    const current = await readFile(OUT, "utf8").catch(() => "");
    if (current.replace(/\r\n/g, "\n") !== next) {
      console.error("quran_page_metadata.json is out of sync with majalis pages-manifest.");
      process.exit(1);
    }
    console.log("OK: mushafi page metadata matches majalis pages-manifest.");
    return;
  }
  await writeFile(OUT, next, "utf8");
  console.log(`Wrote ${OUT} (${EXPECTED} pages) from majalis pages-manifest.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
