#!/usr/bin/env node
/**
 * توليد بيان صفحات المصحف (ترقيم مدينة، 604 صفحة) — حتمي + وضع --check.
 *
 * تشغيل:
 *   node scripts/generate-quran-pages-manifest.mjs
 *   node scripts/generate-quran-pages-manifest.mjs --check
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data", "quran");
const OUT_PATH = path.join(DATA_DIR, "pages-manifest.json");

const EXPECTED_TOTAL_PAGES = 604;
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const checkOnly = process.argv.includes("--check");

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`.replace(/\r\n/g, "\n");
}

async function buildManifest() {
  const manifestRaw = await readFile(path.join(DATA_DIR, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestRaw);

  // Deterministic surah order: prefer manifest.surahs, else sorted surah-*.json
  let surahEntries = Array.isArray(manifest.surahs) ? [...manifest.surahs] : [];
  surahEntries.sort((a, b) => Number(a.number) - Number(b.number));
  if (!surahEntries.length) {
    const files = (await readdir(DATA_DIR))
      .filter((f) => /^surah-\d+\.json$/.test(f))
      .sort((a, b) => {
        const na = Number(a.match(/surah-(\d+)/)[1]);
        const nb = Number(b.match(/surah-(\d+)/)[1]);
        return na - nb;
      });
    surahEntries = files.map((file) => ({
      number: Number(file.match(/surah-(\d+)/)[1]),
      file,
    }));
  }

  /** @type {Map<number, Array<{surah:number, from:number, to:number}>>} */
  const byPage = new Map();
  const firstPageOfJuz = new Map();
  let totalAyahsSeen = 0;

  for (const entry of surahEntries) {
    const content = JSON.parse(await readFile(path.join(DATA_DIR, entry.file), "utf8"));
    const ayahs = [...(content.ayahs || [])].sort(
      (a, b) => Number(a.numberInSurah) - Number(b.numberInSurah),
    );
    let rangeStart = null;
    let rangePage = null;
    let prevAyah = null;

    const flush = (endAyah) => {
      if (rangePage == null || rangeStart == null) return;
      const list = byPage.get(rangePage) ?? [];
      list.push({ surah: Number(entry.number), from: rangeStart, to: endAyah });
      byPage.set(rangePage, list);
    };

    for (const ayah of ayahs) {
      totalAyahsSeen++;
      if (rangePage === null) {
        rangePage = ayah.page;
        rangeStart = ayah.numberInSurah;
      } else if (ayah.page !== rangePage) {
        flush(prevAyah.numberInSurah);
        rangePage = ayah.page;
        rangeStart = ayah.numberInSurah;
      }
      if (!firstPageOfJuz.has(ayah.juz) || ayah.page < firstPageOfJuz.get(ayah.juz)) {
        firstPageOfJuz.set(ayah.juz, ayah.page);
      }
      prevAyah = ayah;
    }
    if (prevAyah) flush(prevAyah.numberInSurah);
  }

  // Stable range order within each page
  for (const [page, ranges] of byPage) {
    ranges.sort((a, b) => a.surah - b.surah || a.from - b.from || a.to - b.to);
    byPage.set(page, ranges);
  }

  const pages = [];
  for (let p = 1; p <= EXPECTED_TOTAL_PAGES; p++) {
    const ranges = byPage.get(p);
    if (!ranges) {
      throw new Error(`الصفحة ${p} بلا أي آيات`);
    }
    pages.push({ page: p, ranges });
  }

  const extraPages = [...byPage.keys()].filter((p) => p < 1 || p > EXPECTED_TOTAL_PAGES);
  if (extraPages.length) {
    throw new Error(`أرقام صفحات خارج النطاق 1-604: ${extraPages.sort((a, b) => a - b).join(", ")}`);
  }

  const EXPECTED_JUZ_COUNT = 30;
  if (firstPageOfJuz.size !== EXPECTED_JUZ_COUNT) {
    throw new Error(`عدد الأجزاء المكتشفة ${firstPageOfJuz.size} ≠ 30`);
  }
  const juz = [];
  for (let j = 1; j <= EXPECTED_JUZ_COUNT; j++) {
    if (!firstPageOfJuz.has(j)) throw new Error(`الجزء ${j} غير موجود`);
    juz.push({ juz: j, firstPage: firstPageOfJuz.get(j) });
  }

  // No generatedAt / timestamps — content-derived only for git stability.
  return {
    output: {
      $comment:
        "مُولَّد آليًا من public/data/quran/surah-*.json عبر scripts/generate-quran-pages-manifest.mjs — لا تحرّره يدويًا. لا يحتوي نص أي آية، إشارات (سورة/نطاق رقم آية، وأول صفحة لكل جزء) فقط.",
      totalPages: EXPECTED_TOTAL_PAGES,
      pages,
      juz,
    },
    totalAyahsSeen,
  };
}

async function main() {
  console.log(`${BOLD}توليد بيان صفحات المصحف (604 صفحة)${checkOnly ? " [--check]" : ""}${RESET}\n`);
  const { output, totalAyahsSeen } = await buildManifest();
  const next = stableStringify(output);

  let current = null;
  try {
    current = (await readFile(OUT_PATH, "utf8")).replace(/\r\n/g, "\n");
  } catch {
    current = null;
  }

  if (checkOnly) {
    if (current === next) {
      console.log(`${GREEN}✓ pages-manifest.json مطابق (حتمي)${RESET}`);
      return;
    }
    console.error(`${RED}✗ pages-manifest.json مختلف عن التوليد الحتمي${RESET}`);
    process.exit(1);
  }

  if (current === next) {
    console.log(`${GREEN}✓ لا تغيير — الملف محدّث أصلًا${RESET}`);
  } else {
    await writeFile(OUT_PATH, next, "utf8");
    console.log(`${GREEN}✓ كُتب public/data/quran/pages-manifest.json${RESET}`);
  }
  console.log(
    `${GREEN}✓ ${EXPECTED_TOTAL_PAGES} صفحة، ${totalAyahsSeen} آية، ${output.juz.length} جزءًا مفحوصة${RESET}`,
  );
}

main().catch((err) => {
  console.error(`${RED}خطأ:${RESET}`, err instanceof Error ? err.message : err);
  process.exit(1);
});
