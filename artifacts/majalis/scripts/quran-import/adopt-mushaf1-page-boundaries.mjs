#!/usr/bin/env node
/**
 * adopt-mushaf1-page-boundaries.mjs
 *
 * يعيد إسناد حدود الصفحات + line_number + position من mushaf=1 (QCF V2)
 * مع الإبقاء على كائنات الكلمات المحلية (النص/code_v2) دون تغيير.
 *
 * بوابة حاكمة: تجزئة النص الكامل (code_v2 + text_uthmani + ترتيب الآيات)
 * قبل/بعد يجب أن تتطابق حرفياً — وإلا تراجع بلا كتابة.
 *
 * تشغيل: node scripts/quran-import/adopt-mushaf1-page-boundaries.mjs
 */
import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(APP_ROOT, "public/data/quran-v2");
const PAGES_DIR = path.join(OUT_DIR, "pages");
const BACKUP_DIR = path.join(APP_ROOT, ".local/mushaf/pages-backup-pre-mushaf1");
const CACHE_PAGES = path.join(APP_ROOT, ".local/mushaf/mushaf1-all-pages.json");

export const MUSHAF_ID_QCF_V2 = 1;
const TOTAL = 604;
const API = "https://api.qurancdn.com/api/qdc/verses/by_page";
const CONCURRENCY = 8;

/** صفحات ينتهي محتواها قبل السطر 15 في مصحف المدينة (mushaf=1) */
const KNOWN_MAX_LINE_LT_15 = new Set([
  1, 2, 76, 207, 331, 341, 349, 366, 376, 414, 417, 445, 452, 498, 506, 525, 548, 555, 557, 584,
]);

function sha(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function pagePath(n) {
  return path.join(PAGES_DIR, `page-${String(n).padStart(3, "0")}.json`);
}

async function fetchJson(url, attempt = 1) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
      return fetchJson(url, attempt + 1);
    }
    throw err;
  }
}

async function loadLocalPages() {
  const byPage = [];
  const verseMap = new Map();
  for (let n = 1; n <= TOTAL; n++) {
    const verses = JSON.parse(await readFile(pagePath(n), "utf8"));
    if (!Array.isArray(verses) || verses.length === 0) {
      throw new Error(`صفحة محلية فارغة: ${n}`);
    }
    byPage[n] = verses;
    for (const v of verses) {
      if (verseMap.has(v.verse_key)) {
        throw new Error(`آية مكررة محلياً: ${v.verse_key}`);
      }
      verseMap.set(v.verse_key, structuredClone(v));
    }
  }
  return { byPage, verseMap };
}

function fingerprintFromPages(byPage) {
  const codes = [];
  const texts = [];
  const verseOrder = [];
  const ayahSet = new Set();
  let words = 0;
  for (let n = 1; n <= TOTAL; n++) {
    const verses = byPage[n];
    if (!verses?.length) throw new Error(`صفحة فارغة في البصمة: ${n}`);
    for (const v of verses) {
      ayahSet.add(v.verse_key);
      verseOrder.push(v.verse_key);
      for (const w of v.words ?? []) {
        words++;
        codes.push(w.code_v2 ?? "");
        texts.push(w.text_uthmani ?? "");
        if (w.line_number == null) throw new Error(`كلمة بلا سطر ${v.verse_key}`);
      }
    }
  }
  return {
    ayahCount: ayahSet.size,
    wordCount: words,
    verseOrderLen: verseOrder.length,
    codesSha: sha(codes.join("")),
    textsSha: sha(texts.join("")),
    verseOrderSha: sha(verseOrder.join("|")),
  };
}

function validateStructural(byPage) {
  const issues = [];
  const seen = new Set();
  for (let n = 1; n <= TOTAL; n++) {
    const verses = byPage[n];
    if (!verses?.length) {
      issues.push(`صفحة فارغة ${n}`);
      continue;
    }
    const lines = new Set();
    for (const v of verses) {
      if (seen.has(v.verse_key)) issues.push(`آية مكررة ${v.verse_key}`);
      seen.add(v.verse_key);
      if (v.page_number !== n) issues.push(`${v.verse_key}: page_number=${v.page_number} ≠ ${n}`);
      let expectedPos = 1;
      let prevLine = 0;
      for (const w of v.words ?? []) {
        if (typeof w.line_number !== "number" || w.line_number < 1 || w.line_number > 15) {
          issues.push(`${v.verse_key}: سطر خارج 1–15 (${w.line_number})`);
        } else {
          lines.add(w.line_number);
          if (w.line_number < prevLine) issues.push(`${v.verse_key}: line تنازلي`);
          prevLine = w.line_number;
        }
        if (w.position !== expectedPos) {
          issues.push(`${v.verse_key}: position=${w.position} متوقع ${expectedPos}`);
        }
        expectedPos++;
      }
    }
    const maxLn = lines.size ? Math.max(...lines) : 0;
    if (n >= 3 && maxLn !== 15 && !KNOWN_MAX_LINE_LT_15.has(n)) {
      issues.push(`صفحة ${n}: أقصى سطر=${maxLn} متوقع 15`);
    }
  }
  if (seen.size !== 6236) issues.push(`عدد الآيات ${seen.size} ≠ 6236`);
  return issues;
}

async function loadMushaf1Pages() {
  try {
    const cached = JSON.parse(await readFile(CACHE_PAGES, "utf8"));
    if (Array.isArray(cached) && cached.length === TOTAL + 1 && cached[1]?.length) {
      console.log("استخدام كاش mushaf=1 المحلي");
      return cached;
    }
  } catch {
    /* fetch */
  }
  console.log("جلب mushaf=1 من API...");
  const results = new Array(TOTAL + 1);
  let done = 0;
  const pages = Array.from({ length: TOTAL }, (_, i) => i + 1);
  async function worker(chunk) {
    for (const n of chunk) {
      const url =
        `${API}/${n}?words=true` +
        `&word_fields=text_uthmani,text_qpc_hafs,code_v2,line_number,position,char_type_name` +
        `&mushaf=${MUSHAF_ID_QCF_V2}&per_page=50`;
      const data = await fetchJson(url);
      results[n] = data.verses ?? [];
      done++;
      if (done % 100 === 0) console.log(`  جلب ${done}/${TOTAL}`);
    }
  }
  const chunks = Array.from({ length: CONCURRENCY }, (_, i) =>
    pages.filter((_, idx) => idx % CONCURRENCY === i),
  );
  await Promise.all(chunks.map(worker));
  await mkdir(path.dirname(CACHE_PAGES), { recursive: true });
  await writeFile(CACHE_PAGES, JSON.stringify(results));
  return results;
}

function assembleFromMushaf1(verseMap, mushaf1Pages) {
  const byPage = new Array(TOTAL + 1);
  for (let n = 1; n <= TOTAL; n++) {
    const apiVerses = mushaf1Pages[n] ?? [];
    if (!apiVerses.length) throw new Error(`mushaf=1 صفحة فارغة ${n}`);
    const out = [];
    for (const av of apiVerses) {
      const local = verseMap.get(av.verse_key);
      if (!local) throw new Error(`آية غائبة محلياً: ${av.verse_key}`);
      const clone = structuredClone(local);
      clone.page_number = n;
      // حافظ على حقول الصفحة الوصفية من API إن وُجدت
      if (av.juz_number != null) clone.juz_number = av.juz_number;
      if (av.hizb_number != null) clone.hizb_number = av.hizb_number;
      if (av.rub_el_hizb_number != null) clone.rub_el_hizb_number = av.rub_el_hizb_number;

      const apiWords = av.words ?? [];
      const localWords = clone.words ?? [];
      if (apiWords.length !== localWords.length) {
        throw new Error(
          `اختلاف عدد كلمات ${av.verse_key}: محلي=${localWords.length} m1=${apiWords.length}`,
        );
      }
      for (let i = 0; i < localWords.length; i++) {
        const lw = localWords[i];
        const aw = apiWords[i];
        if ((lw.code_v2 ?? "") !== (aw.code_v2 ?? "")) {
          throw new Error(
            `اختلاف code_v2 ${av.verse_key} pos=${i + 1}: محلي=${lw.code_v2} m1=${aw.code_v2}`,
          );
        }
        lw.line_number = aw.line_number;
        lw.position = aw.position;
        lw.page_number = n;
      }
      out.push(clone);
    }
    byPage[n] = out;
  }
  return byPage;
}

async function main() {
  console.log(`اعتماد حدود الصفحات من mushaf=${MUSHAF_ID_QCF_V2} (QCF V2 / hafs/v2)`);

  const { byPage: beforePages, verseMap } = await loadLocalPages();
  const beforeFp = fingerprintFromPages(beforePages);
  console.log("بصمة قبل:", beforeFp);

  // خريطة قديمة: صفحة → أول آية (لهجرة العلامات المرجعية)
  const legacyFirstAyah = {};
  for (let n = 1; n <= TOTAL; n++) {
    legacyFirstAyah[n] = beforePages[n][0].verse_key;
  }

  const mushaf1 = await loadMushaf1Pages();
  const afterPages = assembleFromMushaf1(verseMap, mushaf1);
  const afterFp = fingerprintFromPages(afterPages);

  console.log("بصمة بعد:", afterFp);
  if (
    beforeFp.codesSha !== afterFp.codesSha ||
    beforeFp.textsSha !== afterFp.textsSha ||
    beforeFp.verseOrderSha !== afterFp.verseOrderSha ||
    beforeFp.wordCount !== afterFp.wordCount ||
    beforeFp.ayahCount !== afterFp.ayahCount
  ) {
    console.error("❌ فشل بوابة التجزئة الكاملة — تراجع بلا كتابة");
    console.error({ beforeFp, afterFp });
    process.exit(1);
  }

  const issues = validateStructural(afterPages);
  if (issues.length) {
    console.error("❌ فشل البوابات البنيوية — تراجع بلا كتابة");
    console.error(issues.slice(0, 30));
    process.exit(1);
  }

  // نسخة احتياطية ثم كتابة
  await mkdir(BACKUP_DIR, { recursive: true });
  for (let n = 1; n <= TOTAL; n++) {
    await copyFile(pagePath(n), path.join(BACKUP_DIR, `page-${String(n).padStart(3, "0")}.json`));
  }

  let pagesChanged = 0;
  for (let n = 1; n <= TOTAL; n++) {
    const prevKeys = beforePages[n].map((v) => v.verse_key).join("|");
    const nextKeys = afterPages[n].map((v) => v.verse_key).join("|");
    const prevLines = beforePages[n]
      .flatMap((v) => v.words.map((w) => w.line_number))
      .join(",");
    const nextLines = afterPages[n]
      .flatMap((v) => v.words.map((w) => w.line_number))
      .join(",");
    if (prevKeys !== nextKeys || prevLines !== nextLines) pagesChanged++;
    await writeFile(pagePath(n), JSON.stringify(afterPages[n], null, 0) + "\n");
  }

  // حدود الصفحات للـ CI
  const boundaries = {};
  for (let n = 1; n <= TOTAL; n++) {
    boundaries[String(n)] = afterPages[n].map((v) => v.verse_key);
  }
  await writeFile(
    path.join(OUT_DIR, "page-boundaries.json"),
    JSON.stringify({ mushafId: MUSHAF_ID_QCF_V2, pages: boundaries }, null, 0) + "\n",
  );

  // توثيق المصدر — يمنع أي مزامنة من مصدر آخر
  const source = {
    mushafId: MUSHAF_ID_QCF_V2,
    mushafLabel: "QCF V2 / hafs v2",
    fonts: "public/fonts/qpc-v2/p{n}.woff2 ← quran.com/fonts/quran/hafs/v2/woff2",
    api: "https://api.qurancdn.com/api/qdc/verses/by_page/{n}?mushaf=1",
    adoptedAt: new Date().toISOString(),
    fingerprint: afterFp,
    policyAr:
      "المصحف المعتمد الوحيد لـ quran-v2 = mushaf=1. يُمنع جلب أو مزامنة حدود الصفحات/الأسطر من mushaf≠1.",
    forbiddenMushafIds: [2],
  };
  await writeFile(path.join(OUT_DIR, "SOURCE.json"), JSON.stringify(source, null, 2) + "\n");

  await writeFile(
    path.join(OUT_DIR, "legacy-page-first-ayah.json"),
    JSON.stringify(
      {
        noteAr:
          "أول آية كانت على كل صفحة قبل اعتماد mushaf=1 — لهجرة myBookmarks التي خزّنت رقم صفحة فقط",
        mushafIdBefore: 2,
        mushafIdAfter: MUSHAF_ID_QCF_V2,
        firstAyahByPage: legacyFirstAyah,
      },
      null,
      0,
    ) + "\n",
  );

  // حدّث نطاقات السور في chapters.json من الحدود الجديدة
  const chapters = JSON.parse(await readFile(path.join(OUT_DIR, "chapters.json"), "utf8"));
  const surahPages = new Map();
  for (let n = 1; n <= TOTAL; n++) {
    for (const v of afterPages[n]) {
      const s = Number(v.verse_key.split(":")[0]);
      if (!surahPages.has(s)) surahPages.set(s, { min: n, max: n });
      else {
        const o = surahPages.get(s);
        o.min = Math.min(o.min, n);
        o.max = Math.max(o.max, n);
      }
    }
  }
  for (const ch of chapters) {
    const sp = surahPages.get(ch.id);
    if (sp) ch.pages = [sp.min, sp.max];
  }
  await writeFile(path.join(OUT_DIR, "chapters.json"), JSON.stringify(chapters, null, 0) + "\n");

  // فهرس TypeScript لاستهلاك العلامات المرجعية (آية↔صفحة)
  const ayahToPage = {};
  const pageFirst = {};
  for (let n = 1; n <= TOTAL; n++) {
    pageFirst[n] = afterPages[n][0].verse_key;
    for (const v of afterPages[n]) ayahToPage[v.verse_key] = n;
  }
  const genPath = path.join(APP_ROOT, "src/lib/mushaf-ayah-page-index.generated.ts");
  const gen = `/**
 * مولَّد تلقائياً بواسطة adopt-mushaf1-page-boundaries.mjs — لا تحرر يدوياً.
 * فهرس صفحة↔آية لمصحف mushaf=1 + خريطة هجرة الصفحات القديمة.
 */
export const MUSHAF_ID = ${MUSHAF_ID_QCF_V2} as const;

/** أول آية كانت على الصفحة قبل اعتماد mushaf=1 */
export const LEGACY_PAGE_FIRST_AYAH: Record<number, string> = ${JSON.stringify(
    Object.fromEntries(Object.entries(legacyFirstAyah).map(([k, v]) => [Number(k), v])),
  )};

/** أول آية على كل صفحة وفق mushaf=1 الحالي */
export const PAGE_FIRST_AYAH_MUSHAF1: Record<number, string> = ${JSON.stringify(pageFirst)};

/** آية → صفحة mushaf=1 الحالية */
export const AYAH_TO_PAGE_MUSHAF1: Record<string, number> = ${JSON.stringify(ayahToPage)};
`;
  await writeFile(genPath, gen);

  console.log("✓ نجحت كل البوابات وكُتبت الصفحات");
  console.log(`  صفحات تغيّر محتواها/أسطرها: ${pagesChanged}`);
  console.log(`  نسخة احتياطية: ${BACKUP_DIR}`);
  console.log(`  SOURCE.json + page-boundaries.json + legacy-page-first-ayah.json`);
  console.log(`  ${genPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
