#!/usr/bin/env node
/**
 * تنزيل التفاسير المجمَّعة محلياً — Quran.com v4 by_chapter.
 * الاستعمال: node scripts/tafsir/download-tafsir-bundles.mjs [--ids=muyassar,saadi]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY_PATH = resolve(root, "public/data/tafsir/tafsir-registry.json");
const OUT_DIR = resolve(root, "public/data/tafsir");
const QURAN_COM = "https://api.quran.com/api/v4";
const CONCURRENCY = 3;
const TOTAL_AYAHS = 6236;

const SURAH_AYAH_COUNTS = [
  0, 7, 286, 200, 176, 120, 165, 206, 109, 123, 111, 52, 99, 123, 111, 128, 110, 165, 155, 98, 135, 112, 78,
  118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18,
  45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50,
  40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6,
  3, 5, 4, 5, 6,
];

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchAyah(slug, surah, ayah, attempt = 0) {
  const url = `${QURAN_COM}/tafsirs/${encodeURIComponent(slug)}/by_ayah/${surah}:${ayah}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (res.status === 503 && attempt < 4) {
    await sleep(400 * (attempt + 1));
    return fetchAyah(slug, surah, ayah, attempt + 1);
  }
  if (!res.ok) return null;
  const json = await res.json();
  const raw = json.tafsir?.text?.trim();
  return raw ? stripTags(raw) : null;
}

function stripTags(html) {
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\s*\d+-\d+\s*>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchChapter(slug, surah) {
  const ayahs = {};
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const url = `${QURAN_COM}/tafsirs/${encodeURIComponent(slug)}/by_chapter/${surah}?page=${page}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`${slug} surah ${surah} p${page}: HTTP ${res.status}`);
    const json = await res.json();
    totalPages = json.pagination?.total_pages ?? 1;
    const rows = Array.isArray(json.tafsirs) ? json.tafsirs : [];
    for (const row of rows) {
      const key = String(row.verse_key ?? "");
      const m = key.match(/^(\d+):(\d+)$/);
      if (!m) continue;
      const ayahNum = m[2];
      const text = stripTags(row.text);
      if (text) ayahs[ayahNum] = text;
    }
    page += 1;
  }
  return ayahs;
}

async function poolMap(items, worker, concurrency = CONCURRENCY) {
  const results = new Array(items.length);
  let idx = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (true) {
        const i = idx++;
        if (i >= items.length) return;
        results[i] = await worker(items[i], i);
      }
    }),
  );
  return results;
}

function parseIdsArg() {
  const arg = process.argv.find((a) => a.startsWith("--ids="));
  if (!arg) return null;
  return arg.slice("--ids=".length).split(",").map((s) => s.trim()).filter(Boolean);
}

async function main() {
  const registry = JSON.parse(await readFile(REGISTRY_PATH, "utf8"));
  const filterIds = parseIdsArg();
  const bundled = (registry.tafsirs ?? []).filter(
    (t) => t.type === "text" && t.bundled && (!filterIds || filterIds.includes(t.id)),
  );
  if (!bundled.length) {
    console.error("No bundled tafsirs to download.");
    process.exit(1);
  }

  const report = { updatedAt: new Date().toISOString(), tafsirs: [] };

  for (const t of bundled) {
    const slug = t.quranComSlug;
    if (!slug) throw new Error(`Missing quranComSlug for ${t.id}`);
    const dir = resolve(OUT_DIR, t.id);
    await mkdir(dir, { recursive: true });

    console.log(`[download-tafsir] ${t.id} (${slug}) …`);
    const surahs = Array.from({ length: 114 }, (_, i) => i + 1);
    let ayahCount = 0;
    let emptyAyahs = 0;

    await poolMap(surahs, async (surah) => {
      const ayahs = await fetchChapter(slug, surah);
      const expected = SURAH_AYAH_COUNTS[surah] ?? 0;
      const missing = [];
      for (let a = 1; a <= expected; a += 1) {
        if (!ayahs[String(a)]?.trim()) missing.push(a);
      }
      if (missing.length) {
        process.stdout.write(`  surah ${surah}: fill ${missing.length} gaps…\n`);
        for (const ayah of missing) {
          const text = await fetchAyah(slug, surah, ayah);
          if (text) ayahs[String(ayah)] = text;
          await sleep(120);
        }
      }
      const count = Object.keys(ayahs).filter((k) => ayahs[k]?.trim()).length;
      ayahCount += count;
      for (const v of Object.values(ayahs)) {
        if (!v?.trim()) emptyAyahs += 1;
      }
      const payload = {
        surah,
        tafsirId: t.id,
        quranComSlug: slug,
        ayahs,
      };
      await writeFile(resolve(dir, `${String(surah).padStart(3, "0")}.json`), JSON.stringify(payload), "utf8");
      process.stdout.write(`  surah ${surah}/114 (${count}/${expected} ayahs)\n`);
    });

    t.coverage = ayahCount;
    t.bundledCoverageOk = ayahCount >= TOTAL_AYAHS;
    report.tafsirs.push({
      id: t.id,
      ayahCount,
      expected: TOTAL_AYAHS,
      ok: ayahCount >= TOTAL_AYAHS,
    });
    console.log(`[download-tafsir] ${t.id}: ${ayahCount}/${TOTAL_AYAHS} ayahs`);
  }

  registry.updatedAt = report.updatedAt;
  await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf8");
  await writeFile(resolve(OUT_DIR, "download-report.json"), JSON.stringify(report, null, 2), "utf8");

  const failed = report.tafsirs.filter((r) => !r.ok);
  if (failed.length) {
    console.error("[download-tafsir] coverage incomplete:", failed);
    process.exit(2);
  }
  console.log("[download-tafsir] ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
