#!/usr/bin/env node
/**
 * Builds mushaf navigation index (604 pages) from Quran.com API v4.
 * Output: public/data/mushaf/page-index.json
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/data/mushaf/page-index.json");
const API = "https://api.quran.com/api/v4";
const TOTAL_PAGES = 604;

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function revelationLabel(place) {
  return place === "makkah" ? "مكية" : "مدنية";
}

async function main() {
  console.log("Fetching chapters, juzs, hizbs…");
  const [chaptersRes, juzsRes, hizbsRes] = await Promise.all([
    fetchJson(`${API}/chapters?language=ar`),
    fetchJson(`${API}/juzs`),
    fetchJson(`${API}/hizbs`),
  ]);

  const chapters = chaptersRes.chapters.map((c) => ({
    number: c.id,
    name: c.name_arabic,
    englishName: c.name_simple,
    ayahs: c.verses_count,
    revelation: revelationLabel(c.revelation_place),
    startPage: c.pages[0],
    endPage: c.pages[1],
  }));

  const juzMap = new Map();
  for (const j of juzsRes.juzs) {
    if (!juzMap.has(j.juz_number)) juzMap.set(j.juz_number, j);
  }
  const juzs = [...juzMap.values()]
    .sort((a, b) => a.juz_number - b.juz_number)
    .map((j) => ({ number: j.juz_number, verseMapping: j.verse_mapping }));

  const hizbMap = new Map();
  for (const h of hizbsRes.hizbs) {
    if (!hizbMap.has(h.hizb_number)) hizbMap.set(h.hizb_number, h);
  }
  const hizbs = [...hizbMap.values()]
    .sort((a, b) => a.hizb_number - b.hizb_number)
    .map((h) => ({ number: h.hizb_number, verseMapping: h.verse_mapping }));

  console.log("Fetching page metadata (604 pages)…");
  const pages = [];
  const quarterMap = new Map();

  for (let page = 1; page <= TOTAL_PAGES; page += 1) {
    const data = await fetchJson(
      `${API}/verses/by_page/${page}?words=false&per_page=1&fields=verse_key,verse_number,juz_number,hizb_number,rub_el_hizb_number,page_number`,
    );
    const v = data.verses[0];
    const [surahNum] = v.verse_key.split(":").map(Number);
    const surah = chapters.find((c) => c.number === surahNum);
    pages.push({
      page,
      juz: v.juz_number,
      hizb: v.hizb_number,
      quarter: v.rub_el_hizb_number,
      surah: surahNum,
      surahName: surah?.name ?? "",
    });

    if (!quarterMap.has(v.rub_el_hizb_number)) {
      quarterMap.set(v.rub_el_hizb_number, {
        number: v.rub_el_hizb_number,
        juz: v.juz_number,
        hizb: v.hizb_number,
        startPage: page,
      });
    }

    if (page % 50 === 0) console.log(`  page ${page}/${TOTAL_PAGES}`);
  }

  const quarters = [...quarterMap.values()].sort((a, b) => a.number - b.number);

  for (const j of juzs) {
    const first = pages.find((p) => p.juz === j.number);
    j.startPage = first?.page ?? 1;
  }
  for (const h of hizbs) {
    const first = pages.find((p) => p.hizb === h.number);
    h.startPage = first?.page ?? 1;
  }

  const payload = {
    edition: "المصحف الشريف — طبعة دولة الكويت (رواية حفص)",
    totalPages: TOTAL_PAGES,
    generatedAt: new Date().toISOString(),
    source: "api.quran.com v4 (604-page Madinah layout)",
    surahs: chapters,
    juzs,
    hizbs,
    quarters,
    pages,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload));
  console.log(`Wrote ${OUT} (${(JSON.stringify(payload).length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
